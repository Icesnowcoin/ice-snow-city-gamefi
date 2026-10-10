import { describe, expect, it } from "vitest";
import {
  ITEM_SHOP_CATALOG,
  ITEM_SHOP_CATEGORIES,
  addInventoryItem,
  calculatePurchaseTotal,
  getItemsByCategory,
  getItemsByItemType,
  searchItemCatalog,
  sortShopItems,
  validatePurchase,
} from "./itemShopUtils";

describe("itemShopUtils", () => {
  it("exposes exactly the 13 required urban wardrobe categories", () => {
    expect(ITEM_SHOP_CATEGORIES).toHaveLength(13);
    expect(ITEM_SHOP_CATEGORIES.map((category) => category.key)).toEqual([
      "hat",
      "faceCard",
      "top",
      "pants",
      "skirt",
      "shoes",
      "socks",
      "bag",
      "ring",
      "bracelet",
      "earrings",
      "glasses",
      "hair",
    ]);
  });

  it("contains catalog entries for every category", () => {
    const categoriesWithItems = new Set(ITEM_SHOP_CATALOG.map((item) => item.category));
    expect(categoriesWithItems.size).toBe(13);
    expect(ITEM_SHOP_CATALOG.length).toBeGreaterThanOrEqual(26);
  });

  it("filters by category and searches translated names, descriptions and IDs", () => {
    expect(getItemsByCategory(ITEM_SHOP_CATALOG, "shoes")).toHaveLength(2);
    expect(searchItemCatalog(ITEM_SHOP_CATALOG, "Metro").map((item) => item.id)).toContain("hat-metro-cap");
    expect(searchItemCatalog(ITEM_SHOP_CATALOG, "wardrobe/hair")).toHaveLength(2);
    expect(searchItemCatalog(ITEM_SHOP_CATALOG, "不存在的道具")).toHaveLength(0);
  });

  it("filters catalog entries by modern item type", () => {
    const equipment = getItemsByItemType(ITEM_SHOP_CATALOG, "equipment");
    const consumables = getItemsByItemType(ITEM_SHOP_CATALOG, "consumable");
    const materials = searchItemCatalog(ITEM_SHOP_CATALOG, "", "all", "material");

    expect(equipment.length).toBeGreaterThan(ITEM_SHOP_CATALOG.length - 6);
    expect(consumables.map((item) => item.id)).toEqual(["consumable-city-energy", "consumable-repair-kit"]);
    expect(materials.map((item) => item.id)).toEqual(["material-snowfiber-roll", "material-led-strip"]);
    expect(consumables.every((item) => item.stackable)).toBe(true);
  });

  it("sorts catalog items by price, name and hot priority", () => {
    const sample = ITEM_SHOP_CATALOG.slice(0, 4);
    const sortedAsc = sortShopItems(sample, "price-asc");
    expect(sortedAsc[0].price).toBeLessThanOrEqual(sortedAsc[1].price);

    const sortedName = sortShopItems(sample, "name-asc");
    expect(sortedName.length).toBe(4);

    const sortedHot = sortShopItems(sample, "hot");
    expect(sortedHot.length).toBe(4);

    const sortedNewest = sortShopItems(sample, "newest");
    expect(sortedNewest.length).toBe(4);
  });

  it("calculates a deterministic ISC total and rejects invalid quantities", () => {
    const item = ITEM_SHOP_CATALOG.find((entry) => entry.id === "top-transit-jacket")!;
    expect(calculatePurchaseTotal(item, 1)).toBe(128);
    expect(calculatePurchaseTotal(item, 0)).toBe(0);
    expect(validatePurchase({ item, quantity: 0, balance: "999" }).code).toBe("invalid_quantity");
    expect(validatePurchase({ item, quantity: 2, balance: "999" }).code).toBe("invalid_quantity");
  });

  it("requires enough ISC and does not allow duplicate wearable ownership", () => {
    const item = ITEM_SHOP_CATALOG.find((entry) => entry.id === "top-transit-jacket")!;
    expect(validatePurchase({ item, quantity: 1, balance: "127" }).code).toBe("insufficient_balance");
    expect(validatePurchase({ item, quantity: 1, balance: "128" }).ok).toBe(true);
    expect(validatePurchase({ item, quantity: 1, balance: "128", ownedItemIds: [item.id] }).code).toBe("already_owned");
  });

  it("adds a settled item to inventory with its transaction hash", () => {
    const item = ITEM_SHOP_CATALOG[0];
    const inventory = addInventoryItem([], item, 1, { txHash: "0xabc", settledAt: 100 });
    expect(inventory).toEqual([
      expect.objectContaining({ itemId: item.id, quantity: 1, txHash: "0xabc", purchasedAt: expect.any(Number) }),
    ]);
  });
});
