#!/usr/bin/env python3
"""Analyze Ice Snow City real-device performance JSON reports.

Usage:
  python3 scripts/analyze_real_device_performance.py \
    --input coverage/real-device-runs \
    --output coverage/real-device-report

The tool intentionally does not invent missing device or memory values. Missing
fields are reported as null/unknown and can block real-device validation.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import statistics
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Iterable


ALLOWED_SOURCES = {"ci-software", "ci-gpu", "ios-real", "android-real"}
REAL_SOURCES = {"ios-real", "android-real"}
REQUIRED_SAMPLE_FIELDS = {
    "mode",
    "quality",
    "engineFps",
    "averageFrameMs",
    "p95FrameMs",
    "droppedFrameRatio",
    "frames",
    "durationMs",
}


@dataclass
class ValidationIssue:
    severity: str
    file: str
    message: str


@dataclass
class RunSummary:
    file: str
    source: str | None
    platform: str | None
    model: str | None
    browser: str | None
    renderer: str | None
    quality: str | None
    mode: str | None
    engine_fps: float | None
    average_frame_ms: float | None
    p95_frame_ms: float | None
    dropped_frame_ratio: float | None
    frames: int | None
    duration_ms: float | None
    peak_observed_mb: float | None
    draw_calls: float | None
    status: str
    issues: str


@dataclass
class Thresholds:
    min_snow_fps: float = 45.0
    max_p95_frame_ms: float = 33.34
    max_dropped_ratio: float = 0.05
    max_draw_call_delta_ratio: float = 0.20


def finite_number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    return number if math.isfinite(number) else None


def integer_value(value: Any) -> int | None:
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    return value if value >= 0 else None


def percentile(values: Iterable[float], q: float) -> float | None:
    ordered = sorted(values)
    if not ordered:
        return None
    index = min(len(ordered) - 1, max(0, math.floor(len(ordered) * q)))
    return ordered[index]


def load_inputs(paths: list[Path]) -> list[tuple[Path, dict[str, Any]]]:
    files: list[Path] = []
    for path in paths:
        if path.is_dir():
            files.extend(sorted(path.rglob("*.json")))
        elif path.suffix.lower() == ".json":
            files.append(path)
    loaded: list[tuple[Path, dict[str, Any]]] = []
    for path in files:
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(value, dict):
            loaded.append((path, value))
        elif isinstance(value, list):
            for index, item in enumerate(value):
                if isinstance(item, dict):
                    loaded.append((path.with_name(f"{path.stem}-{index}.json"), item))
    return loaded


def validate_report(path: Path, report: dict[str, Any]) -> tuple[list[ValidationIssue], list[RunSummary]]:
    issues: list[ValidationIssue] = []
    source = report.get("source")
    if report.get("schemaVersion") != 1:
        issues.append(ValidationIssue("error", str(path), "schemaVersion must be 1"))
    if source not in ALLOWED_SOURCES:
        issues.append(ValidationIssue("error", str(path), f"source must be one of {sorted(ALLOWED_SOURCES)}"))
    device = report.get("device")
    if not isinstance(device, dict):
        issues.append(ValidationIssue("error", str(path), "device object is missing"))
        device = {}
    samples = report.get("samples")
    if not isinstance(samples, list) or not samples:
        issues.append(ValidationIssue("error", str(path), "samples must be a non-empty array"))
        samples = []
    if source in REAL_SOURCES:
        for field in ("platform", "browser", "renderer", "model"):
            if not device.get(field) or device.get(field) == "unknown":
                issues.append(ValidationIssue("error", str(path), f"real-device report requires device.{field}"))
        validation = report.get("validation")
        if not isinstance(validation, dict) or validation.get("status") != "validated":
            issues.append(ValidationIssue("error", str(path), "real-device report requires validation.status=validated"))
        if isinstance(validation, dict) and validation.get("realDeviceEvidenceRequired") is not False:
            issues.append(ValidationIssue("error", str(path), "real-device report requires realDeviceEvidenceRequired=false"))

    summaries: list[RunSummary] = []
    for index, sample in enumerate(samples):
        if not isinstance(sample, dict):
            issues.append(ValidationIssue("error", str(path), f"samples[{index}] is not an object"))
            continue
        missing = sorted(REQUIRED_SAMPLE_FIELDS - sample.keys())
        for field in missing:
            issues.append(ValidationIssue("error", str(path), f"samples[{index}] missing {field}"))
        mode = sample.get("mode")
        quality = sample.get("quality")
        if mode not in {"baseline", "snow"}:
            issues.append(ValidationIssue("error", str(path), f"samples[{index}].mode is invalid"))
        if not isinstance(quality, str) or not quality:
            issues.append(ValidationIssue("error", str(path), f"samples[{index}].quality is invalid"))
        summary = RunSummary(
            file=str(path),
            source=source if isinstance(source, str) else None,
            platform=device.get("platform") if isinstance(device.get("platform"), str) else None,
            model=device.get("model") if isinstance(device.get("model"), str) else None,
            browser=device.get("browser") if isinstance(device.get("browser"), str) else None,
            renderer=device.get("renderer") if isinstance(device.get("renderer"), str) else None,
            quality=quality if isinstance(quality, str) else None,
            mode=mode if isinstance(mode, str) else None,
            engine_fps=finite_number(sample.get("engineFps")),
            average_frame_ms=finite_number(sample.get("averageFrameMs")),
            p95_frame_ms=finite_number(sample.get("p95FrameMs")),
            dropped_frame_ratio=finite_number(sample.get("droppedFrameRatio")),
            frames=integer_value(sample.get("frames")),
            duration_ms=finite_number(sample.get("durationMs")),
            peak_observed_mb=finite_number(sample.get("peakObservedMb")),
            draw_calls=finite_number(sample.get("drawCalls")),
            status="pending",
            issues="",
        )
        if summary.engine_fps is None or summary.average_frame_ms is None or summary.p95_frame_ms is None:
            issues.append(ValidationIssue("error", str(path), f"samples[{index}] has invalid frame metrics"))
        if summary.dropped_frame_ratio is None or not 0 <= summary.dropped_frame_ratio <= 1:
            issues.append(ValidationIssue("error", str(path), f"samples[{index}].droppedFrameRatio must be in [0,1]"))
        summaries.append(summary)
    return issues, summaries


def assess_runs(summaries: list[RunSummary], issues: list[ValidationIssue], thresholds: Thresholds) -> None:
    issues_by_file: dict[str, list[str]] = {}
    for issue in issues:
        issues_by_file.setdefault(issue.file, []).append(issue.message)
    for summary in summaries:
        local: list[str] = list(issues_by_file.get(summary.file, []))
        if summary.mode == "snow":
            if summary.engine_fps is not None and summary.engine_fps < thresholds.min_snow_fps:
                local.append(f"snow FPS {summary.engine_fps:.2f} < {thresholds.min_snow_fps:.2f}")
            if summary.p95_frame_ms is not None and summary.p95_frame_ms > thresholds.max_p95_frame_ms:
                local.append(f"P95 {summary.p95_frame_ms:.2f}ms > {thresholds.max_p95_frame_ms:.2f}ms")
            if summary.dropped_frame_ratio is not None and summary.dropped_frame_ratio > thresholds.max_dropped_ratio:
                local.append(f"dropped ratio {summary.dropped_frame_ratio:.2%} > {thresholds.max_dropped_ratio:.2%}")
        summary.issues = "; ".join(dict.fromkeys(local))
        summary.status = "blocked" if local else "pass"


def median_or_none(values: Iterable[float | None]) -> float | None:
    clean = [value for value in values if value is not None]
    return statistics.median(clean) if clean else None


def write_csv(path: Path, summaries: list[RunSummary]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(asdict(summaries[0]).keys()) if summaries else list(RunSummary.__dataclass_fields__.keys()))
        writer.writeheader()
        for summary in summaries:
            writer.writerow(asdict(summary))


def format_value(value: float | None, suffix: str = "") -> str:
    return "n/a" if value is None else f"{value:.2f}{suffix}"


def format_ratio(value: float | None) -> str:
    return "n/a" if value is None else f"{value * 100:.2f}%"


def write_markdown(path: Path, summaries: list[RunSummary], issues: list[ValidationIssue], thresholds: Thresholds) -> None:
    overall = "BLOCKED" if any(item.status == "blocked" for item in summaries) or issues else "PASS"
    lines = [
        "# Real-device performance report",
        "",
        f"**Overall status:** `{overall}`",
        "",
        "This report does not invent missing device, memory, GPU, or frame-time values. Missing or invalid evidence remains blocked.",
        "",
        "## Thresholds",
        "",
        "| Metric | Threshold |",
        "|---|---:|",
        f"| Snow FPS | ≥ {thresholds.min_snow_fps:.2f} |",
        f"| Snow P95 frame time | ≤ {thresholds.max_p95_frame_ms:.2f} ms |",
        f"| Snow dropped-frame ratio | ≤ {thresholds.max_dropped_ratio:.2%} |",
        "",
        "## Samples",
        "",
        "| File | Source | Device | Mode | Quality | FPS | Avg ms | P95 ms | Dropped | Peak MB | Status |",
        "|---|---|---|---|---|---:|---:|---:|---:|---:|---|",
    ]
    for item in summaries:
        device = " ".join(filter(None, [item.platform, item.model])) or "unknown"
        peak = format_value(item.peak_observed_mb)
        lines.append(
            f"| `{item.file}` | `{item.source or 'unknown'}` | {device} | {item.mode or 'unknown'} | {item.quality or 'unknown'} | {format_value(item.engine_fps)} | {format_value(item.average_frame_ms)} | {format_value(item.p95_frame_ms)} | {format_ratio(item.dropped_frame_ratio)} | {peak} | **{item.status}** |"
        )
    lines.extend(["", "## Aggregates", "", "| Group | Median FPS | Median P95 ms | Median dropped ratio |", "|---|---:|---:|---:|"])
    groups: dict[tuple[str | None, str | None], list[RunSummary]] = {}
    for item in summaries:
        groups.setdefault((item.source, item.mode), []).append(item)
    for (source, mode), group in sorted(groups.items(), key=lambda entry: str(entry[0])):
        lines.append(f"| `{source or 'unknown'}` / `{mode or 'unknown'}` | {format_value(median_or_none(x.engine_fps for x in group))} | {format_value(median_or_none(x.p95_frame_ms for x in group))} | {format_ratio(median_or_none(x.dropped_frame_ratio for x in group))} |")
    lines.extend(["", "## Validation issues", ""])
    if issues:
        for issue in issues:
            lines.append(f"- **{issue.severity}** `{issue.file}`: {issue.message}")
    else:
        lines.append("No schema or evidence issues detected.")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_png(path: Path, summaries: list[RunSummary]) -> None:
    try:
        import matplotlib.pyplot as plt
    except ImportError as exc:
        raise RuntimeError("matplotlib is required for PNG output") from exc
    labels = [f"{item.mode or '?'}\n{item.quality or '?'}\n{Path(item.file).stem[:18]}" for item in summaries]
    fps = [item.engine_fps or 0 for item in summaries]
    p95 = [item.p95_frame_ms or 0 for item in summaries]
    fig, axes = plt.subplots(2, 1, figsize=(14, 9), constrained_layout=True)
    colors = ["#4c78a8" if item.mode == "baseline" else "#f58518" for item in summaries]
    axes[0].bar(labels, fps, color=colors)
    axes[0].axhline(45, color="#d62728", linestyle="--", linewidth=1, label="snow FPS threshold")
    axes[0].set_ylabel("FPS")
    axes[0].set_title("Performance samples: FPS")
    axes[0].legend()
    axes[0].tick_params(axis="x", labelrotation=35)
    axes[1].bar(labels, p95, color=colors)
    axes[1].axhline(33.34, color="#d62728", linestyle="--", linewidth=1, label="P95 threshold")
    axes[1].set_ylabel("P95 frame time (ms)")
    axes[1].set_title("Performance samples: P95 frame time")
    axes[1].legend()
    axes[1].tick_params(axis="x", labelrotation=35)
    fig.savefig(path, dpi=160)
    plt.close(fig)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", action="append", required=True, type=Path, help="JSON file or directory; repeatable")
    parser.add_argument("--output", required=True, type=Path, help="Output directory")
    parser.add_argument("--min-snow-fps", type=float, default=45.0)
    parser.add_argument("--max-p95-ms", type=float, default=33.34)
    parser.add_argument("--max-dropped-ratio", type=float, default=0.05)
    parser.add_argument("--fail-on-blocked", action="store_true", help="Exit 2 when validation or thresholds fail")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    loaded = load_inputs(args.input)
    issues: list[ValidationIssue] = []
    summaries: list[RunSummary] = []
    for path, report in loaded:
        report_issues, report_summaries = validate_report(path, report)
        issues.extend(report_issues)
        summaries.extend(report_summaries)
    if not loaded:
        issues.append(ValidationIssue("error", "<inputs>", "no JSON reports found"))
    thresholds = Thresholds(args.min_snow_fps, args.max_p95_ms, args.max_dropped_ratio)
    assess_runs(summaries, issues, thresholds)
    write_csv(args.output / "performance-summary.csv", summaries)
    write_markdown(args.output / "performance-report.md", summaries, issues, thresholds)
    write_png(args.output / "performance-summary.png", summaries)
    validation = {
        "status": "blocked" if issues or any(item.status == "blocked" for item in summaries) else "pass",
        "thresholds": asdict(thresholds),
        "inputCount": len(loaded),
        "sampleCount": len(summaries),
        "issues": [asdict(issue) for issue in issues],
        "samples": [asdict(item) for item in summaries],
    }
    (args.output / "validation.json").write_text(json.dumps(validation, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"status": validation["status"], "inputCount": len(loaded), "sampleCount": len(summaries), "output": str(args.output)}, ensure_ascii=False))
    return 2 if args.fail_on_blocked and validation["status"] == "blocked" else 0


if __name__ == "__main__":
    raise SystemExit(main())
