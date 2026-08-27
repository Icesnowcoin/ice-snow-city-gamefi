import { GameItemShop } from "@/components/GameItemShop";

/**
 * Game shop route. The item catalog and settlement flow live in the reusable
 * GameItemShop component so the same wardrobe market can be embedded in the
 * player hub later without duplicating business rules.
 */
export default function ShopPage() {
  return <GameItemShop />;
}
