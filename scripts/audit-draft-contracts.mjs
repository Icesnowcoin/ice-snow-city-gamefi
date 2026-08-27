import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = ["contracts/TaxSystem.sol", "contracts/ISCSeaportStyleMarketplaceOffersDraft.sol"];
const checks = [
  ["no_owner_surface", /\b(onlyOwner|transferOwnership|renounceOwnership)\b|function\s+owner\s*\(/, false, "未暴露 owner 管理面"],
  ["no_proxy_surface", /\b(proxy|upgradeTo|UUPS|TransparentUpgradeableProxy)\b/i, false, "未暴露代理/升级面"],
  ["no_mint_surface", /\b(mint|_mint)\s*\(/, false, "未暴露增发入口"],
  ["no_pause_surface", /\b(pause|unpause)\s*\(/, false, "未暴露暂停入口"],
  ["reentrancy_guard", /ReentrancyGuard/, true, "使用重入保护"],
  ["checked_erc20_transfer", /transferFrom\([^;]+\)\s*(?:if\s*\()?/s, true, "存在 ERC-20 transferFrom 调用并需审计返回值"],
];

const results = files.map((relativePath) => {
  const rawSource = fs.readFileSync(path.join(root, relativePath), "utf8");
  const source = rawSource.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const findings = checks.map(([id, pattern, expected, message]) => ({
    id,
    passed: pattern.test(source) === expected,
    message,
  }));
  const readConstant = (name) => source.match(new RegExp(`${name}\\s*=\\s*(\\d[\\d_]*)`))?.[1]?.replaceAll("_", "") ?? null;
  const commission = readConstant("COMMISSION_BPS");
  const treasuryBps = readConstant("TREASURY_BPS");
  const marketingBps = readConstant("MARKETING_BPS");
  return {
    contract: relativePath,
    status: findings.every((finding) => finding.passed) ? "static-check-passed" : "review-required",
    findings,
    constants: { commissionBps: commission ? Number(commission) : null, treasuryBps: treasuryBps ? Number(treasuryBps) : null, marketingBps: marketingBps ? Number(marketingBps) : null },
    warning: "源码静态检查不等于第三方审计、字节码验证或部署批准。",
  };
});

const report = { generatedAt: new Date().toISOString(), writeOperations: false, results };
console.log(JSON.stringify(report, null, 2));
