import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  CircleDollarSign,
  Flame,
  Footprints,
  Glasses,
  Heart,
  Loader2,
  Minus,
  MoreHorizontal,
  Plus,
  Receipt,
  RefreshCw,
  Scissors,
  Search,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWeb3Wallet } from "@/hooks/useWeb3Wallet";
import {
  useISCTokenBalance,
  useISCTokenContractAddress,
} from "@/hooks/useISCToken";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  MobileBottomSheet,
  triggerMobileHaptic,
} from "@/components/ui/mobile-bottom-sheet";
import {
  NpcInteractionEntry,
  NpcProfileBottomSheet,
} from "@/components/NpcInteractionBottomSheet";
import {
  BOTTOM_SHEET_NPC_PROFILES,
  type NpcInteractionProfile,
} from "@/lib/npcInteractionData";
import {
  ITEM_SHOP_CATALOG,
  ITEM_SHOP_CATEGORIES,
  ITEM_SHOP_ITEM_TYPES,
  addInventoryItem,
  calculatePurchaseTotal,
  formatISC,
  getCategoryLabel,
  getItemTypeLabel,
  searchItemCatalog,
  sortShopItems,
  type GameItem,
  type InventoryItem,
  type ItemShopCategory,
  type ItemShopItemTypeFilter,
  type ItemShopSettlement,
  type ItemSortOption,
  type PurchaseSettlementReceipt,
  validatePurchase,
} from "@/lib/itemShopUtils";

const GAME_ITEM_TOKEN_ABI = [
  "function payForGameItem(address player, uint256 amount) external",
] as const;

const CATEGORY_ICONS: Partial<Record<ItemShopCategory, typeof Tag>> = {
  top: Shirt,
  pants: Shirt,
  skirt: Shirt,
  shoes: Footprints,
  bag: ShoppingBag,
  glasses: Glasses,
  hair: Scissors,
  faceCard: Sparkles,
};

export interface GameItemShopProps {
  className?: string;
  initialInventory?: readonly InventoryItem[];
  /** Optional adapter for a server/contract settlement flow in production. */
  onPurchase?: ItemShopSettlement;
  onInventoryChange?: (inventory: InventoryItem[]) => void;
}

type QuickAddOptions = {
  openMiniCart?: boolean;
  showActionSheetSuccess?: boolean;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "链上结算失败，请稍后重试。";
}

export function GameItemShop({
  className = "",
  initialInventory = [],
  onPurchase,
  onInventoryChange,
}: GameItemShopProps) {
  const { lang } = useLanguage();
  const wallet = useWeb3Wallet();
  const {
    balance,
    isLoading: isBalanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useISCTokenBalance(wallet.address ?? undefined);
  const {
    contractAddress,
    isLoading: isContractLoading,
    error: contractError,
  } = useISCTokenContractAddress();
  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    ItemShopCategory | "all"
  >("all");
  const [selectedItemType, setSelectedItemType] =
    useState<ItemShopItemTypeFilter>("all");
  const [sortBy, setSortBy] = useState<ItemSortOption>("default");
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => [
    ...initialInventory,
  ]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseReceipt, setPurchaseReceipt] =
    useState<PurchaseSettlementReceipt | null>(null);
  const [cartItemIds, setCartItemIds] = useState<string[]>([]);
  const [fullscreenCheckoutSuccess, setFullscreenCheckoutSuccess] =
    useState(false);
  const [wishlistedItemIds, setWishlistedItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("isc_shop_wishlist");
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [actionSheetItem, setActionSheetItem] = useState<GameItem | null>(null);
  const [actionSheetSuccess, setActionSheetSuccess] = useState<{
    itemId: string;
    itemName: string;
  } | null>(null);
  const [selectedNpcProfile, setSelectedNpcProfile] =
    useState<NpcInteractionProfile | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right"
  );
  const cartToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cartToastTimerRef.current) clearTimeout(cartToastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "isc_shop_wishlist",
        JSON.stringify(wishlistedItemIds)
      );
    } catch {
      // ignore quota or disabled storage
    }
  }, [wishlistedItemIds]);

  const ownedItemIds = useMemo(
    () => new Set(inventory.map(entry => entry.itemId)),
    [inventory]
  );
  const filteredItems = useMemo(() => {
    const searched = searchItemCatalog(
      ITEM_SHOP_CATALOG,
      query,
      selectedCategory,
      selectedItemType
    );
    return sortShopItems(searched, sortBy);
  }, [query, selectedCategory, selectedItemType, sortBy]);

  const selectedTotal = selectedItem
    ? calculatePurchaseTotal(selectedItem, quantity)
    : 0;
  const selectedValidation = selectedItem
    ? validatePurchase({ item: selectedItem, quantity, balance, ownedItemIds })
    : null;
  const canSettle = Boolean(
    selectedItem &&
      selectedValidation?.ok &&
      wallet.isConnected &&
      wallet.signer
  );

  const toggleWishlist = useCallback(
    (item: GameItem) => {
      setWishlistedItemIds(current => {
        const exists = current.includes(item.id);
        const next = exists
          ? current.filter(id => id !== item.id)
          : [...current, item.id];
        setCartToast(
          exists
            ? lang === "zh"
              ? `已将 ${item.name} 移出心愿单`
              : `Removed ${item.nameEn} from wishlist`
            : lang === "zh"
              ? `已将 ${item.name} 加入心愿单`
              : `Added ${item.nameEn} to wishlist`
        );
        if (cartToastTimerRef.current) clearTimeout(cartToastTimerRef.current);
        cartToastTimerRef.current = setTimeout(() => setCartToast(null), 2200);
        return next;
      });
    },
    [lang]
  );

  const quickAddToCart = useCallback(
    (item: GameItem, options: QuickAddOptions = {}) => {
      const { openMiniCart = true, showActionSheetSuccess = true } = options;

      if (cartItemIds.includes(item.id)) return false;

      const validation = validatePurchase({
        item,
        quantity: 1,
        balance: Number.MAX_SAFE_INTEGER,
        ownedItemIds,
      });

      if (!validation.ok) {
        setPurchaseError(validation.message);
        setSelectedItem(item);
        return false;
      }

      setCartItemIds(current =>
        current.includes(item.id) ? current : [...current, item.id]
      );
      if (openMiniCart) setIsMiniCartOpen(true);
      if (showActionSheetSuccess) {
        setActionSheetSuccess({
          itemId: item.id,
          itemName: lang === "zh" ? item.name : item.nameEn,
        });
      }
      triggerMobileHaptic("success");
      setCartToast(
        lang === "zh"
          ? `${item.name} 已加入购物车`
          : `${item.nameEn} added to cart`
      );
      if (cartToastTimerRef.current) clearTimeout(cartToastTimerRef.current);
      cartToastTimerRef.current = setTimeout(() => setCartToast(null), 2200);
      return true;
    },
    [cartItemIds, lang, ownedItemIds]
  );

  const openItemDetails = useCallback((item: GameItem) => {
    setActionSheetItem(null);
    setActionSheetSuccess(null);
    setSelectedItem(item);
    setPurchaseError(null);
    setPurchaseReceipt(null);
    setQuantity(1);
  }, []);

  const settleOnChain: ItemShopSettlement = useCallback(
    async (item, itemQuantity, total) => {
      if (!wallet.signer || !wallet.address) {
        throw new Error(
          lang === "zh"
            ? "请先连接 Web3 钱包。"
            : "Connect a Web3 wallet first."
        );
      }
      if (!contractAddress) {
        throw new Error(
          lang === "zh"
            ? "暂未读取 ISC 合约地址，无法发起结算。"
            : "ISC contract address is unavailable."
        );
      }
      if (itemQuantity !== 1 && !item.stackable) {
        throw new Error(
          lang === "zh"
            ? "该穿戴道具不可重复叠加购买。"
            : "This wearable item cannot be purchased more than once."
        );
      }

      const amount = ethers.parseUnits(total.toString(), 18);
      const tokenContract = new ethers.Contract(
        contractAddress,
        GAME_ITEM_TOKEN_ABI,
        wallet.signer
      );
      const tx = await tokenContract.payForGameItem(wallet.address, amount);
      await tx.wait();
      await refetchBalance();
      return { txHash: tx.hash, settledAt: Date.now() };
    },
    [contractAddress, lang, refetchBalance, wallet.address, wallet.signer]
  );

  const handlePurchase = async () => {
    if (!selectedItem || !selectedValidation) return;
    setPurchaseError(null);
    setPurchaseReceipt(null);

    if (!selectedValidation.ok) {
      setPurchaseError(selectedValidation.message);
      return;
    }
    if (!wallet.isConnected || !wallet.signer) {
      setPurchaseError(
        lang === "zh"
          ? "请先连接钱包，再进行 ISC 结算。"
          : "Connect a wallet before settling with ISC."
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const receipt = await (onPurchase ?? settleOnChain)(
        selectedItem,
        quantity,
        selectedValidation.total
      );
      const nextInventory = addInventoryItem(
        inventory,
        selectedItem,
        quantity,
        receipt
      );
      setInventory(nextInventory);
      onInventoryChange?.(nextInventory);
      setCartItemIds(current =>
        current.filter(itemId => itemId !== selectedItem.id)
      );
      setPurchaseReceipt(receipt);
      setQuantity(1);
    } catch (error) {
      setPurchaseError(getErrorMessage(error));
    } finally {
      setIsPurchasing(false);
    }
  };

  const closeDialog = (open: boolean) => {
    if (open) return;
    if (!isPurchasing) {
      setSelectedItem(null);
      setPurchaseError(null);
      setPurchaseReceipt(null);
      setQuantity(1);
    }
  };

  const selectedIndex = selectedItem
    ? filteredItems.findIndex(item => item.id === selectedItem.id)
    : -1;
  const hasPrevItem = selectedIndex > 0;
  const hasNextItem =
    selectedIndex >= 0 && selectedIndex < filteredItems.length - 1;

  const handlePrevItem = () => {
    if (hasPrevItem) {
      const prev = filteredItems[selectedIndex - 1];
      if (prev) {
        setSlideDirection("left");
        setSelectedItem(prev);
        setPurchaseError(null);
        setPurchaseReceipt(null);
        setQuantity(1);
      }
    }
  };

  const handleNextItem = () => {
    if (hasNextItem) {
      const next = filteredItems[selectedIndex + 1];
      if (next) {
        setSlideDirection("right");
        setSelectedItem(next);
        setPurchaseError(null);
        setPurchaseReceipt(null);
        setQuantity(1);
      }
    }
  };

  const findAdjacentActionSheetItem = useCallback(
    (direction: "left" | "right") => {
      if (!actionSheetItem) return null;
      const currentIndex = ITEM_SHOP_CATEGORIES.findIndex(
        category => category.key === actionSheetItem.category
      );
      if (currentIndex < 0) return null;
      const step = direction === "left" ? 1 : -1;

      for (
        let index = currentIndex + step;
        index >= 0 && index < ITEM_SHOP_CATEGORIES.length;
        index += step
      ) {
        const categoryKey = ITEM_SHOP_CATEGORIES[index]?.key;
        if (!categoryKey) continue;
        const scoped = sortShopItems(
          searchItemCatalog(
            ITEM_SHOP_CATALOG,
            query,
            categoryKey,
            selectedItemType
          ),
          sortBy
        );
        const fallback =
          scoped.length > 0
            ? scoped
            : sortShopItems(
                searchItemCatalog(ITEM_SHOP_CATALOG, "", categoryKey, "all"),
                sortBy
              );
        if (fallback[0]) return fallback[0];
      }
      return null;
    },
    [actionSheetItem, query, selectedItemType, sortBy]
  );

  const handleActionSheetHorizontalSwipe = useCallback(
    (direction: "left" | "right") => {
      const nextItem = findAdjacentActionSheetItem(direction);
      if (!nextItem) return false;
      setActionSheetSuccess(null);
      setActionSheetItem(nextItem);
      setPurchaseError(null);
      setPurchaseReceipt(null);
      setQuantity(1);
      return true;
    },
    [findAdjacentActionSheetItem]
  );

  const actionSheetCategoryIndex = actionSheetItem
    ? ITEM_SHOP_CATEGORIES.findIndex(
        category => category.key === actionSheetItem.category
      )
    : -1;
  const hasPreviousActionSheetCategory = actionSheetCategoryIndex > 0;
  const hasNextActionSheetCategory =
    actionSheetCategoryIndex >= 0 &&
    actionSheetCategoryIndex < ITEM_SHOP_CATEGORIES.length - 1;

  const handleActionSheetCategoryButton = (direction: "left" | "right") => {
    handleActionSheetHorizontalSwipe(direction);
  };

  const handleShareItem = () => {
    if (!selectedItem) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#item=${selectedItem.id}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCartToast(
          lang === "zh"
            ? `已复制“${selectedItem.name}”的专属分享链接！`
            : `Copied share link for "${selectedItem.nameEn}"!`
        );
        if (cartToastTimerRef.current) clearTimeout(cartToastTimerRef.current);
        cartToastTimerRef.current = setTimeout(() => setCartToast(null), 2500);
      })
      .catch(() => {
        setCartToast(
          lang === "zh" ? "复制链接失败，请手动复制。" : "Failed to copy link."
        );
        if (cartToastTimerRef.current) clearTimeout(cartToastTimerRef.current);
        cartToastTimerRef.current = setTimeout(() => setCartToast(null), 2500);
      });
  };

  const handleQuantityChange = (next: number) => {
    if (!selectedItem) return;
    const max = Math.max(
      1,
      Math.min(
        selectedItem.stock,
        selectedItem.stackable ? selectedItem.stock : 1
      )
    );
    setQuantity(Math.max(1, Math.min(max, Math.floor(next))));
  };

  return (
    <section
      className={`space-y-6 ${className}`}
      aria-labelledby="game-item-shop-title"
    >
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[linear-gradient(120deg,#07111f_0%,#0b1930_52%,#13122b_100%)] p-6 shadow-2xl shadow-cyan-950/20">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                Ice Snow City / Wardrobe Market
              </span>
            </div>
            <h1
              id="game-item-shop-title"
              className="text-3xl font-semibold tracking-tight text-white md:text-4xl"
            >
              {lang === "zh" ? "城市穿搭补给站" : "Urban Wardrobe Market"}
            </h1>
            <p className="text-sm leading-6 text-slate-300">
              {lang === "zh"
                ? "用 ISC 解锁通勤、校园、物流与商业街造型。每件穿戴道具都将写入玩家衣柜，链上结算完成后才会发放。"
                : "Use ISC to unlock commuter, campus, logistics and retail looks. Wearables enter your wardrobe only after on-chain settlement."}
            </p>
          </div>
          <div className="grid min-w-[280px] grid-cols-3 gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
            <div>
              <p className="text-slate-400">
                {lang === "zh" ? "实时 ISC 余额" : "Live ISC balance"}
              </p>
              <p className="mt-1 flex items-center gap-1 font-mono text-lg font-semibold text-cyan-200">
                <CircleDollarSign className="h-4 w-4" />
                {isBalanceLoading ? "…" : `${formatISC(balance)} ISC`}
              </p>
            </div>
            <div>
              <p className="text-slate-400">
                {lang === "zh" ? "衣柜道具" : "Wardrobe items"}
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-white">
                {inventory.length}
              </p>
            </div>
            <div className="relative">
              <p className="text-slate-400">
                {lang === "zh" ? "心愿单" : "Wishlist"}
              </p>
              <button
                type="button"
                data-testid="wishlist-trigger-btn"
                onClick={() => setIsWishlistOpen(prev => !prev)}
                aria-label={
                  lang === "zh" ? "查看心愿单预览" : "View wishlist preview"
                }
                aria-expanded={isWishlistOpen}
                aria-controls="wishlist-preview-dropdown"
                className="mt-1 flex cursor-pointer items-center gap-1 font-mono text-lg font-semibold text-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-400/50 hover:text-rose-200 transition-colors"
              >
                <Heart className="h-4 w-4 fill-rose-500/30 text-rose-400" />
                <span>{wishlistedItemIds.length}</span>
              </button>

              {isWishlistOpen && (
                <div
                  id="wishlist-preview-dropdown"
                  className="absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 fill-rose-500/30 text-rose-400" />
                      <span className="font-semibold text-sm">
                        {lang === "zh" ? "我的心愿单" : "My Wishlist"}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-xs text-rose-300"
                    >
                      {wishlistedItemIds.length}{" "}
                      {lang === "zh" ? "件" : "items"}
                    </Badge>
                  </div>

                  {wishlistedItemIds.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      {lang === "zh"
                        ? "心愿单暂无收藏道具，点击心形图标收藏！"
                        : "No wishlist items yet. Click heart icons to save!"}
                    </div>
                  ) : (
                    <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                      {wishlistedItemIds.map(itemId => {
                        const wishItem = ITEM_SHOP_CATALOG.find(
                          entry => entry.id === itemId
                        );
                        if (!wishItem) return null;
                        return (
                          <div
                            key={wishItem.id}
                            className="flex items-center justify-between rounded-xl bg-slate-900/80 p-2 text-xs border border-slate-800"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItem(wishItem);
                                setIsWishlistOpen(false);
                                setQuantity(1);
                              }}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-cyan-300 transition-colors"
                            >
                              <span className="truncate font-medium text-white">
                                {lang === "zh"
                                  ? wishItem.name
                                  : wishItem.nameEn}
                              </span>
                            </button>
                            <div className="flex items-center gap-1.5 pl-2">
                              <span className="font-mono text-cyan-300">
                                {formatISC(wishItem.price)} ISC
                              </span>
                              <button
                                type="button"
                                disabled={
                                  wishItem.stock < 1 ||
                                  (!wishItem.stackable &&
                                    ownedItemIds.has(wishItem.id)) ||
                                  cartItemIds.includes(wishItem.id)
                                }
                                onClick={e => {
                                  e.stopPropagation();
                                  const added = quickAddToCart(wishItem, {
                                    openMiniCart: true,
                                    showActionSheetSuccess: false,
                                  });
                                  if (added) setIsWishlistOpen(false);
                                }}
                                aria-label={
                                  cartItemIds.includes(wishItem.id)
                                    ? lang === "zh"
                                      ? `已在购物车：${wishItem.name}`
                                      : `Already in cart: ${wishItem.nameEn}`
                                    : lang === "zh"
                                      ? `快速加入购物车：${wishItem.name}`
                                      : `Quick add to cart: ${wishItem.nameEn}`
                                }
                                title={
                                  wishItem.stock < 1
                                    ? lang === "zh"
                                      ? "该商品已售罄"
                                      : "This item is out of stock"
                                    : !wishItem.stackable &&
                                        ownedItemIds.has(wishItem.id)
                                      ? lang === "zh"
                                        ? "你已经拥有该穿戴道具"
                                        : "You already own this wearable item"
                                      : cartItemIds.includes(wishItem.id)
                                        ? lang === "zh"
                                          ? "该商品已在购物车"
                                          : "This item is already in the cart"
                                        : lang === "zh"
                                          ? "快速加入购物车"
                                          : "Quick add to cart"
                                }
                                className="grid min-h-9 min-w-9 place-items-center rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-1.5 text-emerald-300 transition-colors hover:bg-emerald-500/20 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {cartItemIds.includes(wishItem.id) ? (
                                  <CheckCircle2
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <ShoppingCart
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleWishlist(wishItem);
                                }}
                                aria-label={
                                  lang === "zh"
                                    ? "从心愿单移除"
                                    : "Remove from wishlist"
                                }
                                className="text-slate-500 hover:text-rose-400 p-0.5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {wishlistedItemIds.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setWishlistedItemIds([])}
                        className="h-7 text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                      >
                        {lang === "zh" ? "清空心愿单" : "Clear all"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsWishlistOpen(false)}
                        className="h-7 text-xs bg-rose-600 text-white hover:bg-rose-500"
                      >
                        {lang === "zh" ? "关闭" : "Close"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <p className="text-slate-400">
                {lang === "zh" ? "购物车" : "Cart"}
              </p>
              <button
                type="button"
                onClick={() => setIsMiniCartOpen(prev => !prev)}
                aria-label={
                  lang === "zh" ? "查看购物车预览" : "View cart preview"
                }
                aria-expanded={isMiniCartOpen}
                aria-controls="mini-cart-preview"
                className="mt-1 flex cursor-pointer items-center gap-1 font-mono text-lg font-semibold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{cartItemIds.length}</span>
              </button>
              {(isMiniCartOpen || cartItemIds.length > 0) && (
                <div
                  id="mini-cart-preview"
                  className="absolute right-0 top-full z-40 mt-2 w-72 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-emerald-400" />
                      <span className="font-semibold text-sm">
                        {lang === "zh" ? "迷你购物车" : "Mini Cart"}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-xs text-slate-300"
                    >
                      {cartItemIds.length} {lang === "zh" ? "件" : "items"}
                    </Badge>
                  </div>

                  {cartItemIds.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      {lang === "zh"
                        ? "购物车暂无穿搭道具，快去挑选吧！"
                        : "Your cart is empty. Pick some items!"}
                    </div>
                  ) : (
                    <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                      {cartItemIds.map(itemId => {
                        const cartItem = ITEM_SHOP_CATALOG.find(
                          entry => entry.id === itemId
                        );
                        if (!cartItem) return null;
                        return (
                          <div
                            key={itemId}
                            className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-slate-200">
                                {lang === "zh"
                                  ? cartItem.name
                                  : cartItem.nameEn}
                              </p>
                              <p className="font-mono text-cyan-300">
                                {formatISC(cartItem.price)} ISC
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setCartItemIds(curr =>
                                  curr.filter(id => id !== itemId)
                                );
                              }}
                              className="rounded-lg p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                              aria-label={
                                lang === "zh"
                                  ? `从购物车移除 ${cartItem.name}`
                                  : `Remove ${cartItem.nameEn} from cart`
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {cartItemIds.length > 0 && (
                    <>
                      <Separator className="my-3 bg-slate-800" />
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-slate-400">
                          {lang === "zh" ? "合计金额" : "Total"}
                        </span>
                        <span className="font-mono text-sm font-semibold text-emerald-300">
                          {formatISC(
                            cartItemIds.reduce((sum, id) => {
                              const found = ITEM_SHOP_CATALOG.find(
                                entry => entry.id === id
                              );
                              return sum + (found?.price ?? 0);
                            }, 0)
                          )}{" "}
                          ISC
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setCartItemIds([])}
                          className="h-7 flex-1 border-slate-700 bg-slate-900 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          {lang === "zh" ? "清空" : "Clear"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const firstId = cartItemIds[0];
                            const found = ITEM_SHOP_CATALOG.find(
                              entry => entry.id === firstId
                            );
                            if (found) {
                              setSelectedItem(found);
                              setQuantity(1);
                            }
                          }}
                          className="h-7 flex-1 bg-emerald-600 text-xs text-white hover:bg-emerald-500"
                        >
                          {lang === "zh" ? "结算首件" : "Checkout first"}
                        </Button>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <Button
                          type="button"
                          size="sm"
                          disabled={cartItemIds.length === 0}
                          onClick={() => {
                            if (cartItemIds.length === 0) return;
                            const purchasedItems = cartItemIds
                              .map(id =>
                                ITEM_SHOP_CATALOG.find(entry => entry.id === id)
                              )
                              .filter(Boolean) as GameItem[];

                            let nextInventory = [...inventory];
                            for (const pItem of purchasedItems) {
                              nextInventory = addInventoryItem(
                                nextInventory,
                                pItem,
                                1,
                                {
                                  txHash: `0xbatch-${Date.now()}`,
                                  settledAt: Date.now(),
                                }
                              );
                            }
                            setInventory(nextInventory);
                            onInventoryChange?.(nextInventory);
                            setCartItemIds([]);
                            setIsMiniCartOpen(false);
                            setFullscreenCheckoutSuccess(true);
                          }}
                          className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold shadow-md hover:from-cyan-400 hover:to-emerald-400"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {lang === "zh"
                            ? "去结算（一键清空并写入衣柜）"
                            : "Proceed to Checkout"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {cartToast && (
        <div
          className="shop-quick-toast-visible fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-emerald-400/40 bg-slate-950/95 p-4 text-emerald-100 shadow-2xl shadow-emerald-950/40 backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-300">
                {lang === "zh" ? "已加入购物车" : "Added to cart"}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {cartToast}
              </p>
              <button
                type="button"
                onClick={() => setIsMiniCartOpen(true)}
                aria-label={lang === "zh" ? "查看购物车" : "View cart"}
                className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {lang === "zh" ? "查看购物车" : "View cart"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCartToast(null)}
              aria-label={lang === "zh" ? "关闭提示" : "Dismiss notification"}
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Card className="border-slate-800 bg-slate-950/70 text-slate-100">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                placeholder={
                  lang === "zh"
                    ? "全局搜索商品名称、描述或道具 ID..."
                    : "Search name, description or item ID..."
                }
                className="border-slate-700 bg-slate-900 pl-10 pr-10 text-slate-100 placeholder:text-slate-500"
                aria-label={
                  lang === "zh" ? "搜索商城道具" : "Search shop items"
                }
              />
              {query.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={
                    lang === "zh" ? "清除搜索关键词" : "Clear search query"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {isSearchFocused && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-slate-700 bg-slate-950/95 p-3 text-slate-200 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400 font-medium">
                    <span>
                      {lang === "zh"
                        ? "🔥 热门搜索推荐"
                        : "🔥 Popular Searches"}
                    </span>
                    <span>
                      {lang === "zh" ? "点击快速填充" : "Click to fill"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      lang === "zh" ? "棒球帽" : "Baseball Cap",
                      lang === "zh" ? "通勤夹克" : "Commuter Jacket",
                      lang === "zh" ? "防寒卫衣" : "Fleece Hoodie",
                      lang === "zh" ? "安全防护帽" : "Safety Helmet",
                      lang === "zh" ? "能量饮料" : "Energy Drink",
                      lang === "zh" ? "雪线通勤鞋" : "Snow Commute Shoes",
                      lang === "zh" ? "斜挎包" : "Crossbody Bag",
                    ].map(term => (
                      <button
                        key={term}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setQuery(term);
                          setIsSearchFocused(false);
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-200 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onValueChange={val => setSortBy(val as ItemSortOption)}
              >
                <SelectTrigger className="w-[180px] border-slate-700 bg-slate-900 text-slate-200">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue
                      placeholder={lang === "zh" ? "排序方式" : "Sort by"}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900 text-slate-200">
                  <SelectItem value="default">
                    {lang === "zh" ? "默认推荐" : "Default"}
                  </SelectItem>
                  <SelectItem value="newest">
                    {lang === "zh" ? "✨ 最新上架" : "✨ Newest"}
                  </SelectItem>
                  <SelectItem value="price-asc">
                    {lang === "zh" ? "📈 价格：从低到高" : "Price: Low to High"}
                  </SelectItem>
                  <SelectItem value="price-desc">
                    {lang === "zh" ? "📉 价格：从高到低" : "Price: High to Low"}
                  </SelectItem>
                  <SelectItem value="name-asc">
                    {lang === "zh" ? "名称：A - Z" : "Name: A to Z"}
                  </SelectItem>
                  <SelectItem value="hot">
                    {lang === "zh" ? "🔥 人气与热销优先" : "Popularity / Hot"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => void refetchBalance()}
                disabled={isBalanceLoading}
                className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isBalanceLoading ? "animate-spin" : ""}`}
                />
                {lang === "zh" ? "刷新余额" : "Refresh"}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div
              className="flex gap-2 overflow-x-auto pb-1 flex-1"
              role="tablist"
              aria-label={lang === "zh" ? "道具类别" : "Item categories"}
            >
              <Button
                type="button"
                size="sm"
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className="shrink-0"
                role="tab"
                aria-selected={selectedCategory === "all"}
              >
                {lang === "zh" ? "全部 13 类" : "All 13 categories"}
              </Button>
              {ITEM_SHOP_CATEGORIES.map(category => {
                const Icon = CATEGORY_ICONS[category.key] ?? Tag;
                const isActive = selectedCategory === category.key;
                return (
                  <Button
                    key={category.key}
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.key)}
                    className="shrink-0 gap-1.5"
                    role="tab"
                    aria-selected={isActive}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {lang === "zh" ? category.zh : category.en}
                  </Button>
                );
              })}
            </div>

            <div className="shrink-0 flex items-center gap-2 pt-1 md:pt-0">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                {lang === "zh" ? "快捷排序：" : "Sort:"}
              </span>
              <Select
                value={sortBy}
                onValueChange={val => setSortBy(val as ItemSortOption)}
              >
                <SelectTrigger className="w-[160px] border-slate-700 bg-slate-900 text-slate-200 h-9 text-xs">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="h-3.5 w-3.5 text-cyan-400" />
                    <SelectValue
                      placeholder={lang === "zh" ? "排序方式" : "Sort by"}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900 text-slate-200">
                  <SelectItem value="default">
                    {lang === "zh" ? "默认推荐" : "Default"}
                  </SelectItem>
                  <SelectItem value="newest">
                    {lang === "zh" ? "✨ 最新上架" : "✨ Newest"}
                  </SelectItem>
                  <SelectItem value="price-asc">
                    {lang === "zh" ? "📈 价格：从低到高" : "Price: Low to High"}
                  </SelectItem>
                  <SelectItem value="price-desc">
                    {lang === "zh" ? "📉 价格：从高到低" : "Price: High to Low"}
                  </SelectItem>
                  <SelectItem value="name-asc">
                    {lang === "zh" ? "名称：A - Z" : "Name: A to Z"}
                  </SelectItem>
                  <SelectItem value="hot">
                    {lang === "zh" ? "🔥 人气与热销优先" : "Popularity / Hot"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div
            className="flex gap-2 overflow-x-auto border-t border-white/5 pt-3"
            role="tablist"
            aria-label={lang === "zh" ? "商品类型" : "Item types"}
          >
            {ITEM_SHOP_ITEM_TYPES.map(itemType => {
              const isActive = selectedItemType === itemType.key;
              return (
                <Button
                  key={itemType.key}
                  type="button"
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                  onClick={() => setSelectedItemType(itemType.key)}
                  className="shrink-0 rounded-full border border-slate-700/80 text-xs text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                  role="tab"
                  aria-selected={isActive}
                >
                  {lang === "zh" ? itemType.zh : itemType.en}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {(balanceError || contractError) && (
        <div
          className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"
          role="status"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p>
            {lang === "zh"
              ? "链上余额或合约地址暂时不可用。购买按钮会保持保护状态，不会伪造交易成功。"
              : "On-chain balance or contract data is temporarily unavailable. Purchase actions remain protected and never fake success."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filteredItems.map(item => {
          const owned = ownedItemIds.has(item.id);
          const isWishlisted = wishlistedItemIds.includes(item.id);
          const categoryLabel = getCategoryLabel(
            item.category,
            lang === "zh" ? "zh" : "en"
          );
          return (
            <Card
              key={item.id}
              onClick={() => openItemDetails(item)}
              className="group relative cursor-pointer overflow-hidden border-slate-800 bg-slate-950/80 text-slate-100 transition duration-200 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-950/30"
              role="button"
              tabIndex={0}
              aria-label={
                lang === "zh"
                  ? `查看 ${item.name} 详情`
                  : `View details of ${item.nameEn}`
              }
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openItemDetails(item);
                }
              }}
            >
              <CardHeader className="border-b border-white/5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {categoryLabel}
                      </span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleWishlist(item);
                        }}
                        aria-label={
                          isWishlisted
                            ? lang === "zh"
                              ? `取消收藏：${item.name}`
                              : `Remove from wishlist: ${item.nameEn}`
                            : lang === "zh"
                              ? `加入收藏：${item.name}`
                              : `Add to wishlist: ${item.nameEn}`
                        }
                        className={`group/heart flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border transition-all ${
                          isWishlisted
                            ? "border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-lg shadow-rose-950/40 hover:bg-rose-500/25"
                            : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 transition-transform duration-200 group-hover/heart:scale-110 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      {item.badge === "new" && (
                        <Badge
                          variant="secondary"
                          title={
                            lang === "zh"
                              ? "新品：最近上架的城市穿搭"
                              : "New arrival: a recently added urban look"
                          }
                          aria-label={
                            lang === "zh" ? "新品商品标签" : "New arrival badge"
                          }
                          className="shop-badge-interactive shop-badge-new border-cyan-500/30 bg-cyan-500/20 px-1.5 py-0 text-[10px] text-cyan-300"
                        >
                          {lang === "zh" ? "新品" : "NEW"}
                        </Badge>
                      )}
                      {item.badge === "hot" && (
                        <Badge
                          variant="secondary"
                          title={
                            lang === "zh"
                              ? "热销：城市玩家近期偏好的穿搭"
                              : "Hot seller: a popular urban look"
                          }
                          aria-label={
                            lang === "zh" ? "热销商品标签" : "Hot seller badge"
                          }
                          className="shop-badge-interactive shop-badge-hot gap-0.5 border-orange-500/30 bg-orange-500/20 px-1.5 py-0 text-[10px] text-orange-300"
                        >
                          <Flame className="shop-badge-flame h-2.5 w-2.5" />
                          {lang === "zh" ? "热销" : "HOT"}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base leading-6">
                      {lang === "zh" ? item.name : item.nameEn}
                    </CardTitle>
                  </div>
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10"
                    style={{
                      backgroundColor: `${item.accent}1a`,
                      color: item.accent,
                    }}
                    aria-hidden="true"
                  >
                    <Tag className="h-5 w-5" />
                  </div>
                </div>
                <CardDescription className="line-clamp-2 text-slate-400">
                  {lang === "zh" ? item.description : item.descriptionEn}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                    >
                      {item.rarity === "signature"
                        ? lang === "zh"
                          ? "典藏"
                          : "Signature"
                        : item.rarity === "premium"
                          ? lang === "zh"
                            ? "进阶"
                            : "Premium"
                          : lang === "zh"
                            ? "标准"
                            : "Standard"}
                    </Badge>
                    <span className="text-[11px] text-slate-500">
                      {getItemTypeLabel(
                        item.itemType,
                        lang === "zh" ? "zh" : "en"
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {lang === "zh"
                      ? `库存 ${item.stock}`
                      : `${item.stock} in stock`}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {lang === "zh" ? "价格" : "Price"}
                    </p>
                    <p className="font-mono text-xl font-semibold text-cyan-200">
                      {formatISC(item.price)}{" "}
                      <span className="text-sm text-cyan-400">ISC</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={item.stock < 1 || owned}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedItem(item);
                      setPurchaseError(null);
                      setPurchaseReceipt(null);
                      setQuantity(1);
                    }}
                    className="gap-1.5"
                  >
                    {owned ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" />
                    )}
                    {owned
                      ? lang === "zh"
                        ? "已拥有"
                        : "Owned"
                      : lang === "zh"
                        ? "查看并购买"
                        : "View & buy"}
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={e => {
                    e.stopPropagation();
                    setActionSheetSuccess(null);
                    setActionSheetItem(item);
                  }}
                  aria-label={
                    lang === "zh"
                      ? `打开商品操作：${item.name}`
                      : `Open item actions: ${item.nameEn}`
                  }
                  aria-haspopup="dialog"
                  className="w-full gap-1.5 border border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  {lang === "zh" ? "更多操作" : "More actions"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {actionSheetItem && (
        <MobileBottomSheet
          open={Boolean(actionSheetItem)}
          onOpenChange={open => {
            if (!open) {
              setActionSheetItem(null);
              setActionSheetSuccess(null);
            }
          }}
          title={lang === "zh" ? actionSheetItem.name : actionSheetItem.nameEn}
          description={
            lang === "zh"
              ? "触摸选择商品操作；左右滑动切换分类，向下拖拽或点击关闭按钮退出。"
              : "Choose an item action. Swipe left or right to switch categories, or drag down to exit."
          }
          testId="item-action-bottom-sheet"
          haptic="medium"
          horizontalSwipeThreshold={0.2}
          onHorizontalSwipe={handleActionSheetHorizontalSwipe}
          contentClassName="space-y-4"
        >
          <NpcInteractionEntry
            profiles={BOTTOM_SHEET_NPC_PROFILES}
            lang={lang === "zh" ? "zh" : "en"}
            onSelectProfile={profile => {
              setActionSheetItem(null);
              setActionSheetSuccess(null);
              setSelectedNpcProfile(profile);
            }}
          />

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">
                {getCategoryLabel(
                  actionSheetItem.category,
                  lang === "zh" ? "zh" : "en"
                )}
              </p>
              <p className="mt-1 truncate text-2xl font-semibold text-cyan-200">
                {formatISC(actionSheetItem.price)}{" "}
                <span className="text-sm text-cyan-400">ISC</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {lang === "zh"
                  ? `库存 ${actionSheetItem.stock} · ${getItemTypeLabel(actionSheetItem.itemType, "zh")}`
                  : `${actionSheetItem.stock} in stock · ${getItemTypeLabel(actionSheetItem.itemType, "en")}`}
              </p>
            </div>
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10"
              style={{
                backgroundColor: `${actionSheetItem.accent}1a`,
                color: actionSheetItem.accent,
              }}
              aria-hidden="true"
            >
              <Tag className="h-6 w-6" />
            </div>
          </div>

          <div
            data-testid="item-action-category-switcher"
            className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.04] p-2"
            role="group"
            aria-label={lang === "zh" ? "切换商品分类" : "Switch item category"}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="item-action-category-prev"
              disabled={!hasPreviousActionSheetCategory}
              onClick={() => handleActionSheetCategoryButton("right")}
              aria-label={
                lang === "zh" ? "上一个商品分类" : "Previous item category"
              }
              className="min-h-10 min-w-10 border-slate-700 bg-slate-900/80 px-2 text-slate-200 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="min-w-0 flex-1 text-center" aria-live="polite">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                {getCategoryLabel(
                  actionSheetItem.category,
                  lang === "zh" ? "zh" : "en"
                )}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {lang === "zh"
                  ? "左右滑动切换分类"
                  : "Swipe left or right to switch"}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="item-action-category-next"
              disabled={!hasNextActionSheetCategory}
              onClick={() => handleActionSheetCategoryButton("left")}
              aria-label={
                lang === "zh" ? "下一个商品分类" : "Next item category"
              }
              className="min-h-10 min-w-10 border-slate-700 bg-slate-900/80 px-2 text-slate-200 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {actionSheetSuccess?.itemId === actionSheetItem.id ? (
            <div
              data-testid="cart-add-success"
              className="space-y-4 rounded-3xl border border-emerald-400/30 bg-emerald-500/[0.08] p-5 text-center shadow-[0_0_36px_rgba(16,185,129,0.14)]"
            >
              <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full border border-emerald-300/50 bg-emerald-400/20 text-emerald-200 motion-safe:animate-[shop-success-pop_280ms_cubic-bezier(0.23,1,0.32,1)]">
                <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
                <Sparkles
                  className="absolute -right-1 -top-1 h-5 w-5 text-cyan-200 motion-safe:animate-pulse"
                  aria-hidden="true"
                />
              </div>
              <div role="status" aria-live="polite">
                <p className="text-lg font-semibold text-emerald-100">
                  {lang === "zh" ? "已加入购物车" : "Added to cart"}
                </p>
                <p className="mt-1 truncate text-sm text-slate-300">
                  {actionSheetSuccess.itemName}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setActionSheetItem(null);
                    setActionSheetSuccess(null);
                  }}
                  className="min-h-12 border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
                >
                  {lang === "zh" ? "继续逛逛" : "Keep browsing"}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  data-testid="cart-add-success-view-cart"
                  onClick={() => {
                    setActionSheetItem(null);
                    setActionSheetSuccess(null);
                    setIsMiniCartOpen(true);
                  }}
                  className="min-h-12 gap-2 bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                  {lang === "zh" ? "查看购物车" : "View cart"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                size="lg"
                disabled={
                  actionSheetItem.stock < 1 ||
                  ownedItemIds.has(actionSheetItem.id) ||
                  cartItemIds.includes(actionSheetItem.id)
                }
                onClick={() => quickAddToCart(actionSheetItem)}
                className="min-h-12 gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold text-slate-950 hover:from-emerald-400 hover:to-cyan-400"
              >
                {cartItemIds.includes(actionSheetItem.id) ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <ShoppingCart className="h-5 w-5" />
                )}
                {cartItemIds.includes(actionSheetItem.id)
                  ? lang === "zh"
                    ? "已在购物车"
                    : "In cart"
                  : lang === "zh"
                    ? "快速加入购物车"
                    : "Quick add to cart"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => openItemDetails(actionSheetItem)}
                className="min-h-12 gap-2 border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
              >
                <ShoppingBag className="h-5 w-5" />
                {lang === "zh" ? "查看商品详情" : "View item details"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => {
                  toggleWishlist(actionSheetItem);
                  setActionSheetItem(null);
                }}
                className="min-h-12 gap-2 border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 sm:col-span-2"
              >
                <Heart
                  className={`h-5 w-5 ${wishlistedItemIds.includes(actionSheetItem.id) ? "fill-rose-500 text-rose-400" : "text-rose-300"}`}
                />
                {wishlistedItemIds.includes(actionSheetItem.id)
                  ? lang === "zh"
                    ? "取消收藏"
                    : "Remove from wishlist"
                  : lang === "zh"
                    ? "加入心愿单"
                    : "Add to wishlist"}
              </Button>
            </div>
          )}
        </MobileBottomSheet>
      )}

      <NpcProfileBottomSheet
        profile={selectedNpcProfile}
        lang={lang === "zh" ? "zh" : "en"}
        onOpenChange={open => {
          if (!open) setSelectedNpcProfile(null);
        }}
      />

      {filteredItems.length === 0 && (
        <Card className="border-dashed border-cyan-500/30 bg-slate-950/60 text-slate-100 shadow-xl shadow-cyan-950/20">
          <CardContent className="grid place-items-center gap-3 py-14 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {lang === "zh"
                  ? "没有找到符合条件的城市道具"
                  : "No matching urban items found"}
              </p>
              <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                {lang === "zh"
                  ? `当前搜索词 "${query || "（无）"}" 与所选分类/类型组合未命中任何商品。`
                  : `Current query "${query || "(none)"}" and selected category/type combination yielded no results.`}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCategory("all");
                setSelectedItemType("all");
                setSortBy("default");
              }}
              className="mt-3 gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold shadow-md hover:from-cyan-400 hover:to-blue-500"
            >
              <Tag className="h-4 w-4" />
              {lang === "zh" ? "清除所有筛选条件" : "Clear all filters"}
            </Button>
          </CardContent>
        </Card>
      )}

      {fullscreenCheckoutSuccess && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fullscreen-success-title"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[linear-gradient(135deg,#07111f_0%,#0b2230_50%,#0c1b2a_100%)] p-8 text-center shadow-2xl shadow-emerald-950/50">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-inner mb-5 animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2
              id="fullscreen-success-title"
              className="text-2xl font-bold text-white"
            >
              {lang === "zh" ? "批量结算成功！" : "Checkout Successful!"}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {lang === "zh"
                ? "购物车中的穿搭道具已全部完成结算，并已安全存入您的玩家衣柜中。"
                : "All items in your cart have been successfully settled and added to your wardrobe."}
            </p>
            <div className="mt-6">
              <Button
                type="button"
                onClick={() => setFullscreenCheckoutSuccess(false)}
                className="w-full gap-2 bg-emerald-600 font-semibold text-white shadow-lg hover:bg-emerald-500"
              >
                {lang === "zh" ? "返回商城" : "Back to Shop"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={Boolean(selectedItem)} onOpenChange={closeDialog}>
        <DialogContent
          className="border-slate-700 bg-slate-950 text-slate-100 sm:max-w-xl max-h-[90vh] overflow-y-auto outline-none"
          onKeyDown={e => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              handlePrevItem();
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              handleNextItem();
            }
          }}
        >
          <DialogHeader className="border-b border-white/5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-xs text-slate-300"
                    >
                      {selectedItem
                        ? getCategoryLabel(
                            selectedItem.category,
                            lang === "zh" ? "zh" : "en"
                          )
                        : ""}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-cyan-500/20 text-xs text-cyan-300 border border-cyan-500/30"
                    >
                      {selectedItem
                        ? selectedItem.rarity === "signature"
                          ? lang === "zh"
                            ? "典藏"
                            : "Signature"
                          : selectedItem.rarity === "premium"
                            ? lang === "zh"
                              ? "进阶"
                              : "Premium"
                            : lang === "zh"
                              ? "标准"
                              : "Standard"
                        : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handlePrevItem}
                      disabled={!hasPrevItem}
                      aria-label={
                        lang === "zh" ? "上一件商品" : "Previous item"
                      }
                      className="h-8 px-2.5 text-xs border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      {lang === "zh" ? "上一件" : "Prev"}
                    </Button>
                    <span className="text-xs text-slate-400 font-mono px-1">
                      {selectedIndex >= 0
                        ? `${selectedIndex + 1} / ${filteredItems.length}`
                        : ""}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleNextItem}
                      disabled={!hasNextItem}
                      aria-label={lang === "zh" ? "下一件商品" : "Next item"}
                      className="h-8 px-2.5 text-xs border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                    >
                      {lang === "zh" ? "下一件" : "Next"}
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        selectedItem && toggleWishlist(selectedItem)
                      }
                      aria-label={
                        lang === "zh"
                          ? "收藏或取消收藏商品"
                          : "Toggle wishlist favorite"
                      }
                      className={`h-8 px-2.5 text-xs border transition-colors ${
                        selectedItem &&
                        wishlistedItemIds.includes(selectedItem.id)
                          ? "border-rose-500/40 bg-rose-950/40 text-rose-200 hover:bg-rose-900/50"
                          : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 mr-1 ${selectedItem && wishlistedItemIds.includes(selectedItem.id) ? "fill-rose-500 text-rose-400" : "text-slate-400"}`}
                      />
                      {selectedItem &&
                      wishlistedItemIds.includes(selectedItem.id)
                        ? lang === "zh"
                          ? "已收藏"
                          : "Saved"
                        : lang === "zh"
                          ? "收藏"
                          : "Favorite"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleShareItem}
                      aria-label={
                        lang === "zh" ? "分享商品链接" : "Share item link"
                      }
                      className="h-8 px-2.5 text-xs border-cyan-500/30 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/50 hover:text-white"
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1" />
                      {lang === "zh" ? "分享" : "Share"}
                    </Button>
                  </div>
                </div>
                <DialogTitle className="text-xl font-bold text-white pt-1">
                  {selectedItem
                    ? lang === "zh"
                      ? selectedItem.name
                      : selectedItem.nameEn
                    : ""}
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-sm text-slate-400 pt-1">
              {selectedItem
                ? lang === "zh"
                  ? selectedItem.description
                  : selectedItem.descriptionEn
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div
              key={selectedItem.id}
              data-testid="item-details-animated-content"
              className={`space-y-6 pt-2 ${slideDirection === "right" ? "animate-shop-slide-right" : "animate-shop-slide-left"}`}
            >
              <div
                className="relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-inner"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${selectedItem.accent}26 0%, #090e17 70%)`,
                }}
              >
                <div
                  className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-black/40 shadow-lg"
                  style={{ color: selectedItem.accent }}
                >
                  <Tag className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 font-semibold">
                    {lang === "zh"
                      ? "大图预览与道具规格"
                      : "Asset Preview & Specs"}
                  </p>
                  <p className="font-mono text-2xl font-bold text-white">
                    {formatISC(selectedItem.price)}{" "}
                    <span className="text-sm text-cyan-400">ISC</span>
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Asset ID: {selectedItem.id} | Slot: {selectedItem.slot}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  {lang === "zh"
                    ? "📖 城市背景故事"
                    : "📖 Urban Background Story"}
                </p>
                <p className="text-sm leading-6 text-slate-300">
                  {lang === "zh"
                    ? selectedItem.backgroundStory ||
                      `${selectedItem.name}是冰雪城市现代化都市生活中不可或缺的精选穿戴道具，兼具美学与实用性，深受各街区居民与职场人士喜爱。`
                    : selectedItem.backgroundStoryEn ||
                      `${selectedItem.nameEn} is an essential urban wearable in Ice Snow City, balancing aesthetics and everyday utility, favored by district residents and professionals alike.`}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">
                    {lang === "zh" ? "道具类型" : "Item Type"}
                  </p>
                  <p className="mt-1 font-medium text-slate-200">
                    {getItemTypeLabel(
                      selectedItem.itemType,
                      lang === "zh" ? "zh" : "en"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">
                    {lang === "zh" ? "穿戴槽位" : "Slot"}
                  </p>
                  <p className="mt-1 font-medium text-slate-200">
                    {selectedItem.slot}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">
                    {lang === "zh" ? "当前库存" : "Stock"}
                  </p>
                  <p className="mt-1 font-medium text-slate-200">
                    {selectedItem.stock}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {lang === "zh" ? "购买数量" : "Quantity"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1 || isPurchasing}
                    aria-label={
                      lang === "zh" ? "减少数量" : "Decrease quantity"
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-mono">{quantity}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={
                      quantity >=
                        Math.min(
                          selectedItem.stock,
                          selectedItem.stackable ? selectedItem.stock : 1
                        ) || isPurchasing
                    }
                    aria-label={
                      lang === "zh" ? "增加数量" : "Increase quantity"
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator className="bg-slate-800" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {lang === "zh" ? "当前余额" : "Current balance"}
                  </span>
                  <span className="font-mono">{formatISC(balance)} ISC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {lang === "zh" ? "应付总额" : "Total"}
                  </span>
                  <span className="font-mono text-lg font-semibold text-cyan-200">
                    {formatISC(selectedTotal)} ISC
                  </span>
                </div>
              </div>

              {!wallet.isConnected && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                  <span>
                    {lang === "zh"
                      ? "连接钱包后才能进行链上结算。"
                      : "Connect a wallet to settle on-chain."}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void wallet.connectWallet()}
                    disabled={wallet.isLoading}
                  >
                    {wallet.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : lang === "zh" ? (
                      "连接"
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </div>
              )}

              {purchaseError && (
                <div
                  className="flex gap-2 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100"
                  role="alert"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {purchaseError}
                </div>
              )}
              {purchaseReceipt && (
                <div
                  className="space-y-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100"
                  role="status"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    {lang === "zh"
                      ? "结算成功，道具已写入衣柜。"
                      : "Settled successfully; the item is now in your wardrobe."}
                  </div>
                  <p className="break-all font-mono text-xs text-emerald-200/80">
                    {purchaseReceipt.txHash}
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeDialog(false)}
                  disabled={isPurchasing}
                >
                  {lang === "zh" ? "关闭" : "Close"}
                </Button>
                <Button
                  type="button"
                  onClick={() => void handlePurchase()}
                  disabled={!canSettle || isPurchasing || isContractLoading}
                  className="gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold hover:from-cyan-400 hover:to-emerald-400"
                >
                  {isPurchasing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4" />
                  )}
                  {isPurchasing
                    ? lang === "zh"
                      ? "等待链上确认"
                      : "Waiting for confirmation"
                    : lang === "zh"
                      ? `支付 ${formatISC(selectedTotal)} ISC 确认购买`
                      : `Pay ${formatISC(selectedTotal)} ISC & Buy`}
                </Button>
              </DialogFooter>

              {/* Related Recommendations in Details Modal */}
              {selectedItem &&
                (() => {
                  const related = ITEM_SHOP_CATALOG.filter(
                    item =>
                      item.category === selectedItem.category &&
                      item.id !== selectedItem.id
                  ).slice(0, 3);
                  if (related.length === 0) return null;
                  return (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                          {lang === "zh"
                            ? "🔥 同类别热门推荐"
                            : "🔥 Related Hot Recommendations"}
                        </p>
                        <span className="text-xs text-slate-400 font-mono">
                          Category: {selectedItem.category}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {related.map(relItem => (
                          <button
                            key={relItem.id}
                            type="button"
                            onClick={() => {
                              setSlideDirection("right");
                              setSelectedItem(relItem);
                              setPurchaseError(null);
                              setPurchaseReceipt(null);
                              setQuantity(1);
                            }}
                            className="group flex flex-col items-start gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-all hover:border-cyan-400/40 hover:bg-cyan-950/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="font-medium text-white text-xs truncate group-hover:text-cyan-200">
                                {lang === "zh" ? relItem.name : relItem.nameEn}
                              </span>
                              <span className="font-mono text-xs font-semibold text-cyan-300">
                                {formatISC(relItem.price)} ISC
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {lang === "zh"
                                ? relItem.description
                                : relItem.descriptionEn}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default GameItemShop;
