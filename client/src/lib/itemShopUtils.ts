/**
 * Ice Snow City item shop domain helpers.
 *
 * This module intentionally contains catalog metadata and deterministic purchase
 * validation only. Chain settlement is supplied by the UI through a callback,
 * so the helper never pretends a purchase succeeded without a receipt.
 */

export const ITEM_SHOP_CATEGORIES = [
  { key: "hat", zh: "帽子", en: "Hats" },
  { key: "faceCard", zh: "法卡", en: "Face cards" },
  { key: "top", zh: "衣服", en: "Tops" },
  { key: "pants", zh: "裤子", en: "Pants" },
  { key: "skirt", zh: "裙子", en: "Skirts" },
  { key: "shoes", zh: "鞋子", en: "Shoes" },
  { key: "socks", zh: "袜子", en: "Socks" },
  { key: "bag", zh: "包包", en: "Bags" },
  { key: "ring", zh: "戒指", en: "Rings" },
  { key: "bracelet", zh: "手镯", en: "Bracelets" },
  { key: "earrings", zh: "耳环", en: "Earrings" },
  { key: "glasses", zh: "眼镜", en: "Glasses" },
  { key: "hair", zh: "发型", en: "Hairstyles" },
] as const;

export type ItemShopCategory = (typeof ITEM_SHOP_CATEGORIES)[number]["key"];
export type ItemShopItemType = "equipment" | "consumable" | "material";
export type ItemShopItemTypeFilter = "all" | ItemShopItemType;

export const ITEM_SHOP_ITEM_TYPES: readonly {
  key: ItemShopItemTypeFilter;
  zh: string;
  en: string;
}[] = [
  { key: "all", zh: "全部类型", en: "All types" },
  { key: "equipment", zh: "装备/武器", en: "Equipment / tools" },
  { key: "consumable", zh: "消耗品", en: "Consumables" },
  { key: "material", zh: "材料", en: "Materials" },
];

export type ItemRarity = "standard" | "premium" | "signature";
export type ItemBadge = "none" | "new" | "hot";
export type ItemSortOption = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "hot" | "newest";

export interface GameItem {
  id: string;
  category: ItemShopCategory;
  itemType: ItemShopItemType;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  stock: number;
  rarity: ItemRarity;
  badge: ItemBadge;
  slot: string;
  assetKey: string;
  accent: string;
  stackable: boolean;
  backgroundStory?: string;
  backgroundStoryEn?: string;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  purchasedAt: number;
  txHash?: string;
}

export interface PurchaseValidationInput {
  item: GameItem;
  quantity: number;
  balance: string | number;
  ownedItemIds?: ReadonlySet<string> | readonly string[];
}

export type PurchaseValidationCode =
  | "ok"
  | "invalid_quantity"
  | "out_of_stock"
  | "already_owned"
  | "invalid_balance"
  | "insufficient_balance";

export interface PurchaseValidation {
  ok: boolean;
  code: PurchaseValidationCode;
  total: number;
  message: string;
}

export interface PurchaseSettlementReceipt {
  txHash: string;
  settledAt?: number;
}

export type ItemShopSettlement = (
  item: GameItem,
  quantity: number,
  total: number,
) => Promise<PurchaseSettlementReceipt>;

const createItem = (
  item: Omit<GameItem, "stackable" | "badge" | "itemType"> & {
    stackable?: boolean;
    badge?: ItemBadge;
    itemType?: ItemShopItemType;
  },
): GameItem => ({
  ...item,
  badge: item.badge ?? "none",
  itemType: item.itemType ?? "equipment",
  stackable: item.stackable ?? false,
});

/**
 * The catalog is deliberately focused on contemporary city life: commuter,
 * studio, campus, retail and office styling. It contains no fantasy weapons or
 * cold-weapon motifs.
 */
export const ITEM_SHOP_CATALOG: readonly GameItem[] = [
  createItem({ id: "hat-metro-cap", category: "hat", name: "地铁线棒球帽", nameEn: "Metro Line Cap", description: "适合通勤与城市漫步的低调棒球帽。", descriptionEn: "A low-profile cap for commutes and city walks.", price: 38, stock: 240, rarity: "standard", badge: "hot", slot: "head", assetKey: "wardrobe/hat-metro-cap", accent: "#62d9ff" }),
  createItem({ id: "hat-rooftop-bucket", category: "hat", name: "天台渔夫帽", nameEn: "Rooftop Bucket Hat", description: "轻量面料与反光城市标签，适合夜间街区。", descriptionEn: "Lightweight fabric with a reflective city tag for night districts.", price: 56, stock: 180, rarity: "premium", badge: "new", slot: "head", assetKey: "wardrobe/hat-rooftop-bucket", accent: "#ff8a65" }),

  createItem({ id: "face-card-street-pass", category: "faceCard", name: "街区通行卡", nameEn: "District Pass", description: "带有冰雪城市通行纹样的现代脸部卡片配件。", descriptionEn: "A contemporary face card accessory with the Ice Snow City pass motif.", price: 42, stock: 300, rarity: "standard", badge: "none", slot: "face-card", assetKey: "wardrobe/face-card-street-pass", accent: "#a78bfa" }),
  createItem({ id: "face-card-night-mark", category: "faceCard", name: "夜行标识卡", nameEn: "Night Route Mark", description: "以城市灯带为灵感的轻量脸部装饰。", descriptionEn: "A lightweight face accent inspired by urban light trails.", price: 68, stock: 120, rarity: "premium", badge: "hot", slot: "face-card", assetKey: "wardrobe/face-card-night-mark", accent: "#38bdf8" }),

  createItem({ id: "top-transit-jacket", category: "top", name: "交通线夹克", nameEn: "Transit Jacket", description: "利落剪裁的通勤夹克，带有城市线路撞色。", descriptionEn: "A sharp commuter jacket with city-line color blocking.", price: 128, stock: 150, rarity: "premium", badge: "hot", slot: "top", assetKey: "wardrobe/top-transit-jacket", accent: "#38bdf8" }),
  createItem({ id: "top-studio-knit", category: "top", name: "工作室针织衫", nameEn: "Studio Knit", description: "柔软针织与简洁轮廓，适合工作室和校园场景。", descriptionEn: "Soft knit texture and a clean silhouette for studio or campus scenes.", price: 94, stock: 210, rarity: "standard", badge: "new", slot: "top", assetKey: "wardrobe/top-studio-knit", accent: "#fbbf24" }),

  createItem({ id: "pants-utility-cargo", category: "pants", name: "城市机能工装裤", nameEn: "Urban Utility Cargo", description: "多口袋城市机能裤，适合建设与物流职业。", descriptionEn: "A multi-pocket utility pant for construction and logistics jobs.", price: 116, stock: 165, rarity: "premium", badge: "hot", slot: "bottom", assetKey: "wardrobe/pants-utility-cargo", accent: "#94a3b8" }),
  createItem({ id: "pants-office-tapered", category: "pants", name: "商务锥形长裤", nameEn: "Office Tapered Trousers", description: "利落锥形版型，适配银行、企业和交易中心场景。", descriptionEn: "Clean tapered trousers for banking, enterprise and trading-center scenes.", price: 102, stock: 190, rarity: "standard", badge: "none", slot: "bottom", assetKey: "wardrobe/pants-office-tapered", accent: "#64748b" }),

  createItem({ id: "skirt-campus-pleated", category: "skirt", name: "校园百褶裙", nameEn: "Campus Pleated Skirt", description: "现代校园风百褶裙，配色克制、便于角色搭配。", descriptionEn: "A modern pleated campus skirt with a restrained, versatile palette.", price: 108, stock: 140, rarity: "premium", badge: "hot", slot: "bottom", assetKey: "wardrobe/skirt-campus-pleated", accent: "#f472b6" }),
  createItem({ id: "skirt-city-slit", category: "skirt", name: "都市开衩半裙", nameEn: "City Slit Skirt", description: "适合商业街与办公区的都市感半裙。", descriptionEn: "A city skirt designed for retail streets and office districts.", price: 136, stock: 100, rarity: "signature", badge: "new", slot: "bottom", assetKey: "wardrobe/skirt-city-slit", accent: "#fb7185" }),

  createItem({ id: "shoes-snowline-sneakers", category: "shoes", name: "雪线通勤鞋", nameEn: "Snowline Trainers", description: "适合城市步行和雪地道路的防滑通勤鞋。", descriptionEn: "Slip-resistant commuter shoes for city walks and snowy roads.", price: 148, stock: 175, rarity: "premium", badge: "hot", slot: "feet", assetKey: "wardrobe/shoes-snowline-sneakers", accent: "#22d3ee" }),
  createItem({ id: "shoes-district-loafers", category: "shoes", name: "街区乐福鞋", nameEn: "District Loafers", description: "简约皮面与轻量鞋底，适配正式和休闲穿搭。", descriptionEn: "Minimal leather styling with a lightweight sole for formal or casual looks.", price: 132, stock: 130, rarity: "premium", badge: "none", slot: "feet", assetKey: "wardrobe/shoes-district-loafers", accent: "#f59e0b" }),

  createItem({ id: "socks-reflective-crew", category: "socks", name: "反光城市中筒袜", nameEn: "Reflective City Crew Socks", description: "带反光细节的运动城市中筒袜。", descriptionEn: "Sporty city crew socks with reflective details.", price: 32, stock: 320, rarity: "standard", badge: "none", slot: "feet", assetKey: "wardrobe/socks-reflective-crew", accent: "#e2e8f0" }),
  createItem({ id: "socks-campus-stripe", category: "socks", name: "校园条纹袜", nameEn: "Campus Stripe Socks", description: "简洁条纹设计，适配校园与日常服装。", descriptionEn: "Clean stripe styling for campus and everyday outfits.", price: 28, stock: 280, rarity: "standard", badge: "new", slot: "feet", assetKey: "wardrobe/socks-campus-stripe", accent: "#c084fc" }),

  createItem({ id: "bag-courier-sling", category: "bag", name: "快递员斜挎包", nameEn: "Courier Sling Bag", description: "适合快递站与城市配送职业的轻型斜挎包。", descriptionEn: "A lightweight sling bag for courier-station and delivery jobs.", price: 118, stock: 125, rarity: "premium", badge: "hot", slot: "back", assetKey: "wardrobe/bag-courier-sling", accent: "#f97316" }),
  createItem({ id: "bag-studio-tote", category: "bag", name: "工作室托特包", nameEn: "Studio Tote", description: "容量平衡的城市托特包，适合创作与商业街场景。", descriptionEn: "A balanced city tote for creative work and retail streets.", price: 86, stock: 230, rarity: "standard", badge: "none", slot: "back", assetKey: "wardrobe/bag-studio-tote", accent: "#34d399" }),

  createItem({ id: "ring-civic-signet", category: "ring", name: "城市徽记戒指", nameEn: "Civic Signet Ring", description: "以城市徽记为灵感的简洁戒指。", descriptionEn: "A clean ring inspired by the city emblem.", price: 76, stock: 90, rarity: "premium", badge: "none", slot: "ring", assetKey: "wardrobe/ring-civic-signet", accent: "#fbbf24" }),
  createItem({ id: "ring-neon-band", category: "ring", name: "霓虹线戒", nameEn: "Neon Line Band", description: "细窄金属戒面搭配低调霓虹线。", descriptionEn: "A slim metal band with a subtle neon line.", price: 64, stock: 170, rarity: "standard", badge: "new", slot: "ring", assetKey: "wardrobe/ring-neon-band", accent: "#22d3ee" }),

  createItem({ id: "bracelet-transit-cuff", category: "bracelet", name: "交通线手镯", nameEn: "Transit Cuff", description: "城市交通线路纹理的轻量金属手镯。", descriptionEn: "A lightweight metal cuff with transit-line texture.", price: 72, stock: 115, rarity: "premium", badge: "none", slot: "wrist", assetKey: "wardrobe/bracelet-transit-cuff", accent: "#60a5fa" }),
  createItem({ id: "bracelet-market-chain", category: "bracelet", name: "交易中心链镯", nameEn: "Market Chain Bracelet", description: "以交易中心建筑线条为灵感的现代链镯。", descriptionEn: "A modern chain bracelet inspired by the trading center skyline.", price: 82, stock: 80, rarity: "signature", badge: "hot", slot: "wrist", assetKey: "wardrobe/bracelet-market-chain", accent: "#a78bfa" }),

  createItem({ id: "earrings-signal-hoops", category: "earrings", name: "信号环耳饰", nameEn: "Signal Hoops", description: "轻量圆环与城市信号灯色彩组合。", descriptionEn: "Light hoops paired with traffic-signal colors.", price: 58, stock: 150, rarity: "premium", badge: "none", slot: "ears", assetKey: "wardrobe/earrings-signal-hoops", accent: "#fb7185" }),
  createItem({ id: "earrings-snowdrop-studs", category: "earrings", name: "雪滴耳钉", nameEn: "Snowdrop Studs", description: "小巧明亮的雪滴造型耳钉。", descriptionEn: "Small bright studs with a snowdrop silhouette.", price: 46, stock: 220, rarity: "standard", badge: "none", slot: "ears", assetKey: "wardrobe/earrings-snowdrop-studs", accent: "#bae6fd" }),

  createItem({ id: "glasses-urban-frame", category: "glasses", name: "城市线框眼镜", nameEn: "Urban Line Frames", description: "简洁线框与轻量镜片，适配办公和校园造型。", descriptionEn: "Clean wire frames with lightweight lenses for office and campus looks.", price: 74, stock: 160, rarity: "premium", badge: "none", slot: "face", assetKey: "wardrobe/glasses-urban-frame", accent: "#64748b" }),
  createItem({ id: "glasses-night-visor", category: "glasses", name: "夜景护目镜", nameEn: "Night City Visor", description: "适合夜间巡检与滑雪场景的现代护目镜。", descriptionEn: "A modern visor for night inspection and ski-resort scenes.", price: 98, stock: 95, rarity: "signature", badge: "new", slot: "face", assetKey: "wardrobe/glasses-night-visor", accent: "#38bdf8" }),

  createItem({ id: "hair-short-city-crop", category: "hair", name: "城市短发", nameEn: "City Crop", description: "利落短发轮廓，适配多种现代职业身份。", descriptionEn: "A clean short cut for a wide range of modern professions.", price: 88, stock: 140, rarity: "premium", badge: "none", slot: "hair", assetKey: "wardrobe/hair-short-city-crop", accent: "#f59e0b" }),
  createItem({ id: "hair-studio-long-layer", category: "hair", name: "工作室层次长发", nameEn: "Studio Layered Hair", description: "自然层次与轻盈动感，适合创作与社交场景。", descriptionEn: "Natural layers with movement for creative and social scenes.", price: 104, stock: 120, rarity: "premium", badge: "hot", slot: "hair", assetKey: "wardrobe/hair-studio-long-layer", accent: "#f472b6" }),

  createItem({ id: "equipment-city-safety-helmet", category: "hat", itemType: "equipment", name: "城市安全防护帽", nameEn: "City Safety Helmet", description: "面向施工、消防和暴风雪天气的现代防护装备。", descriptionEn: "Modern protective equipment for construction, fire response and blizzards.", price: 156, stock: 75, rarity: "signature", badge: "new", slot: "head", assetKey: "equipment/city-safety-helmet", accent: "#f59e0b" }),
  createItem({ id: "equipment-emergency-lamp", category: "glasses", itemType: "equipment", name: "应急巡检灯", nameEn: "Emergency Inspection Lamp", description: "适用于夜间巡检和城市维护的便携式照明装备。", descriptionEn: "Portable lighting equipment for night inspections and city maintenance.", price: 64, stock: 220, rarity: "standard", badge: "none", slot: "utility", assetKey: "equipment/emergency-inspection-lamp", accent: "#fde047" }),
  createItem({ id: "consumable-city-energy", category: "bag", itemType: "consumable", name: "城市能量饮料", nameEn: "City Energy Drink", description: "短时恢复工作状态的城市补给品，可重复购买。", descriptionEn: "A repeatable city supply that restores work stamina for a short time.", price: 12, stock: 500, rarity: "standard", badge: "hot", slot: "consumable", assetKey: "consumable/city-energy-drink", accent: "#34d399", stackable: true }),
  createItem({ id: "consumable-repair-kit", category: "bag", itemType: "consumable", name: "快修工具包", nameEn: "Rapid Repair Kit", description: "用于建筑维护与设备检修的单次消耗工具包。", descriptionEn: "A single-use repair kit for building maintenance and equipment checks.", price: 24, stock: 320, rarity: "standard", badge: "new", slot: "consumable", assetKey: "consumable/rapid-repair-kit", accent: "#60a5fa", stackable: true }),
  createItem({ id: "material-snowfiber-roll", category: "top", itemType: "material", name: "雪纤维卷材", nameEn: "Snowfiber Roll", description: "用于制作城市服装和保温设施的基础材料。", descriptionEn: "A base material for city clothing and insulation facilities.", price: 9, stock: 800, rarity: "standard", badge: "none", slot: "material", assetKey: "material/snowfiber-roll", accent: "#bae6fd", stackable: true }),
  createItem({ id: "material-led-strip", category: "bracelet", itemType: "material", name: "城市灯带组件", nameEn: "Urban LED Strip", description: "用于店铺、街区和建筑装饰升级的材料组件。", descriptionEn: "A material component for shop, district and building lighting upgrades.", price: 18, stock: 600, rarity: "standard", badge: "new", slot: "material", assetKey: "material/urban-led-strip", accent: "#a78bfa", stackable: true }),
];

export function getCategoryLabel(category: ItemShopCategory, language: "zh" | "en" = "zh"): string {
  const definition = ITEM_SHOP_CATEGORIES.find((entry) => entry.key === category);
  return definition?.[language] ?? category;
}

export function getItemTypeLabel(itemType: ItemShopItemTypeFilter, language: "zh" | "en" = "zh"): string {
  const definition = ITEM_SHOP_ITEM_TYPES.find((entry) => entry.key === itemType);
  return definition?.[language] ?? itemType;
}

export function getItemsByCategory(
  items: readonly GameItem[] = ITEM_SHOP_CATALOG,
  category: ItemShopCategory | "all" = "all",
): GameItem[] {
  return category === "all" ? [...items] : items.filter((item) => item.category === category);
}

export function getItemsByItemType(
  items: readonly GameItem[] = ITEM_SHOP_CATALOG,
  itemType: ItemShopItemTypeFilter = "all",
): GameItem[] {
  return itemType === "all" ? [...items] : items.filter((item) => item.itemType === itemType);
}

export function searchItemCatalog(
  items: readonly GameItem[] = ITEM_SHOP_CATALOG,
  query = "",
  category: ItemShopCategory | "all" = "all",
  itemType: ItemShopItemTypeFilter = "all",
): GameItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return getItemsByItemType(getItemsByCategory(items, category), itemType).filter((item) => {
    if (!normalizedQuery) return true;
    return [item.name, item.nameEn, item.description, item.descriptionEn, item.id, item.assetKey]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  });
}

export function sortShopItems(items: readonly GameItem[], sortBy: ItemSortOption = "default"): GameItem[] {
  const copy = [...items];
  switch (sortBy) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    case "name-desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name, "zh-CN"));
    case "hot":
      return copy.sort((a, b) => {
        const score = (item: GameItem) => (item.badge === "hot" ? 2 : item.badge === "new" ? 1 : 0);
        return score(b) - score(a) || b.stock - a.stock;
      });
    case "newest":
      return copy.sort((a, b) => {
        const score = (item: GameItem) => (item.badge === "new" ? 2 : item.badge === "hot" ? 1 : 0);
        return score(b) - score(a) || b.id.localeCompare(a.id);
      });
    default:
      return copy;
  }
}

export function calculatePurchaseTotal(item: GameItem, quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 1) return 0;
  return item.price * quantity;
}

function hasOwnedItem(ownedItemIds: PurchaseValidationInput["ownedItemIds"], itemId: string): boolean {
  if (!ownedItemIds) return false;
  return ownedItemIds instanceof Set
    ? ownedItemIds.has(itemId)
    : Array.from(ownedItemIds).includes(itemId);
}

export function validatePurchase(input: PurchaseValidationInput): PurchaseValidation {
  const { item, quantity, balance, ownedItemIds } = input;
  const total = calculatePurchaseTotal(item, quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, code: "invalid_quantity", total, message: "购买数量必须是大于 0 的整数。" };
  }
  if (quantity > item.stock) {
    return { ok: false, code: "out_of_stock", total, message: "库存不足，请降低购买数量。" };
  }
  if (!item.stackable && quantity > 1) {
    return { ok: false, code: "invalid_quantity", total, message: "该穿戴道具不可重复叠加购买。" };
  }
  if (!item.stackable && hasOwnedItem(ownedItemIds, item.id)) {
    return { ok: false, code: "already_owned", total, message: "你已经拥有该穿戴道具。" };
  }

  const numericBalance = typeof balance === "number" ? balance : Number(balance);
  if (!Number.isFinite(numericBalance) || numericBalance < 0) {
    return { ok: false, code: "invalid_balance", total, message: "无法读取有效的 ISC 余额。" };
  }
  if (numericBalance < total) {
    return { ok: false, code: "insufficient_balance", total, message: "ISC 余额不足，请先充值或选择其他道具。" };
  }

  return { ok: true, code: "ok", total, message: "购买条件已满足，可以发起链上结算。" };
}

export function addInventoryItem(
  inventory: readonly InventoryItem[],
  item: GameItem,
  quantity: number,
  receipt?: PurchaseSettlementReceipt,
  purchasedAt = Date.now(),
): InventoryItem[] {
  const next = inventory.map((entry) => ({ ...entry }));
  const existingIndex = next.findIndex((entry) => entry.itemId === item.id);

  if (existingIndex >= 0 && item.stackable) {
    const existing = next[existingIndex];
    next[existingIndex] = {
      ...existing,
      quantity: existing.quantity + quantity,
      purchasedAt,
      txHash: receipt?.txHash ?? existing.txHash,
    };
    return next;
  }

  next.push({ itemId: item.id, quantity, purchasedAt, txHash: receipt?.txHash });
  return next;
}

export function formatISC(amount: number | string, maximumFractionDigits = 4): string {
  const numericAmount = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numericAmount)) return "0";
  return numericAmount.toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}
