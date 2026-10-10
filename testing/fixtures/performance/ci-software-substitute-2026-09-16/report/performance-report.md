# Real-device performance report

**Overall status:** `PASS`

This report does not invent missing device, memory, GPU, or frame-time values. Missing or invalid evidence remains blocked.

## Thresholds

| Metric | Threshold |
|---|---:|
| Snow FPS | ≥ 45.00 |
| Snow P95 frame time | ≤ 33.34 ms |
| Snow dropped-frame ratio | ≤ 5.00% |

## Samples

| File | Source | Device | Mode | Quality | FPS | Avg ms | P95 ms | Dropped | Peak MB | Status |
|---|---|---|---|---|---:|---:|---:|---:|---:|---|
| `testing/fixtures/performance/ci-software-substitute-2026-09-16/ci-software-substitute.json` | `ci-software` | ci-linux ice-snow-city-development-substitute | baseline | medium | 58.00 | 17.24 | 22.50 | 1.00% | n/a | **pass** |
| `testing/fixtures/performance/ci-software-substitute-2026-09-16/ci-software-substitute.json` | `ci-software` | ci-linux ice-snow-city-development-substitute | snow | medium | 52.00 | 19.23 | 28.00 | 2.00% | n/a | **pass** |

## Aggregates

| Group | Median FPS | Median P95 ms | Median dropped ratio |
|---|---:|---:|---:|
| `ci-software` / `baseline` | 58.00 | 22.50 | 1.00% |
| `ci-software` / `snow` | 52.00 | 28.00 | 2.00% |

## Validation issues

No schema or evidence issues detected.
