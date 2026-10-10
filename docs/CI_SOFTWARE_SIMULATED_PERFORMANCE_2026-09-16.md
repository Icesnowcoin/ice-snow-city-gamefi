# CI Software Simulated Performance Evidence — 2026-09-16

## Evidence boundary

This package is an autonomous development substitute for exercising the performance-analysis and upload-validation pipeline. It is intentionally marked `source=ci-software`, uses a software-rendered Chromium fixture, and retains `realDeviceEvidenceRequired=true`. It must not be used to claim iOS or Android device performance, release readiness, or high-fidelity asset approval.

## Input and result

| Item | Result |
|---|---|
| Input | `testing/fixtures/performance/ci-software-substitute-2026-09-16/ci-software-substitute.json` |
| Samples | 2: `baseline` and `snow`, both `medium` quality |
| Performance analyzer | `status=pass`, `inputCount=1`, `sampleCount=2` |
| Upload validation | `status=dry-run-valid`, `sources=[ci-software]`, `files=1`, `samples=2` |
| GitHub side effect | None; dry-run only |
| Real-device status | Still pending |

## Reproduction

```bash
python3 scripts/analyze_real_device_performance.py \
  --input testing/fixtures/performance/ci-software-substitute-2026-09-16/ci-software-substitute.json \
  --output testing/fixtures/performance/ci-software-substitute-2026-09-16/report

python3 scripts/upload_real_device_performance.py \
  --input testing/fixtures/performance/ci-software-substitute-2026-09-16/ci-software-substitute.json \
  --repo ice-snow-city/ice_snow_city_agent \
  --dry-run \
  --allow-software
```

The package contains explicit provenance fields: `kind=simulated-development-substitute`, `notRealDeviceEvidence=true`, and `notForReleaseGate=true`. Any real-device delivery must be a separate package collected on iOS or Android hardware and must pass the existing external delivery validator.
