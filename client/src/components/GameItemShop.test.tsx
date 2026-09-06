import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { GameItemShop } from "./GameItemShop";
import type { InventoryItem } from "@/lib/itemShopUtils";

const mockConnectWallet = vi.fn();
const mockRefetchBalance = vi.fn().mockResolvedValue({});

vi.mock("@/hooks/useWeb3Wallet", () => ({
  useWeb3Wallet: () => ({
    isConnected: true,
    address: "0x0000000000000000000000000000000000000001",
    balance: "0.4",
    chainId: 97,
    provider: {},
    signer: {},
    isLoading: false,
    error: null,
    connectWallet: mockConnectWallet,
    disconnectWallet: vi.fn(),
    switchChain: vi.fn(),
    isSupported: true,
    chainName: "BSC Testnet",
  }),
}));

vi.mock("@/hooks/useISCToken", () => ({
  useISCTokenBalance: () => ({
    balance: "200",
    isLoading: false,
    error: null,
    refetch: mockRefetchBalance,
  }),
  useISCTokenContractAddress: () => ({
    contractAddress: "0x0000000000000000000000000000000000000002",
    isLoading: false,
    error: null,
  }),
}));

describe("GameItemShop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  function renderShop(onInventoryChange?: (inventory: unknown[]) => void) {
    return render(
      <LanguageProvider>
        <GameItemShop
          onPurchase={vi.fn().mockResolvedValue({ txHash: "0xshop" })}
          onInventoryChange={onInventoryChange}
        />
      </LanguageProvider>
    );
  }

  it("renders all 13 category controls and the live ISC balance", () => {
    renderShop();

    expect(screen.getByText("全部 13 类")).toBeTruthy();
    expect(screen.getByText("实时 ISC 余额")).toBeTruthy();
    expect(screen.getByText("200 ISC")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "帽子" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "法卡" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "发型" })).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(18);
    expect(screen.getByRole("tab", { name: "装备/武器" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "消耗品" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "材料" })).toBeTruthy();
  });

  it("filters items by item type and resets an empty result", () => {
    renderShop();

    fireEvent.click(screen.getByRole("tab", { name: "消耗品" }));
    expect(screen.getByText("城市能量饮料")).toBeTruthy();
    expect(screen.getByText("快修工具包")).toBeTruthy();
    expect(screen.queryByText("地铁线棒球帽")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "材料" }));
    expect(screen.getByText("雪纤维卷材")).toBeTruthy();
    expect(screen.getByText("城市灯带组件")).toBeTruthy();

    fireEvent.change(screen.getByRole("textbox", { name: "搜索商城道具" }), {
      target: { value: "不存在的商品" },
    });
    expect(screen.getByText("没有找到符合条件的城市道具")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "清除所有筛选条件" }));
    expect(screen.getByText("地铁线棒球帽")).toBeTruthy();
  });

  it("filters items by category and settles a purchase into the wardrobe callback", async () => {
    const onInventoryChange = vi.fn();
    renderShop(onInventoryChange);

    fireEvent.click(screen.getByRole("tab", { name: "鞋子" }));
    expect(screen.getByText("雪线通勤鞋")).toBeTruthy();
    expect(screen.queryByText("地铁线棒球帽")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "查看并购买" })[0]);
    expect(screen.getByText("当前余额")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /支付 148 ISC/ }));

    await waitFor(() => {
      expect(onInventoryChange).toHaveBeenCalledTimes(1);
      expect(screen.getByText("结算成功，道具已写入衣柜。")).toBeTruthy();
      expect(screen.getByText("0xshop")).toBeTruthy();
    });
  });

  it("quick-adds an item with success animation and haptic feedback, then displays the mini cart preview", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });
    renderShop();

    fireEvent.click(
      screen.getByRole("button", { name: "打开商品操作：地铁线棒球帽" })
    );
    fireEvent.click(screen.getByRole("button", { name: "快速加入购物车" }));

    await waitFor(() => {
      expect(screen.getByText("地铁线棒球帽 已加入购物车")).toBeTruthy();
      expect(screen.getByTestId("cart-add-success")).toBeTruthy();
      expect(
        within(screen.getByTestId("cart-add-success")).getByText("已加入购物车")
      ).toBeTruthy();
      expect(screen.getByTestId("cart-add-success-view-cart")).toBeTruthy();
    });

    expect(
      screen
        .getByTestId("cart-add-success")
        .querySelector("[class*='shop-success-pop']")
    ).toBeTruthy();
    expect(vibrate).toHaveBeenCalledWith([12, 24, 12]);

    fireEvent.click(screen.getByTestId("cart-add-success-view-cart"));
    await waitFor(() => {
      expect(screen.getByText("迷你购物车")).toBeTruthy();
      expect(screen.getByRole("button", { name: "关闭提示" })).toBeTruthy();
    });
    expect(screen.getAllByText("38 ISC").length).toBeGreaterThan(0);

    // Test removing item from mini cart
    fireEvent.click(
      screen.getByRole("button", { name: "从购物车移除 地铁线棒球帽" })
    );
    await waitFor(() => {
      expect(screen.getByText("购物车暂无穿搭道具，快去挑选吧！")).toBeTruthy();
    });
  });

  it("opens an NPC profile from the item action sheet and degrades honestly when its asset is unavailable", async () => {
    renderShop();

    fireEvent.click(
      screen.getByRole("button", { name: "打开商品操作：地铁线棒球帽" })
    );
    const npcAvatar = await screen.findByRole("button", {
      name: "查看 周驰 的 NPC 资料",
    });
    fireEvent.click(npcAvatar);

    await waitFor(() => {
      expect(screen.getByTestId("npc-profile-bottom-sheet")).toBeTruthy();
      expect(screen.getByRole("heading", { name: "周驰" })).toBeTruthy();
      expect(screen.getByText("社区快递物流专员")).toBeTruthy();
      expect(screen.getByText("城市背景故事")).toBeTruthy();
      expect(
        screen.getByText(/周驰负责连接快递站、商铺和玩家经营的店面/)
      ).toBeTruthy();
    });

    fireEvent.error(screen.getByAltText("周驰的高保真角色资产预览"));
    expect(
      screen.getByRole("img", { name: "周驰的高保真资产暂不可用" })
    ).toBeTruthy();
    expect(screen.getByText(/不会用占位图冒充已交付文件/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "关闭 NPC 档案" }));
    await waitFor(() => {
      expect(screen.queryByTestId("npc-profile-bottom-sheet")).toBeNull();
    });
  });

  it("switches item categories with horizontal swipe and exposes accessible arrow fallbacks", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
    renderShop();

    fireEvent.click(
      screen.getByRole("button", { name: "打开商品操作：地铁线棒球帽" })
    );
    const sheet = await screen.findByTestId("item-action-bottom-sheet");
    vi.spyOn(sheet, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 200,
      width: 320,
      height: 400,
      top: 200,
      right: 320,
      bottom: 600,
      left: 0,
      toJSON: () => ({}),
    });

    expect(
      within(screen.getByTestId("item-action-category-switcher")).getByText(
        "帽子"
      )
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "上一个商品分类",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "下一个商品分类",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);

    fireEvent.pointerDown(sheet, {
      pointerType: "touch",
      pageX: 260,
      pageY: 200,
      clientX: 260,
      clientY: 200,
    });
    fireEvent.pointerMove(sheet, {
      pointerType: "touch",
      pageX: 100,
      pageY: 210,
      clientX: 100,
      clientY: 210,
    });
    fireEvent.pointerUp(sheet, {
      pointerType: "touch",
      pageX: 100,
      pageY: 210,
      clientX: 100,
      clientY: 210,
    });
    await waitFor(() => {
      expect(
        within(screen.getByTestId("item-action-category-switcher")).getByText(
          "法卡"
        )
      ).toBeTruthy();
      expect(screen.getAllByText("街区通行卡").length).toBeGreaterThan(0);
    });
    expect(vibrate).toHaveBeenCalledWith(24);

    fireEvent.click(screen.getByRole("button", { name: "上一个商品分类" }));
    await waitFor(() =>
      expect(
        within(screen.getByTestId("item-action-category-switcher")).getByText(
          "帽子"
        )
      ).toBeTruthy()
    );

    fireEvent.pointerDown(sheet, {
      pointerType: "touch",
      pageX: 100,
      pageY: 200,
      clientX: 100,
      clientY: 200,
    });
    fireEvent.pointerMove(sheet, {
      pointerType: "touch",
      pageX: 260,
      pageY: 210,
      clientX: 260,
      clientY: 210,
    });
    fireEvent.pointerUp(sheet, {
      pointerType: "touch",
      pageX: 260,
      pageY: 210,
      clientX: 260,
      clientY: 210,
    });
    await waitFor(() =>
      expect(
        within(screen.getByTestId("item-action-category-switcher")).getByText(
          "帽子"
        )
      ).toBeTruthy()
    );
    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it("renders animated, descriptive badges for new and hot items", () => {
    renderShop();

    const newBadge = screen.getAllByLabelText("新品商品标签")[0];
    const hotBadge = screen.getAllByLabelText("热销商品标签")[0];

    expect(newBadge.classList.contains("shop-badge-interactive")).toBe(true);
    expect(newBadge.classList.contains("shop-badge-new")).toBe(true);
    expect(hotBadge.classList.contains("shop-badge-interactive")).toBe(true);
    expect(hotBadge.classList.contains("shop-badge-hot")).toBe(true);
    expect(hotBadge.querySelector(".shop-badge-flame")).toBeTruthy();
    expect(newBadge.getAttribute("title")).toContain("新品");
    expect(hotBadge.getAttribute("title")).toContain("热销");
  });

  it("toggles wishlist favorite status with heart button and persists count", async () => {
    renderShop();

    expect(screen.getByText("心愿单")).toBeTruthy();
    const heartBtn = screen.getByRole("button", {
      name: "加入收藏：地铁线棒球帽",
    });
    expect(heartBtn).toBeTruthy();

    fireEvent.click(heartBtn);

    await waitFor(() => {
      expect(screen.getByText("已将 地铁线棒球帽 加入心愿单")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "取消收藏：地铁线棒球帽" })
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "取消收藏：地铁线棒球帽" })
    );
    await waitFor(() => {
      expect(screen.getByText("已将 地铁线棒球帽 移出心愿单")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "加入收藏：地铁线棒球帽" })
      ).toBeTruthy();
    });
  });

  it("proceeds to checkout from mini cart, clears cart, and triggers fullscreen success dialog", async () => {
    renderShop();

    fireEvent.click(
      screen.getByRole("button", { name: "打开商品操作：地铁线棒球帽" })
    );
    fireEvent.click(screen.getByRole("button", { name: "快速加入购物车" }));

    await waitFor(() => {
      expect(screen.getByText("地铁线棒球帽 已加入购物车")).toBeTruthy();
      expect(screen.getByTestId("cart-add-success-view-cart")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("cart-add-success-view-cart"));
    const checkoutBtn = screen.getByRole("button", {
      name: "去结算（一键清空并写入衣柜）",
    });
    expect(checkoutBtn).toBeTruthy();
    expect((checkoutBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(screen.getByText("批量结算成功！")).toBeTruthy();
      expect(
        screen.getByText(
          "购物车中的穿搭道具已全部完成结算，并已安全存入您的玩家衣柜中。"
        )
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "返回商城" }));
    expect(screen.queryByText("批量结算成功！")).toBeNull();
  });

  it("performs real-time global search and clears query with clear button", async () => {
    renderShop();

    const searchInput = screen.getByRole("textbox", { name: "搜索商城道具" });
    fireEvent.change(searchInput, { target: { value: "天台渔夫帽" } });

    expect(screen.getByText("天台渔夫帽")).toBeTruthy();
    expect(screen.queryByText("地铁线棒球帽")).toBeNull();

    const clearBtn = screen.getByRole("button", { name: "清除搜索关键词" });
    expect(clearBtn).toBeTruthy();

    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect((searchInput as HTMLInputElement).value).toBe("");
      expect(screen.getByText("地铁线棒球帽")).toBeTruthy();
    });
  });

  it("shows popular search recommendations on focus and fills input on click", async () => {
    renderShop();

    const searchInput = screen.getByRole("textbox", { name: "搜索商城道具" });
    fireEvent.focus(searchInput);

    expect(screen.getByText("🔥 热门搜索推荐")).toBeTruthy();
    const popularTermBtn = screen.getByRole("button", { name: "棒球帽" });
    expect(popularTermBtn).toBeTruthy();

    fireEvent.click(popularTermBtn);

    await waitFor(() => {
      expect((searchInput as HTMLInputElement).value).toBe("棒球帽");
      expect(screen.getByText("地铁线棒球帽")).toBeTruthy();
    });
  });

  it("opens item details modal on card click with background story and asset preview", async () => {
    renderShop();

    const card = screen.getByRole("button", { name: "查看 地铁线棒球帽 详情" });
    expect(card).toBeTruthy();

    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByText("📖 城市背景故事")).toBeTruthy();
      expect(screen.getByText("大图预览与道具规格")).toBeTruthy();
    });
  });

  it("supports previous and next item navigation inside the details modal", async () => {
    renderShop();

    const card = screen.getByRole("button", { name: "查看 地铁线棒球帽 详情" });
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getAllByText("地铁线棒球帽").length).toBeGreaterThan(0);
    });

    const nextBtn = screen.getByRole("button", { name: "下一件商品" });
    expect(nextBtn).toBeTruthy();

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getAllByText("天台渔夫帽").length).toBeGreaterThan(0);
    });

    const prevBtn = screen.getByRole("button", { name: "上一件商品" });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getAllByText("地铁线棒球帽").length).toBeGreaterThan(0);
    });
  });

  it("applies slide transition classes when switching items in details modal", async () => {
    renderShop();

    const card = screen.getByRole("button", { name: "查看 地铁线棒球帽 详情" });
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getAllByText("地铁线棒球帽").length).toBeGreaterThan(0);
    });

    const nextBtn = screen.getByRole("button", { name: "下一件商品" });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      const animatedContainer = screen.getByTestId(
        "item-details-animated-content"
      );
      expect(animatedContainer.className).toContain("animate-shop-slide-right");
    });
  });

  it("renders related recommendations and allows clicking to switch item details", async () => {
    renderShop();

    const card = screen.getByRole("button", { name: "查看 地铁线棒球帽 详情" });
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByText("🔥 同类别热门推荐")).toBeTruthy();
    });

    // Metro cap is category 'hat'. Another hat in catalog is '天台渔夫帽'
    const relatedHatBtn = screen.getByRole("button", { name: /天台渔夫帽/i });
    expect(relatedHatBtn).toBeTruthy();

    fireEvent.click(relatedHatBtn);

    await waitFor(() => {
      expect(screen.getAllByText("天台渔夫帽").length).toBeGreaterThan(0);
    });
  });

  it("copies share link to clipboard and shows toast feedback on share button click", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderShop();

    const card = screen.getByRole("button", { name: "查看 地铁线棒球帽 详情" });
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "分享商品链接" })).toBeTruthy();
    });

    const shareBtn = screen.getByRole("button", { name: "分享商品链接" });
    fireEvent.click(shareBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("item=hat-metro-cap")
    );

    await waitFor(() => {
      expect(
        screen.getByText(/已复制“地铁线棒球帽”的专属分享链接！/i)
      ).toBeTruthy();
    });
  });

  it("quick-adds a wishlist item, updates the cart, and closes the wishlist preview", async () => {
    renderShop();

    fireEvent.click(
      screen.getByRole("button", { name: "加入收藏：地铁线棒球帽" })
    );
    fireEvent.click(screen.getByTestId("wishlist-trigger-btn"));

    const quickAdd = await screen.findByRole("button", {
      name: "快速加入购物车：地铁线棒球帽",
    });
    expect((quickAdd as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(quickAdd);

    await waitFor(() => {
      expect(screen.getByText("地铁线棒球帽 已加入购物车")).toBeTruthy();
      expect(screen.getByText("迷你购物车")).toBeTruthy();
      expect(screen.queryByText("我的心愿单")).toBeNull();
    });
    expect(
      screen.getByRole("button", { name: "查看购物车预览" }).textContent
    ).toContain("1");
  });

  it("disables wishlist quick-add for a non-stackable item already in inventory", async () => {
    const ownedInventory: InventoryItem[] = [
      { itemId: "hat-metro-cap", quantity: 1, purchasedAt: 1 },
    ];
    render(
      <LanguageProvider>
        <GameItemShop
          initialInventory={ownedInventory}
          onPurchase={vi.fn().mockResolvedValue({ txHash: "0xshop" })}
        />
      </LanguageProvider>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "加入收藏：地铁线棒球帽" })
    );
    fireEvent.click(screen.getByTestId("wishlist-trigger-btn"));

    const quickAdd = await screen.findByRole("button", {
      name: "快速加入购物车：地铁线棒球帽",
    });
    expect((quickAdd as HTMLButtonElement).disabled).toBe(true);
    expect(quickAdd.getAttribute("title")).toContain("已经拥有");
  });

  it("toggles favorite inside details modal and opens top wishlist preview dropdown", async () => {
    renderShop();

    const card = screen.getByRole("button", { name: "查看 地铁线棒球帽 详情" });
    fireEvent.click(card);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "收藏或取消收藏商品" })
      ).toBeTruthy();
    });

    const favoriteBtn = screen.getByRole("button", {
      name: "收藏或取消收藏商品",
    });
    fireEvent.click(favoriteBtn);

    await waitFor(() => {
      expect(screen.getByText("已收藏")).toBeTruthy();
    });

    const wishlistTrigger = screen.getByTestId("wishlist-trigger-btn");
    fireEvent.click(wishlistTrigger);

    await waitFor(() => {
      expect(screen.getByText("我的心愿单")).toBeTruthy();
      expect(screen.getAllByText("地铁线棒球帽").length).toBeGreaterThan(0);
    });
  });
});
