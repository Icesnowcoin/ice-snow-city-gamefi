import json
import tempfile
import argparse
import unittest
from pathlib import Path
from unittest.mock import patch

from upload_real_device_performance import (
    UploadError,
    collect_files,
    notify_slack,
    safe_error_text,
    safe_remote_name,
    upload_and_dispatch,
    validate_uploads,
)


class UploadPerformanceTests(unittest.TestCase):
    def report(self, source="ios-real"):
        return {
            "schemaVersion": 1,
            "source": source,
            "device": {
                "platform": "ios",
                "browser": "Safari",
                "renderer": "WebGL2",
                "model": "test-device",
            },
            "samples": [
                {
                    "mode": "snow",
                    "quality": "medium",
                    "engineFps": 52,
                    "averageFrameMs": 19.2,
                    "p95FrameMs": 28,
                    "droppedFrameRatio": 0.02,
                    "frames": 2600,
                    "durationMs": 50000,
                }
            ],
            "validation": {"status": "validated", "realDeviceEvidenceRequired": False},
        }

    def write_report(self, report):
        directory = tempfile.TemporaryDirectory()
        path = Path(directory.name) / "capture.json"
        path.write_text(json.dumps(report), encoding="utf-8")
        return directory, path

    def test_real_device_report_is_uploadable(self):
        directory, path = self.write_report(self.report())
        self.addCleanup(directory.cleanup)
        collected = collect_files([path])
        result = validate_uploads(collected, allow_software=False)
        self.assertEqual("validated", result["status"])
        self.assertEqual(["ios-real"], result["sources"])

    def test_software_report_requires_explicit_opt_in(self):
        directory, path = self.write_report(self.report("ci-software"))
        self.addCleanup(directory.cleanup)
        collected = collect_files([path])
        with self.assertRaises(UploadError):
            validate_uploads(collected, allow_software=False)
        result = validate_uploads(collected, allow_software=True)
        self.assertEqual("validated", result["status"])

    def test_threshold_failure_is_rejected(self):
        report = self.report()
        report["samples"][0]["engineFps"] = 20
        report["samples"][0]["p95FrameMs"] = 60
        directory, path = self.write_report(report)
        self.addCleanup(directory.cleanup)
        with self.assertRaises(UploadError) as context:
            validate_uploads(collect_files([path]), allow_software=False)
        self.assertIn("performance threshold blocked", str(context.exception))

    def test_sensitive_fields_are_rejected(self):
        report = self.report()
        report["device"]["serialNumber"] = "private-device-id"
        directory, path = self.write_report(report)
        self.addCleanup(directory.cleanup)
        with self.assertRaises(UploadError) as context:
            validate_uploads(collect_files([path]), allow_software=False)
        self.assertIn("sensitive field/value detected", str(context.exception))

    def test_upload_and_dispatch_uses_isolated_branch_and_dispatches_workflow(self):
        directory, path = self.write_report(self.report())
        self.addCleanup(directory.cleanup)
        collected = collect_files([path])
        calls = []

        def fake_api_request(token, method, url, payload=None):
            calls.append((token, method, url, payload))
            if method == "GET":
                return {"object": {"sha": "base-sha"}}
            return {}

        args = argparse.Namespace(
            repo="owner/repo",
            base_branch="main",
            remote_dir="performance-data",
            workflow="real-device-performance.yml",
            branch_prefix="perf-data",
        )
        with patch("upload_real_device_performance.api_request", side_effect=fake_api_request):
            result = upload_and_dispatch(args, collected, "test-token")
        self.assertEqual("uploaded", result["status"])
        self.assertEqual("base-sha", result["baseSha"])
        self.assertEqual(4, len(calls))
        self.assertEqual("GET", calls[0][1])
        self.assertEqual("POST", calls[1][1])
        self.assertEqual("PUT", calls[2][1])
        self.assertEqual("POST", calls[3][1])
        self.assertIn("/actions/workflows/real-device-performance.yml/dispatches", calls[3][2])

    def test_slack_success_notification_uses_webhook_without_sensitive_data(self):
        args = argparse.Namespace(
            notify_slack=True,
            slack_webhook_env="TEST_SLACK_WEBHOOK",
            repo="owner/repo",
            workflow="real-device-performance.yml",
        )
        with patch.dict("os.environ", {"TEST_SLACK_WEBHOOK": "https://hooks.slack.test/services/redacted"}):
            with patch("upload_real_device_performance.post_slack") as send:
                notify_slack(args, "TRIGGER ACCEPTED", "branch=perf-data/test files=1")
        send.assert_called_once()
        message = send.call_args.args[1]
        self.assertIn("TRIGGER ACCEPTED", message)
        self.assertNotIn("redacted", message)

    def test_slack_missing_webhook_fails_closed(self):
        args = argparse.Namespace(
            notify_slack=True,
            slack_webhook_env="MISSING_SLACK_WEBHOOK",
            repo="owner/repo",
            workflow="real-device-performance.yml",
        )
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaises(UploadError):
                notify_slack(args, "FAILED", "blocked")

    def test_slack_error_summary_redacts_tokens(self):
        summary = safe_error_text(RuntimeError("Bearer abcdefghijklmnop ghp_12345678901234567890"))
        self.assertNotIn("abcdefghijklmnop", summary)
        self.assertNotIn("ghp_12345678901234567890", summary)
        self.assertIn("redacted", summary)

    def test_remote_name_collision_is_disambiguated(self):
        used = set()
        first = safe_remote_name(Path("a/capture.json"), used)
        second = safe_remote_name(Path("b/capture.json"), used)
        self.assertEqual("capture.json", first)
        self.assertTrue(second.startswith("capture-"))
        self.assertTrue(second.endswith(".json"))


if __name__ == "__main__":
    unittest.main()
