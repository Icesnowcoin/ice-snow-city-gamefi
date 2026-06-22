/**
 * Game tRPC Router
 * Handles all game-related procedures for the Ice Snow City game
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

// ─── Mock Data ──────────────────────────────────────────────────────────────

const mockPlayer = {
  id: 1,
  username: "Player1",
  level: 15,
  experience: 5420,
  totalAssets: BigInt(125000),
  iscBalance: BigInt(50000),
  stamina: 85,
  reputation: 450,
};

const mockNPCs = [
  {
    id: 1,
    name: "Alice Chen",
    profession: "Merchant",
    location: "Downtown Market",
    status: "available" as const,
    relationshipValue: 45,
    image: "👩‍💼",
    description: "A successful businesswoman who trades in luxury goods",
  },
  {
    id: 2,
    name: "Bob Johnson",
    profession: "Farmer",
    location: "Countryside Farm",
    status: "available" as const,
    relationshipValue: 30,
    image: "👨‍🌾",
    description: "A dedicated farmer growing organic vegetables",
  },
  {
    id: 3,
    name: "Carol Martinez",
    profession: "Chef",
    location: "Gourmet Restaurant",
    status: "busy" as const,
    relationshipValue: 60,
    image: "👩‍🍳",
    description: "A renowned chef creating culinary masterpieces",
  },
  {
    id: 4,
    name: "David Lee",
    profession: "Banker",
    location: "Central Bank",
    status: "available" as const,
    relationshipValue: 20,
    image: "👨‍💼",
    description: "A financial expert managing the city's banking system",
  },
  {
    id: 5,
    name: "Emma Wilson",
    profession: "Real Estate Agent",
    location: "Property Office",
    status: "available" as const,
    relationshipValue: 35,
    image: "👩‍💼",
    description: "A skilled real estate agent with prime properties",
  },
];

const mockTasks = [
  {
    id: 1,
    title: "Deliver Fresh Vegetables",
    description: "Help Bob deliver fresh vegetables to the market",
    npcId: 2,
    difficulty: "easy" as const,
    reward: BigInt(500),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    title: "Prepare Special Dinner",
    description: "Assist Carol in preparing a special dinner for VIP guests",
    npcId: 3,
    difficulty: "hard" as const,
    reward: BigInt(2000),
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: "Market Research",
    description: "Conduct market research for Alice's new product line",
    npcId: 1,
    difficulty: "medium" as const,
    reward: BigInt(1000),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
];

const mockShopItems = [
  {
    id: 1,
    name: "Fresh Vegetables Bundle",
    category: "Food",
    price: BigInt(100),
    stock: 50,
    rating: 4.5,
    reviews: 120,
    description: "Fresh organic vegetables from local farms",
  },
  {
    id: 2,
    name: "Gourmet Cheese Set",
    category: "Food",
    price: BigInt(250),
    stock: 30,
    rating: 4.8,
    reviews: 85,
    description: "Premium imported cheese selection",
  },
  {
    id: 3,
    name: "Luxury Watch",
    category: "Accessories",
    price: BigInt(5000),
    stock: 5,
    rating: 4.9,
    reviews: 42,
    description: "Elegant luxury timepiece",
  },
  {
    id: 4,
    name: "Coffee Maker Pro",
    category: "Appliances",
    price: BigInt(800),
    stock: 15,
    rating: 4.6,
    reviews: 200,
    description: "Professional-grade coffee maker",
  },
];

const mockProperties = [
  {
    id: 1,
    name: "Downtown Apartment",
    location: "City Center",
    type: "residential" as const,
    price: BigInt(50000),
    area: 120,
    monthlyIncome: BigInt(2000),
    occupancy: 100,
    status: "available" as const,
    ownerId: null,
    description: "Modern apartment in the heart of the city",
  },
  {
    id: 2,
    name: "Shopping Mall Space",
    location: "Commercial District",
    type: "commercial" as const,
    price: BigInt(200000),
    area: 500,
    monthlyIncome: BigInt(15000),
    occupancy: 85,
    status: "available" as const,
    ownerId: null,
    description: "Prime commercial space with high foot traffic",
  },
  {
    id: 3,
    name: "Industrial Warehouse",
    location: "Industrial Zone",
    type: "industrial" as const,
    price: BigInt(150000),
    area: 1000,
    monthlyIncome: BigInt(8000),
    occupancy: 70,
    status: "available" as const,
    ownerId: null,
    description: "Large warehouse suitable for storage or manufacturing",
  },
];

const mockFarms = [
  {
    id: 1,
    playerId: 1,
    name: "Farm 1",
    crop: "Wheat",
    area: 50,
    status: "growing" as const,
    plantedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    harvestAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    growth: 60,
    expectedYield: BigInt(5000),
    currentYield: BigInt(0),
  },
  {
    id: 2,
    playerId: 1,
    name: "Farm 2",
    crop: "Corn",
    area: 30,
    status: "ready" as const,
    plantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    harvestAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    growth: 100,
    expectedYield: BigInt(3000),
    currentYield: BigInt(3000),
  },
];

const mockTransactions = [
  {
    id: 1,
    playerId: 1,
    type: "deposit" as const,
    amount: BigInt(10000),
    fromAddress: "0x123...",
    toAddress: "0x456...",
    txHash: "0xabc...",
    status: "success" as const,
    description: "Deposit from wallet",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    playerId: 1,
    type: "purchase" as const,
    amount: BigInt(500),
    fromAddress: null,
    toAddress: null,
    txHash: null,
    status: "success" as const,
    description: "Purchase from shop",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    playerId: 1,
    type: "reward" as const,
    amount: BigInt(1000),
    fromAddress: null,
    toAddress: null,
    txHash: null,
    status: "success" as const,
    description: "Task completion reward",
    createdAt: new Date(),
  },
];

// ─── Game Router ────────────────────────────────────────────────────────────

export const gameRouter = router({
  // ─── Player Procedures ──────────────────────────────────────────────────
  player: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return mockPlayer;
    }),

    updateProfile: protectedProcedure
      .input(z.object({ username: z.string().optional() }))
      .mutation(async ({ input }) => {
        return { ...mockPlayer, username: input.username || mockPlayer.username };
      }),

    getAssets: protectedProcedure.query(async ({ ctx }) => {
      return {
        iscBalance: mockPlayer.iscBalance,
        properties: mockProperties.filter((p) => p.ownerId === mockPlayer.id),
        farms: mockFarms.filter((f) => f.playerId === mockPlayer.id),
        inventory: [
          { itemId: 1, quantity: 5 },
          { itemId: 2, quantity: 2 },
        ],
      };
    }),

    addExperience: protectedProcedure
      .input(z.object({ amount: z.bigint() }))
      .mutation(async ({ input }) => {
        return {
          ...mockPlayer,
          experience: mockPlayer.experience + Number(input.amount),
        };
      }),
  }),

  // ─── NPC Procedures ─────────────────────────────────────────────────────
  npc: router({
    getAll: publicProcedure.query(async () => {
      return mockNPCs;
    }),

    getDetails: publicProcedure
      .input(z.object({ npcId: z.number() }))
      .query(async ({ input }) => {
        return mockNPCs.find((npc) => npc.id === input.npcId);
      }),

    interact: protectedProcedure
      .input(z.object({ npcId: z.number(), action: z.string() }))
      .mutation(async ({ input }) => {
        const npc = mockNPCs.find((n) => n.id === input.npcId);
        return {
          success: true,
          npc,
          reward: input.action === "trade" ? BigInt(100) : BigInt(0),
          message: `You ${input.action}d with ${npc?.name}`,
        };
      }),

    updateRelationship: protectedProcedure
      .input(z.object({ npcId: z.number(), delta: z.number() }))
      .mutation(async ({ input }) => {
        const npc = mockNPCs.find((n) => n.id === input.npcId);
        if (npc) {
          npc.relationshipValue += input.delta;
        }
        return npc;
      }),
  }),

  // ─── Task Procedures ────────────────────────────────────────────────────
  task: router({
    getAll: publicProcedure.query(async () => {
      return mockTasks;
    }),

    getPlayerTasks: protectedProcedure.query(async ({ ctx }) => {
      return mockTasks.map((task) => ({
        ...task,
        status: "available" as const,
        progress: 0,
      }));
    }),

    acceptTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        const task = mockTasks.find((t) => t.id === input.taskId);
        return {
          success: true,
          task,
          message: `Task "${task?.title}" accepted`,
        };
      }),

    completeTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        const task = mockTasks.find((t) => t.id === input.taskId);
        return {
          success: true,
          task,
          reward: task?.reward,
          message: `Task "${task?.title}" completed! Earned ${task?.reward} ISC`,
        };
      }),
  }),

  // ─── Shop Procedures ────────────────────────────────────────────────────
  shop: router({
    getItems: publicProcedure.query(async () => {
      return mockShopItems;
    }),

    searchItems: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return mockShopItems.filter(
          (item) =>
            item.name.toLowerCase().includes(input.query.toLowerCase()) ||
            item.description.toLowerCase().includes(input.query.toLowerCase())
        );
      }),

    purchaseItem: protectedProcedure
      .input(z.object({ itemId: z.number(), quantity: z.number() }))
      .mutation(async ({ input }) => {
        const item = mockShopItems.find((i) => i.id === input.itemId);
        if (!item) {
          throw new Error("Item not found");
        }
        const totalCost = item.price * BigInt(input.quantity);
        return {
          success: true,
          item,
          quantity: input.quantity,
          totalCost,
          message: `Purchased ${input.quantity}x ${item.name} for ${totalCost} ISC`,
        };
      }),
  }),

  // ─── Real Estate Procedures ─────────────────────────────────────────────
  realEstate: router({
    getProperties: publicProcedure.query(async () => {
      return mockProperties;
    }),

    getPlayerProperties: protectedProcedure.query(async ({ ctx }) => {
      return mockProperties.filter((p) => p.ownerId === mockPlayer.id);
    }),

    purchaseProperty: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ input }) => {
        const property = mockProperties.find((p) => p.id === input.propertyId);
        if (!property) {
          throw new Error("Property not found");
        }
        return {
          success: true,
          property: { ...property, ownerId: mockPlayer.id, status: "owned" as const },
          message: `Successfully purchased ${property.name} for ${property.price} ISC`,
        };
      }),

    rentProperty: protectedProcedure
      .input(z.object({ propertyId: z.number(), months: z.number() }))
      .mutation(async ({ input }) => {
        const property = mockProperties.find((p) => p.id === input.propertyId);
        if (!property) {
          throw new Error("Property not found");
        }
        const rentalCost = property.monthlyIncome * BigInt(input.months);
        return {
          success: true,
          property,
          rentalCost,
          message: `Rented ${property.name} for ${input.months} months (${rentalCost} ISC)`,
        };
      }),
  }),

  // ─── Agriculture Procedures ─────────────────────────────────────────────
  agriculture: router({
    getFarms: protectedProcedure.query(async ({ ctx }) => {
      return mockFarms;
    }),

    plantCrop: protectedProcedure
      .input(z.object({ farmId: z.number(), crop: z.string() }))
      .mutation(async ({ input }) => {
        const farm = mockFarms.find((f) => f.id === input.farmId);
        if (!farm) {
          throw new Error("Farm not found");
        }
        return {
          success: true,
          farm: { ...farm, crop: input.crop, status: "planting" as const },
          message: `Planted ${input.crop} on farm ${input.farmId}`,
        };
      }),

    harvestCrop: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .mutation(async ({ input }) => {
        const farm = mockFarms.find((f) => f.id === input.farmId);
        if (!farm) {
          throw new Error("Farm not found");
        }
        return {
          success: true,
          farm: { ...farm, status: "harvested" as const },
          yield: farm.expectedYield,
          message: `Harvested ${farm.crop}! Yield: ${farm.expectedYield} ISC`,
        };
      }),

    getGrowthStatus: publicProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        const farm = mockFarms.find((f) => f.id === input.farmId);
        if (!farm) {
          throw new Error("Farm not found");
        }
        return {
          farmId: farm.id,
          crop: farm.crop,
          growth: farm.growth,
          status: farm.status,
          daysRemaining: farm.harvestAt
            ? Math.ceil((farm.harvestAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
            : 0,
        };
      }),
  }),

  // ─── Wallet Procedures ──────────────────────────────────────────────────
  wallet: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      return {
        iscBalance: mockPlayer.iscBalance,
        usdValue: mockPlayer.iscBalance * BigInt(10), // Mock: 1 ISC = $10
      };
    }),

    getTransactions: protectedProcedure.query(async ({ ctx }) => {
      return mockTransactions;
    }),

    deposit: protectedProcedure
      .input(z.object({ amount: z.bigint(), address: z.string() }))
      .mutation(async ({ input }) => {
        return {
          success: true,
          txHash: "0x" + Math.random().toString(16).slice(2),
          amount: input.amount,
          message: `Deposit initiated: ${input.amount} ISC from ${input.address}`,
        };
      }),

    withdraw: protectedProcedure
      .input(z.object({ amount: z.bigint(), address: z.string() }))
      .mutation(async ({ input }) => {
        if (input.amount > mockPlayer.iscBalance) {
          throw new Error("Insufficient balance");
        }
        return {
          success: true,
          txHash: "0x" + Math.random().toString(16).slice(2),
          amount: input.amount,
          gasFee: BigInt(50),
          message: `Withdrawal initiated: ${input.amount} ISC to ${input.address}`,
        };
      }),

    transfer: protectedProcedure
      .input(z.object({ amount: z.bigint(), toPlayer: z.string() }))
      .mutation(async ({ input }) => {
        return {
          success: true,
          amount: input.amount,
          toPlayer: input.toPlayer,
          message: `Transferred ${input.amount} ISC to ${input.toPlayer}`,
        };
      }),
  }),

  // ─── Banking Procedures ─────────────────────────────────────────────────
  banking: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      return {
        depositBalance: BigInt(25000),
        interestRate: 0.05, // 5% APY
        accumulatedInterest: BigInt(625),
      };
    }),

    deposit: protectedProcedure
      .input(z.object({ amount: z.bigint() }))
      .mutation(async ({ input }) => {
        return {
          success: true,
          depositedAmount: input.amount,
          totalBalance: BigInt(25000) + input.amount,
          message: `Deposited ${input.amount} ISC to bank account`,
        };
      }),

    withdraw: protectedProcedure
      .input(z.object({ amount: z.bigint() }))
      .mutation(async ({ input }) => {
        return {
          success: true,
          withdrawnAmount: input.amount,
          remainingBalance: BigInt(25000) - input.amount,
          message: `Withdrew ${input.amount} ISC from bank account`,
        };
      }),

    claimInterest: protectedProcedure.mutation(async ({ ctx }) => {
      return {
        success: true,
        interestClaimed: BigInt(625),
        message: "Claimed accumulated interest: 625 ISC",
      };
    }),
  }),
});
