from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_real_device_prerequisites.py"


class RealDevicePrerequisiteTests(unittest.TestCase):
    def test_allow_missing_returns_machine_readable_pending_report(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--allow-missing", "--json"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        report = json.loads(result.stdout)
        self.assertEqual(report["status"], "preflight-only")
        self.assertEqual(report["validation"], "pending")
        self.assertFalse(report["realDeviceEvidence"])
        self.assertEqual(report["nextStep"], "Collect baseline and snow JSON on each target, then run analyze_real_device_performance.py.")

    def test_preflight_never_claims_real_device_metrics(self) -> None:
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn('"realDeviceEvidence": False', source)
        self.assertIn('"validation": "pending"', source)
        self.assertNotIn('"fps"', source)
        self.assertNotIn('"p95"', source)


if __name__ == "__main__":
    unittest.main()
