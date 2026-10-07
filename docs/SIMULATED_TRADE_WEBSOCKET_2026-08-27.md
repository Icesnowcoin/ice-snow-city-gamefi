# 模拟交易历史 WebSocket 机制

## 范围

本机制仅服务于 `local-hardhat` 模拟环境。它不连接真实主网、不读取真实链上事件，也不执行链上写入。生产接入真实 WebSocket 或事件索引器时，必须复用相同的消息校验与序号规则，并重新完成审计。

## 消息协议

每条状态消息使用 `trade.status` 类型，并包含 `stream: "local-hardhat"`、稳定的 `eventId`、单调递增的 `sequence`、订单 ID、目标状态、可选交易哈希和 UTC 时间。面板只接受 local-hardhat 流，其他 stream 会被丢弃。

## 一致性与生命周期

事件以 `sequence` 做幂等门禁。重复或乱序事件不会回退订单状态；只有较新的事件才会更新持仓式交易记录。组件挂载时建立订阅，卸载时取消订阅并关闭模拟 socket。脚本推送器按可配置间隔发布事件，并提供停止函数清理计时器。

订单更新后在面板中提供 800ms 的轻量背景高亮，动画只使用颜色与透明度过渡，不改变表格布局。连接状态和最近同步序号对用户可见，便于区分模拟实时数据与静态历史。

## 验证结果

模拟 WebSocket、事件去重、乱序保护、脚本推送停止、跨流拒绝、交易历史面板回归共 8 项测试通过；TypeScript 检查通过；384MB 内存上限下生产构建通过。测试环境使用 Vitest、jsdom 和 fake timers，不能替代真实浏览器网络压力测试。

## 断线重连与错误处理

模拟连接支持 `OPEN`、`CONNECTING`、`RECONNECTING` 和 `CLOSED` 状态。断线会产生 `DISCONNECTED` 错误，并按 250ms 基础间隔执行指数退避，默认最多尝试 3 次；超过上限后进入不可重试的 `RECONNECT_EXHAUSTED`。非 `local-hardhat` 消息会产生不可重试的 `INVALID_STREAM` 错误，避免外部网络数据混入模拟面板。

交易历史面板使用 `aria-live="polite"` 展示“实时连接”“重连中（第 N 次）”“实时连接已关闭”和模拟网络错误提示。组件卸载时取消订阅、清理重连计时器并关闭连接，确保不会留下后台模拟任务。

## 最新验证

断线提示、指数退避恢复、错误状态、事件去重、生命周期清理及面板状态更新共 10 项定向测试通过，TypeScript 检查通过，384MB 内存上限下生产构建通过。上述指标来自 Vitest/jsdom 本地环境，不代表真实移动设备网络或生产 WebSocket 服务的延迟与可用性。手续费仍使用 micro-ISC `BigInt` 聚合，推送状态变化不会重复计入 60% 国库 / 40% 营销汇总。

## 成功交易 Toast 反馈

当面板接受一条新的 `trade.status` 事件且目标状态为 `COMPLETED` 时，右上角显示轻量级 Toast。通知展示“模拟交易已完成”、NFT 名称和缩短后的交易哈希，仅对已通过 local-hardhat 流校验且按 sequence 应用的新事件触发；重复、乱序、跨流或非成功状态不会触发通知。

Toast 默认 3200ms 后自动消失，组件卸载时清理定时器。提示使用 `role="status"` 与 `aria-live="polite"`，并将动态效果限制在 `motion-safe`，因此用户启用 `prefers-reduced-motion` 时不会强制播放脉冲动画。该反馈属于模拟环境 UI，不代表真实链上确认或生产交易通知。

本次 Toast 回归覆盖成功事件触发、文案展示和自动消失；交易历史面板与模拟 WebSocket 定向测试共 11 项通过，TypeScript 检查及 384MB 受控内存生产构建通过。

## 多状态 Toast 反馈

面板现在会为新的状态事件提供三类轻量 Toast：`PENDING` 使用琥珀色与时钟图标，表示订单正在等待处理；`COMPLETED` 使用绿色与勾选图标，表示模拟成交完成；`FAILED` 使用玫红色与警告图标，表示模拟交易失败。三类提示均展示对应状态的中英文文案、NFT 名称和缩短后的交易哈希。

Toast 只对通过 `local-hardhat` 流校验并实际应用的事件触发。去重键由 `tradeId:sequence` 组成，因此同一订单从待处理转为失败或完成时，后续状态仍能产生新的反馈，而重复或乱序事件不会重复提示。每条提示 3200ms 后自动消失，继续使用 `role="status"`、`aria-live="polite"` 和 `motion-safe`，并在组件卸载时清理计时器。

本次定向回归覆盖三种状态的触发、状态替换、颜色/图标标识、自动消失及既有连接生命周期；共 12 项测试通过，TypeScript 检查通过。

## PENDING 处理中进度反馈

`PENDING` Toast 现在增加琥珀色 indeterminate 进度条和“正在等待模拟网络确认”提示。该进度条只表达处理中状态，不设置 `aria-valuenow`、`aria-valuemin` 或 `aria-valuemax`，因此不会把模拟事件转换成无法证明的真实百分比。进度区域使用 `role="progressbar"`、`aria-label="交易处理中"` 和 `aria-valuetext="正在处理中"`。

进度光带使用约 1.4 秒循环的轻量 transform 动画，并通过 `motion-safe` 限制在允许动态效果时播放；启用 `prefers-reduced-motion` 时保留静态进度提示。该 Toast 仍遵循 3200ms 自动消失与组件卸载清理规则。

## Toast 查看详情

交易 Toast 现在提供“查看详情”按钮。点击后会在当前 Toast 内展开订单类型、Token ID、价格、状态、local-hardhat 网络、手续费、时间和完整交易哈希；按钮通过 `aria-expanded` 与 `aria-controls` 描述展开状态，并可再次点击“收起详情”。详情使用响应式两列信息布局，适配移动端横屏窄宽度。

详情展开不会改变事件数据，也不会把 Toast 转换为真实链上日志查看器；它只展示当前已应用的模拟交易记录。Toast 仍按原有 3200ms 生命周期自动消失，组件卸载时清理计时器。

## Toast 自动消失策略

Toast 生命周期现在按状态区分：`COMPLETED` 与 `FAILED` 在显示 3200ms 后自动关闭；`PENDING` 不启动自动关闭计时器，会持续显示处理中进度和详情，直到同一订单收到新的已应用状态事件。后续状态事件使用 `tradeId:sequence` 作为去重键，因此 PENDING 可以被 COMPLETED 或 FAILED Toast 正确替换。

收到任何新状态事件时，旧 Toast 的计时器会先被清理，避免过期回调关闭新的通知。组件卸载时同样清理剩余计时器；该策略仅适用于 local-hardhat 模拟 UI，不代表真实链上确认时限。

## 复制日志

详情展开面板现在提供“复制日志”按钮。复制内容为安全的模拟诊断文本，包含交易 ID、状态、订单类型、NFT、Token ID、价格、手续费分配、网络、创建时间和交易哈希；不会包含钱包私钥、访问令牌或其他凭据。FAILED 状态会追加“未提供 provider 错误载荷”的诊断说明，因为当前模拟交易记录没有单独的错误字段。

复制成功后按钮显示“日志已复制”，复制 API 不可用或被浏览器拒绝时显示可访问的错误提示。该功能只依赖浏览器 Clipboard API，不会执行链上操作，也不会向后端上传日志。

## FAILED 交易重试

FAILED Toast 的详情面板现在提供“重试”按钮。点击后仅通过现有 `local-hardhat` 模拟 socket 发布一个新的、递增 `sequence` 的 `PENDING` 状态事件，并生成新的模拟交易哈希；不会调用钱包、真实 RPC 或任何链上写入。事件被 socket 应用后，FAILED Toast 会替换为常驻的 PENDING Toast，并继续展示处理中进度指示。

重试按钮在没有模拟 socket 或当前重试尚未完成时禁用，避免重复点击；重试期间通过 `aria-busy` 和加载图标反馈状态。后续 COMPLETED 或 FAILED 事件仍按既有规则更新 Toast 生命周期。

## 全局通知中心

游戏布局顶部的铃铛入口现在打开全局通知中心侧边栏。通知中心集中记录已应用的 `local-hardhat` 模拟交易 Toast 事件，按 `tradeId:sequence` 去重，并最多保留最近 100 条记录。每条记录显示交易 NFT、Token ID、状态、事件序号和未读标记。

用户可以按 PENDING、COMPLETED 或 FAILED 筛选，展开查看交易 ID、哈希、价格、网络和失败诊断信息，并复制安全日志。查看详情或复制日志会将该事件标记为已读；也可以一键标记全部已读或清空已读记录。通知中心使用全屏高度、窄宽侧边栏样式，适配移动端，同时保留桌面端可读宽度。它不接收真实链上通知，不执行交易，也不持久化敏感凭据。

## 批量重试失败交易

通知中心提供“重试所有失败”按钮。它按交易 ID 去重，只取每笔交易最新的 FAILED 历史记录，并通过已注册的 local-hardhat 模拟事件发布器为每笔记录发布一个递增 sequence 的 PENDING 事件。按钮在没有失败记录或批量操作进行中时禁用，操作完成后显示本次重新发起的笔数。

原 FAILED 历史记录不会被删除，因为通知中心承担审计式历史查看职责；新 PENDING 记录会显示为独立事件。该操作不调用钱包、真实 RPC 或生产合约，也不把模拟重试结果解释为真实链上交易结果。

## 可替换轮询传输

交易历史面板现在可以继续使用现有的内存 WebSocket 演示传输，也可以注入 `createSimulatedTradePollingSocket(source, intervalMs)` 创建的轮询适配器。两者复用 `SimulatedTradeSocket` 契约、`trade.status` 事件结构、单调递增 `sequence`、断线状态和面板侧的去重逻辑，因此上层 UI 不需要知道底层是推送还是轮询。

轮询源必须实现 `fetchSince(sequence)`，只返回 `local-hardhat` 模拟流事件；适配器会按 `sequence` 排序、从上次游标继续拉取、在异常时报告可重试的 `DISCONNECTED` 状态，并在 `close()` 后清理下一次计时器。该适配器不连接真实链、不提交交易，也不能作为主网订单同步实现。当前已补充 7 项 Socket/轮询回归测试和 TypeScript 检查。

## 批量重试进度与统计

批量重试期间，通知中心显示当前已处理数量与总数量的整体进度条，并使用 `role="progressbar"` 和动态 `aria-valuenow` 播报处理进度。进度代表本次模拟事件发布处理量，不代表真实链上确认百分比。

批处理完成后，通知中心展示成功、失败和跳过三项统计。成功表示已向 local-hardhat 模拟 socket 发布 PENDING 事件；失败表示发布器捕获到异常；跳过表示记录在处理时不再满足 FAILED 条件。结果只描述本次模拟批处理，不构成真实交易结算或链上状态证明。
