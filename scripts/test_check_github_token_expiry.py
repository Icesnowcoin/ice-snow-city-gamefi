#!/usr/bin/env python3
"""Unit tests for check_github_token_expiry.py."""

from __future__ import annotations

import datetime as dt
import json
import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(__file__))
import check_github_token_expiry as checker  # noqa: E402


class TokenExpiryTests(unittest.TestCase):
    def test_parse_date_and_timestamp(self) -> None:
        self.assertEqual(checker.parse_expiry("2026-12-17"), dt.date(2026, 12, 17))
        self.assertEqual(checker.parse_expiry("2026-12-17T23:00:00Z"), dt.date(2026, 12, 17))

    def test_parse_invalid_date(self) -> None:
        with self.assertRaises(checker.CheckError):
            checker.parse_expiry("not-a-date")

    def test_safe_text_redacts_tokens(self) -> None:
        value = "Authorization: Bearer token_fixture_redacted"
        result = checker.safe_text(value)
        self.assertNotIn("token_fixture_redacted", result)
        self.assertIn("[redacted]", result)

    def test_missing_expiry_fails_closed_by_default(self) -> None:
        args = checker.build_parser().parse_args(["--repo", "owner/repo"])
        with patch.dict(os.environ, {"ISC_GITHUB_TOKEN": "test-token"}, clear=True):
            with self.assertRaises(checker.CheckError) as context:
                checker.check(args)
        self.assertIn("missing expiry metadata", str(context.exception))

    def test_healthy_read_only_check(self) -> None:
        args = checker.build_parser().parse_args(["--repo", "owner/repo", "--expires-at", "2099-01-01"])
        responses = [
            checker.ApiResponse(200, {"login": "owner"}, {}),
            checker.ApiResponse(200, {"permissions": {"pull": True, "push": True}}, {}),
            checker.ApiResponse(200, {"total_count": 2}, {}),
        ]
        with patch.dict(os.environ, {"ISC_GITHUB_TOKEN": "test-token"}, clear=True):
            with patch.object(checker, "api_request", side_effect=responses):
                code, report = checker.check(args)
        self.assertEqual(code, 0)
        self.assertEqual(report["expiryStatus"], "healthy")
        self.assertEqual(report["account"], "owner")
        self.assertEqual(report["workflowsVisible"], 2)

    def test_expired_check_returns_distinct_code(self) -> None:
        args = checker.build_parser().parse_args(["--repo", "owner/repo", "--expires-at", "2000-01-01"])
        responses = [
            checker.ApiResponse(200, {"login": "owner"}, {}),
            checker.ApiResponse(200, {"permissions": {}}, {}),
            checker.ApiResponse(200, {"total_count": 0}, {}),
        ]
        with patch.dict(os.environ, {"ISC_GITHUB_TOKEN": "test-token"}, clear=True):
            with patch.object(checker, "api_request", side_effect=responses):
                code, report = checker.check(args)
        self.assertEqual(code, 10)
        self.assertEqual(report["expiryStatus"], "expired")

    def test_json_report_is_serializable_without_token(self) -> None:
        args = checker.build_parser().parse_args(["--repo", "owner/repo", "--expires-at", "2099-01-01"])
        responses = [
            checker.ApiResponse(200, {"login": "owner"}, {}),
            checker.ApiResponse(200, {"permissions": {}}, {}),
            checker.ApiResponse(200, {"total_count": 0}, {}),
        ]
        with patch.dict(os.environ, {"ISC_GITHUB_TOKEN": "test-token"}, clear=True):
            with patch.object(checker, "api_request", side_effect=responses):
                _, report = checker.check(args)
        encoded = json.dumps(report)
        self.assertNotIn("test-token", encoded)


if __name__ == "__main__":
    unittest.main()
