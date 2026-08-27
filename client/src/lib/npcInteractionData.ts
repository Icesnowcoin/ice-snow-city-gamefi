export type NpcInteractionProfile = {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  district: string;
  districtEn: string;
  assetId: string;
  assetUrl: string;
  /** Optional real GLB path; absent means the profile only has image/archive metadata. */
  modelAssetUrl?: string;
  modelAssetStatus?: "runtime-ready" | "pending-import";
  assetStatus: "catalogued" | "runtime-ready" | "pending-import";
  polygonBudget: string;
  story: string;
  storyEn: string;
  interactionHint: string;
  interactionHintEn: string;
};

/**
 * Touch-first NPC entry points used by mobile action sheets.
 * Asset URLs intentionally come from the Phase 66 archive. The profile UI
 * displays a truthful fallback when an archived image is not available at runtime.
 */
export const BOTTOM_SHEET_NPC_PROFILES: readonly NpcInteractionProfile[] = [
  {
    id: "npc-nurse-01",
    name: "林医生",
    nameEn: "Dr. Lin",
    role: "综合医疗中心主治医师",
    roleEn: "Hospital attending physician",
    district: "综合医疗中心",
    districtEn: "Medical Center",
    assetId: "npc_nurse_01",
    assetUrl: "/manus-storage/npc_nurse_high_fidelity_v2.png",
    assetStatus: "catalogued",
    polygonBudget: "15k–18k polygons · 2K PBR",
    story:
      "林医生负责综合医疗中心的日常接诊，也参与城市急救网络建设。她会根据医疗中心的繁荣度，为玩家开放护理岗位、健康服务和暴风雪应急任务。",
    storyEn:
      "Dr. Lin runs daily care at the Medical Center and helps expand the city's emergency network. As the district prospers, she unlocks care jobs, health services and blizzard response tasks.",
    interactionHint: "可接取医疗服务、护理招聘与暴风雪应急任务",
    interactionHintEn:
      "Medical services, care jobs and blizzard response tasks",
  },
  {
    id: "npc-student-02",
    name: "苏沫",
    nameEn: "Sumi",
    role: "大学城文学社学生",
    roleEn: "University literature student",
    district: "大学城",
    districtEn: "University District",
    assetId: "npc_student_02",
    assetUrl: "/manus-storage/npc_student_jk_high_fidelity_v2.png",
    assetStatus: "catalogued",
    polygonBudget: "14k–17k polygons · 2K PBR",
    story:
      "苏沫是大学城文学社的组织者，正在收集城市早期建设者的口述史。她会把玩家在新区建设中的选择记录为城市故事，并引导玩家发现校园、学区房和公共文化支线。",
    storyEn:
      "Sumi organizes the university literature club and records oral histories from the city's early builders. She turns the player's district choices into stories and leads them to campus, school housing and culture quests.",
    interactionHint: "可触发城市口述史、校园活动与学区支线",
    interactionHintEn:
      "City oral histories, campus events and school-district quests",
  },
  {
    id: "npc-courier-09",
    name: "周驰",
    nameEn: "Zhou Chi",
    role: "社区快递物流专员",
    roleEn: "Community express courier",
    district: "商业街",
    districtEn: "Commercial District",
    assetId: "npc_courier_09",
    assetUrl: "/manus-storage/npc_express_courier_v2.png",
    assetStatus: "catalogued",
    polygonBudget: "14k–17k polygons · 2K PBR",
    story:
      "周驰负责连接快递站、商铺和玩家经营的店面。他熟悉每条配送路线，能够帮助玩家优化供应链时效，并在暴雪天气中提供临时物流调度。",
    storyEn:
      "Zhou Chi connects courier hubs, shops and player-run businesses. He knows every delivery route, helping optimize supply-chain timing and reroute logistics during snowstorms.",
    interactionHint: "可查看配送路线、物流岗位与供应链状态",
    interactionHintEn:
      "Delivery routes, logistics jobs and supply-chain status",
  },
  {
    id: "npc-ski-coach-19",
    name: "顾北",
    nameEn: "Gu Bei",
    role: "高山滑雪场教练",
    roleEn: "Alpine ski instructor",
    district: "高山滑雪场",
    districtEn: "Ski Resort",
    assetId: "npc_coach_19",
    assetUrl: "/manus-storage/npc_ski_instructor_v2.png",
    assetStatus: "catalogued",
    polygonBudget: "16k–20k polygons · 2K PBR",
    story:
      "顾北负责滑雪场安全培训与游客服务。他会根据雪场设施等级安排训练课程、雪道维护和赛事活动，让玩家看到旅游区繁荣度如何转化为真实的工作机会。",
    storyEn:
      "Gu Bei leads ski safety training and guest services. He schedules lessons, slope maintenance and events around resort upgrades, showing how prosperity becomes real work opportunities.",
    interactionHint: "可接取雪道维护、教练招聘与赛事活动任务",
    interactionHintEn: "Slope maintenance, coaching jobs and resort events",
  },
  {
    id: "npc-teller-07",
    name: "许晴",
    nameEn: "Xu Qing",
    role: "城市银行高级柜员",
    roleEn: "Senior city bank teller",
    district: "金融服务街",
    districtEn: "Financial Street",
    assetId: "npc_teller_07",
    assetUrl: "/manus-storage/npc_bank_teller_v2.png",
    assetStatus: "catalogued",
    polygonBudget: "15k–18k polygons · 2K PBR",
    story:
      "许晴在银行柜台为玩家解释城市经营账户、贷款资格和 ISC 交易记录。她不会替玩家做投资决定，而是提供透明的账户信息与风险提示。",
    storyEn:
      "Xu Qing explains operating accounts, loan eligibility and ISC transaction records at the city bank. She does not make investment decisions for players; she provides transparent account information and risk notices.",
    interactionHint: "可查看经营账户、贷款资格与 ISC 记录",
    interactionHintEn: "Operating accounts, loan eligibility and ISC records",
  },
  {
    id: "npc-vendor-08",
    name: "阿岚",
    nameEn: "Alan",
    role: "商业街特色摊贩",
    roleEn: "Street market vendor",
    district: "商业街",
    districtEn: "Commercial District",
    assetId: "npc_vendor_08",
    assetUrl: "/manus-storage/npc_street_vendor_v2.png",
    assetStatus: "catalogued",
    polygonBudget: "14k–16k polygons · 2K PBR",
    story:
      "阿岚经营城市早市摊位，和农业区大棚、物流站保持稳定合作。他会向玩家展示蔬菜从生产、运输到摊位销售的完整链路。",
    storyEn:
      "Alan runs a city morning stall and works with greenhouses and courier hubs. He shows players the complete journey from production to transport and market sale.",
    interactionHint: "可查看农产品供应链与摊位经营机会",
    interactionHintEn: "Produce supply chains and market-stall opportunities",
  },
] as const;

export function getNpcInteractionProfile(
  id: string
): NpcInteractionProfile | undefined {
  return BOTTOM_SHEET_NPC_PROFILES.find(profile => profile.id === id);
}
