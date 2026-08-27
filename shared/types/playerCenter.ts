/**
 * Player Center System Types
 * Wardrobe, jewelry, assets, and item shop
 */

/**
 * Item categories in the shop
 */
export enum ItemCategory {
  HAT = 'hat',
  SCARF = 'scarf',
  SHIRT = 'shirt',
  PANTS = 'pants',
  SKIRT = 'skirt',
  SHOES = 'shoes',
  SOCKS = 'socks',
  BAG = 'bag',
  RING = 'ring',
  BRACELET = 'bracelet',
  EARRING = 'earring',
  GLASSES = 'glasses',
  HAIRSTYLE = 'hairstyle',
}

/**
 * Item rarity levels
 */
export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

/**
 * Shop item definition
 */
export interface ShopItem {
  id: number;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  price: number; // ISC price
  imageUrl: string;
  previewUrl?: string;
  attributes?: Record<string, any>;
  availableFrom?: Date;
  availableUntil?: Date;
  isLimited: boolean;
  stock?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Player inventory item
 */
export interface InventoryItem {
  id: number;
  userId: number;
  itemId: number;
  quantity: number;
  equippedSlot?: string; // 'head', 'body', 'legs', 'feet', 'hand', 'neck', 'finger', 'eyes', 'hair'
  acquiredAt: Date;
  updatedAt: Date;
}

/**
 * Player wardrobe (clothing)
 */
export interface WardrobeItem extends InventoryItem {
  item: ShopItem;
  isEquipped: boolean;
}

/**
 * Player shoe cabinet
 */
export interface ShoeCabinetItem extends InventoryItem {
  item: ShopItem;
  isEquipped: boolean;
}

/**
 * Player jewelry
 */
export interface JewelryItem extends InventoryItem {
  item: ShopItem;
  isEquipped: boolean;
}

/**
 * Player assets
 */
export interface PlayerAssets {
  userId: number;
  iscBalance: number; // ISC coins
  bankBalance: number; // ISC in bank
  bankInterest: number; // APY interest
  investments: number; // ISC in investments
  realEstatValue: number; // Total real estate value
  businessValue: number; // Total business value
  totalAssets: number; // Total net worth
  updatedAt: Date;
}

/**
 * Player center summary
 */
export interface PlayerCenterSummary {
  userId: number;
  username: string;
  level: number;
  profession: string;
  assets: PlayerAssets;
  wardrobeCount: number;
  shoeCabinetCount: number;
  jewelryCount: number;
  equippedOutfit: {
    hat?: ShopItem;
    scarf?: ShopItem;
    shirt?: ShopItem;
    pants?: ShopItem;
    skirt?: ShopItem;
    shoes?: ShopItem;
    socks?: ShopItem;
    bag?: ShopItem;
    ring?: ShopItem;
    bracelet?: ShopItem;
    earring?: ShopItem;
    glasses?: ShopItem;
    hairstyle?: ShopItem;
  };
  updatedAt: Date;
}

/**
 * Item purchase transaction
 */
export interface ItemPurchaseTransaction {
  id: number;
  userId: number;
  itemId: number;
  quantity: number;
  totalPrice: number;
  purchasedAt: Date;
}

/**
 * Wardrobe categories
 */
export const WARDROBE_CATEGORIES = [
  ItemCategory.HAT,
  ItemCategory.SCARF,
  ItemCategory.SHIRT,
  ItemCategory.PANTS,
  ItemCategory.SKIRT,
  ItemCategory.HAIRSTYLE,
];

/**
 * Shoe cabinet categories
 */
export const SHOE_CABINET_CATEGORIES = [ItemCategory.SHOES, ItemCategory.SOCKS];

/**
 * Jewelry categories
 */
export const JEWELRY_CATEGORIES = [
  ItemCategory.RING,
  ItemCategory.BRACELET,
  ItemCategory.EARRING,
  ItemCategory.GLASSES,
  ItemCategory.BAG,
];

/**
 * All item categories
 */
export const ALL_ITEM_CATEGORIES = [
  ItemCategory.HAT,
  ItemCategory.SCARF,
  ItemCategory.SHIRT,
  ItemCategory.PANTS,
  ItemCategory.SKIRT,
  ItemCategory.SHOES,
  ItemCategory.SOCKS,
  ItemCategory.BAG,
  ItemCategory.RING,
  ItemCategory.BRACELET,
  ItemCategory.EARRING,
  ItemCategory.GLASSES,
  ItemCategory.HAIRSTYLE,
];

/**
 * Check if category is in wardrobe
 */
export function isWardrobeCategory(category: ItemCategory): boolean {
  return WARDROBE_CATEGORIES.includes(category);
}

/**
 * Check if category is in shoe cabinet
 */
export function isShoeCabinetCategory(category: ItemCategory): boolean {
  return SHOE_CABINET_CATEGORIES.includes(category);
}

/**
 * Check if category is jewelry
 */
export function isJewelryCategory(category: ItemCategory): boolean {
  return JEWELRY_CATEGORIES.includes(category);
}
