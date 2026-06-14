export type Language = "zh" | "en";

const translations = {
  zh: {
    // Navigation
    "nav.dashboard": "仪表盘",
    "nav.secretKey": "密令管理",
    "nav.contractParams": "合约参数",
    "nav.eventLogs": "交互日志",
    "nav.agentConsole": "Agent 控制台",
    "nav.treasury": "城市国库",
    "nav.staking": "银行系统",

    // Common
    "common.loading": "加载中...",
    "common.save": "保存",
    "common.cancel": "取消",
    "common.confirm": "确认",
    "common.execute": "执行",
    "common.refresh": "刷新",
    "common.success": "操作成功",
    "common.error": "操作失败",
    "common.copy": "复制",
    "common.copied": "已复制",
    "common.noData": "暂无数据",
    "common.status": "状态",
    "common.time": "时间",
    "common.amount": "数量",
    "common.address": "地址",
    "common.description": "描述",
    "common.actions": "操作",

    // Secret Key
    "secretKey.title": "密令管理",
    "secretKey.currentHash": "当前密令哈希",
    "secretKey.generate": "生成新密令",
    "secretKey.setCustom": "设置自定义密令",
    "secretKey.history": "密令历史",
    "secretKey.warning": "请妥善保管密令，生成后仅显示一次",
    "secretKey.newKey": "新密令",
    "secretKey.inputPlaceholder": "输入自定义密令...",
    "secretKey.active": "活跃",
    "secretKey.inactive": "已停用",

    // Contract Params
    "params.title": "合约参数配置",
    "params.utilityFeeRate": "水电费率",
    "params.utilityFeeRate.desc": "基点表示 (100 = 1%)",
    "params.luxuryGiftRebateRate": "奢侈品返利比率",
    "params.luxuryGiftRebateRate.desc": "基点表示 (3000 = 30%)",
    "params.stakingPoolId": "质押池 ID",
    "params.stakingPoolId.desc": "ISC Staking 银行系统池 ID",
    "params.update": "更新参数",
    "params.lastUpdated": "最后更新",

    // Event Logs
    "events.title": "合约交互日志",
    "events.eventName": "事件名称",
    "events.txHash": "交易哈希",
    "events.blockNumber": "区块号",
    "events.from": "发起方",
    "events.to": "接收方",
    "events.filterAll": "全部事件",
    "events.filterUtility": "UtilityFeePaid",
    "events.filterRebate": "LuxuryGiftRebateProcessed",
    "events.filterLand": "LandMinted",
    "events.filterHouse": "HouseMinted",

    // Agent Console
    "agent.title": "Agent 操作控制台",
    "agent.secretKeyInput": "输入密令",
    "agent.selectOperation": "选择操作",
    "agent.payUtilityFee": "支付水电费 (payUtilityFee)",
    "agent.processRebate": "处理奢侈品返利 (processLuxuryGiftRebate)",
    "agent.mintLand": "铸造土地 (mintLand)",
    "agent.mintHouse": "铸造房屋 (mintHouse)",
    "agent.playerAddress": "玩家地址",
    "agent.amount": "金额 (ISC)",
    "agent.recipientAddress": "接收方地址",
    "agent.giftValue": "礼物价值 (ISC)",
    "agent.toAddress": "目标地址",
    "agent.coordinateX": "坐标 X",
    "agent.coordinateY": "坐标 Y",
    "agent.landType": "土地类型",
    "agent.landTokenId": "土地 Token ID",
    "agent.houseType": "房屋类型",
    "agent.decorationHash": "装饰哈希",
    "agent.executeWarning": "请确认密令正确后再执行操作",

    // Treasury
    "treasury.title": "城市国库 (CityTreasury)",
    "treasury.balance": "当前余额",
    "treasury.transactions": "交易流水",
    "treasury.deposit": "存入",
    "treasury.withdraw": "支出",

    // Staking
    "staking.title": "银行系统 (ISC Staking)",
    "staking.currentAPY": "当前 APY",
    "staking.pendingRewards": "待领取收益",
    "staking.totalStaked": "质押总量",
    "staking.poolId": "质押池 ID",
  },
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.secretKey": "Secret Key",
    "nav.contractParams": "Contract Params",
    "nav.eventLogs": "Event Logs",
    "nav.agentConsole": "Agent Console",
    "nav.treasury": "Treasury",
    "nav.staking": "Staking",

    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.execute": "Execute",
    "common.refresh": "Refresh",
    "common.success": "Operation successful",
    "common.error": "Operation failed",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.noData": "No data",
    "common.status": "Status",
    "common.time": "Time",
    "common.amount": "Amount",
    "common.address": "Address",
    "common.description": "Description",
    "common.actions": "Actions",

    // Secret Key
    "secretKey.title": "Secret Key Management",
    "secretKey.currentHash": "Current Key Hash",
    "secretKey.generate": "Generate New Key",
    "secretKey.setCustom": "Set Custom Key",
    "secretKey.history": "Key History",
    "secretKey.warning": "Keep your secret key safe. It will only be shown once after generation.",
    "secretKey.newKey": "New Key",
    "secretKey.inputPlaceholder": "Enter custom secret key...",
    "secretKey.active": "Active",
    "secretKey.inactive": "Inactive",

    // Contract Params
    "params.title": "Contract Parameters",
    "params.utilityFeeRate": "Utility Fee Rate",
    "params.utilityFeeRate.desc": "In basis points (100 = 1%)",
    "params.luxuryGiftRebateRate": "Luxury Gift Rebate Rate",
    "params.luxuryGiftRebateRate.desc": "In basis points (3000 = 30%)",
    "params.stakingPoolId": "Staking Pool ID",
    "params.stakingPoolId.desc": "ISC Staking bank system pool ID",
    "params.update": "Update Parameter",
    "params.lastUpdated": "Last Updated",

    // Event Logs
    "events.title": "Contract Event Logs",
    "events.eventName": "Event Name",
    "events.txHash": "Tx Hash",
    "events.blockNumber": "Block Number",
    "events.from": "From",
    "events.to": "To",
    "events.filterAll": "All Events",
    "events.filterUtility": "UtilityFeePaid",
    "events.filterRebate": "LuxuryGiftRebateProcessed",
    "events.filterLand": "LandMinted",
    "events.filterHouse": "HouseMinted",

    // Agent Console
    "agent.title": "Agent Operation Console",
    "agent.secretKeyInput": "Enter Secret Key",
    "agent.selectOperation": "Select Operation",
    "agent.payUtilityFee": "Pay Utility Fee (payUtilityFee)",
    "agent.processRebate": "Process Luxury Rebate (processLuxuryGiftRebate)",
    "agent.mintLand": "Mint Land (mintLand)",
    "agent.mintHouse": "Mint House (mintHouse)",
    "agent.playerAddress": "Player Address",
    "agent.amount": "Amount (ISC)",
    "agent.recipientAddress": "Recipient Address",
    "agent.giftValue": "Gift Value (ISC)",
    "agent.toAddress": "Target Address",
    "agent.coordinateX": "Coordinate X",
    "agent.coordinateY": "Coordinate Y",
    "agent.landType": "Land Type",
    "agent.landTokenId": "Land Token ID",
    "agent.houseType": "House Type",
    "agent.decorationHash": "Decoration Hash",
    "agent.executeWarning": "Please verify your secret key before executing",

    // Treasury
    "treasury.title": "City Treasury (CityTreasury)",
    "treasury.balance": "Current Balance",
    "treasury.transactions": "Transaction History",
    "treasury.deposit": "Deposit",
    "treasury.withdraw": "Withdraw",

    // Staking
    "staking.title": "Bank System (ISC Staking)",
    "staking.currentAPY": "Current APY",
    "staking.pendingRewards": "Pending Rewards",
    "staking.totalStaked": "Total Staked",
    "staking.poolId": "Staking Pool ID",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["zh"];

export function t(key: TranslationKey, lang: Language): string {
  return translations[lang][key] || key;
}

export function useTranslations(lang: Language) {
  return (key: TranslationKey) => t(key, lang);
}
