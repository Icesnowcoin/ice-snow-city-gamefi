import json
import tempfile
import unittest
from pathlib import Path

from analyze_real_device_performance import (
    Thresholds,
    load_inputs,
    validate_report,
    assess_runs,
)


class PerformanceAnalyzerTests(unittest.TestCase):
    def make_report(self, *, source="ios-real", fps=56.0, p95=20.0, dropped=0.01):
        return {
            "schemaVersion": 1,
            "generatedAt": "2026-09-06T00:00:00.000Z",
            "source": source,
            "device": {
                "platform": "ios",
                "browser": "Safari 18",
                "renderer": "WebGL2 Apple GPU",
                "devicePixelRatio": 3,
                "model": "iPhone15,4",
            },
            "samples": [
                {
                    "mode": "baseline",
                    "quality": "medium",
                    "engineFps": 58.0,
                    "averageFrameMs": 17.2,
                    "p95FrameMs": 22.0,
                    "droppedFrameRatio": 0.01,
                    "frames": 2900,
                    "durationMs": 50000,
                },
                {
                    "mode": "snow",
                    "quality": "medium",
                    "engineFps": fps,
                    "averageFrameMs": 1000 / fps,
                    "p95FrameMs": p95,
                    "droppedFrameRatio": dropped,
                    "frames": 2800,
                    "durationMs": 50000,
                },
            ],
            "comparison": {
                "averageFrameDeltaMs": 0.8,
                "p95FrameDeltaMs": 2.0,
                "droppedFrameRatioDelta": 0.01,
                "snowFps": fps,
            },
            "validation": {
                "status": "validated",
                "realDeviceEvidenceRequired": False,
            },
        }

    def test_valid_real_device_report_passes(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "ios.json"
            path.write_text(json.dumps(self.make_report()), encoding="utf-8")
            loaded = load_inputs([path])
            issues, summaries = validate_report(*loaded[0])
            assess_runs(summaries, issues, Thresholds())
            self.assertEqual([], issues)
            self.assertTrue(all(item.status == "pass" for item in summaries))

    def test_threshold_failure_is_blocked(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "ios.json"
            path.write_text(json.dumps(self.make_report(fps=39, p95=40, dropped=0.12)), encoding="utf-8")
            loaded = load_inputs([path])
            issues, summaries = validate_report(*loaded[0])
            assess_runs(summaries, issues, Thresholds())
            snow = next(item for item in summaries if item.mode == "snow")
            self.assertEqual("blocked", snow.status)
            self.assertIn("snow FPS", snow.issues)
            self.assertIn("P95", snow.issues)
            self.assertIn("dropped ratio", snow.issues)

    def test_real_device_missing_evidence_is_rejected(self):
        report = self.make_report()
        report["device"]["model"] = None
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "ios.json"
            path.write_text(json.dumps(report), encoding="utf-8")
            loaded = load_inputs([path])
            issues, _ = validate_report(*loaded[0])
            self.assertTrue(any("device.model" in issue.message for issue in issues))

    def test_software_source_can_be_loaded_without_real_device_claim(self):
        report = self.make_report(source="ci-software")
        report["device"]["platform"] = "linux"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "ci.json"
            path.write_text(json.dumps(report), encoding="utf-8")
            loaded = load_inputs([path])
            issues, summaries = validate_report(*loaded[0])
            assess_runs(summaries, issues, Thresholds())
            self.assertEqual([], issues)
            self.assertTrue(all(item.status == "pass" for item in summaries))


if __name__ == "__main__":
    unittest.main()
