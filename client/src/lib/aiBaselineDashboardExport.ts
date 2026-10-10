import type {
  BaselineAssetSnapshot,
  PerformanceSnapshot,
} from "./aiBaselineDashboardData";

export interface DashboardExportInput {
  assets: BaselineAssetSnapshot[];
  performance: PerformanceSnapshot[];
  meta: {
    source: string;
    highFidelityDelivery: string;
    realDeviceEvidenceRequired: boolean;
    lastValidated: string;
    analyzerStatus: string;
    externalPendingCount: number;
  };
}

const csvEscape = (value: string | number | boolean): string => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const statusLabel: Record<string, string> = {
  pass: "PASS",
  warning: "WARNING",
  pending: "PENDING_EVIDENCE",
  fail: "FAIL",
};

export const buildBaselineCsv = ({ assets, performance, meta }: DashboardExportInput): string => {
  const rows: Array<Array<string | number | boolean>> = [
    ["report_type", "ai_baseline_asset_quality"],
    ["source", meta.source],
    ["high_fidelity_delivery", meta.highFidelityDelivery],
    ["real_device_evidence_required", meta.realDeviceEvidenceRequired],
    ["last_validated", meta.lastValidated],
    ["analyzer_status", meta.analyzerStatus],
    ["external_pending_count", meta.externalPendingCount],
    [],
    ["asset_id", "display_name", "kind", "source", "asset_status", "bytes", "lod0_triangles", "materials", "lod_count", "check_key", "check_label", "check_status", "check_summary", "check_detail", "warnings"],
  ];

  assets.forEach((asset) => {
    asset.checks.forEach((check) => {
      rows.push([
        asset.assetId,
        asset.displayName,
        asset.kind,
        asset.source,
        asset.status,
        asset.bytes,
        asset.trianglesLod0,
        asset.materials,
        asset.lodCount,
        check.key,
        check.label,
        statusLabel[check.status] ?? check.status,
        check.summary,
        check.detail,
        asset.warnings.join(" | "),
      ]);
    });
  });

  rows.push([], ["performance_label", "baseline_fps", "snow_fps", "baseline_p95_ms", "snow_p95_ms", "dropped_frame_delta"]);
  performance.forEach((snapshot) => rows.push([
    snapshot.label,
    snapshot.baselineFps,
    snapshot.snowFps,
    snapshot.baselineP95Ms,
    snapshot.snowP95Ms,
    snapshot.droppedFrameDelta,
  ]));

  return `\uFEFF${rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\r\n")}\r\n`;
};

const pdfEscape = (value: string): string => value
  .normalize("NFKD")
  .replace(/[^\x20-\x7E]/g, "?")
  .replaceAll("\\", "\\\\")
  .replaceAll("(", "\\(")
  .replaceAll(")", "\\)");

const wrapAscii = (value: string, width = 92): string[] => {
  const ascii = value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?");
  const lines: string[] = [];
  for (let index = 0; index < ascii.length; index += width) lines.push(ascii.slice(index, index + width));
  return lines.length ? lines : [""];
};

/**
 * Builds a compact, standards-readable PDF using built-in Helvetica.
 * Non-Latin UI labels are represented with `?` rather than silently producing
 * a malformed file; the ASCII asset IDs and gate semantics remain intact.
 */
export const buildBaselinePdf = ({ assets, performance, meta }: DashboardExportInput): ArrayBuffer => {
  const lines: string[] = [
    "ICE SNOW CITY - AI BASELINE ASSET QUALITY REPORT",
    "",
    `Source: ${meta.source}`,
    `High fidelity delivery: ${meta.highFidelityDelivery}`,
    `Real device evidence required: ${meta.realDeviceEvidenceRequired}`,
    `Last validated: ${meta.lastValidated}`,
    `Analyzer status: ${meta.analyzerStatus}`,
    `External pending count: ${meta.externalPendingCount}`,
    "",
    "Evidence boundary: procedural-baseline and ci-software are development substitutes.",
    "They do not prove real high-fidelity assets or iOS/Android device evidence.",
    "",
    "ASSET CHECKS",
  ];

  assets.forEach((asset) => {
    lines.push(`${asset.assetId} | ${asset.status} | ${asset.bytes} bytes | LOD0 tris ${asset.trianglesLod0}`);
    asset.checks.forEach((check) => lines.push(`  ${check.key}: ${statusLabel[check.status] ?? check.status} - ${check.summary}`));
  });

  lines.push("", "PERFORMANCE SNAPSHOTS");
  performance.forEach((snapshot) => lines.push(`${snapshot.label}: baseline FPS ${snapshot.baselineFps}, snow FPS ${snapshot.snowFps}, baseline P95 ${snapshot.baselineP95Ms} ms, snow P95 ${snapshot.snowP95Ms} ms, dropped delta ${snapshot.droppedFrameDelta}`));
  lines.push("", "This report is a development QA export. It cannot upgrade release gates.");

  const contentLines = lines.flatMap((line) => wrapAscii(line));
  const pageLines = 48;
  const pages: string[][] = [];
  for (let index = 0; index < contentLines.length; index += pageLines) pages.push(contentLines.slice(index, index + pageLines));

  const objects: string[] = [];
  const addObject = (body: string) => { objects.push(body); return objects.length; };
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  pages.forEach((page) => {
    const commands = ["BT", "/F1 9 Tf", "50 760 Td", "12 TL", ...page.flatMap((line) => [`(${pdfEscape(line)}) Tj`, "0 -12 Td"]), "ET"].join("\n");
    const contentId = addObject(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
    contentIds.push(contentId);
    pageIds.push(0);
  });
  const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map((_, index) => `${objects.length + index + 1} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  pages.forEach((_, index) => {
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`);
    pageIds[index] = pageId;
  });
  // The page object references are known after insertion; rebuild the Pages object body.
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let output = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = output.length;
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) output += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(output).buffer as ArrayBuffer;
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
