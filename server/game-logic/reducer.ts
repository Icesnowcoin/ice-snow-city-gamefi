/**
 * Game Reducer - Centralized state management for all game mechanics
 * Follows Redux/Farmhand pattern for predictable state mutations
 */

import type { GameState, GameAction, GameTime } from './types';

/**
 * Initialize default game state for a new player
 */
export function createInitialGameState(playerId: string, playerName: string): GameState {
  const now = new Date();

  return {
    player: {
      id: playerId,
      name: playerName,
      level: 1,
      experience: 0,
      totalExperience: 0,
      joinedAt: now,
      lastActiveAt: now,
    },
    assets: {
      money: 1000,
      isc: 0,
      energy: 100,
      food: 50,
      water: 50,
      population: 1,
      reputation: 0,
    },
    progress: {
      tasksCompleted: 0,
      npcsFriended: 0,
      propertiesOwned: 0,
      farmsCreated: 0,
      itemsTraded: 0,
      achievements: [],
    },
    wallet: {
      playerId,
      money: 1000,
      isc: 0,
      lastUpdated: now,
    },
    inventory: {
      playerId,
      items: [],
      capacity: 20,
    },
    npcRelationships: [],
    npcInteractionHistory: [],
    transactions: [],
    bankAccount: {
      playerId,
      balance: 0,
      depositCount: 0,
      totalDeposited: 0,
      interestRate: 5, // 5% APY
      lastInterestPaid: now,
      accountCreatedAt: now,
    },
    marketPrices: [],
    properties: [],
    rentals: [],
    farms: [],
    harvestHistory: [],
    tasks: [],
    gameTime: {
      day: 1,
      month: 1,
      year: 1,
      hour: 8,
      minute: 0,
      season: 'spring',
    },
    lastSaved: now,
    version: '1.0.0',
  };
}

/**
 * Main game reducer - handles all state mutations
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // ========================================================================
    // PLAYER ACTIONS
    // ========================================================================

    case 'PLAYER_GAIN_EXPERIENCE': {
      const newExperience = state.player.experience + action.payload.amount;
      const experiencePerLevel = 1000;
      const newLevel = Math.floor(newExperience / experiencePerLevel) + 1;

      return {
        ...state,
        player: {
          ...state.player,
          experience: newExperience % experiencePerLevel,
          level: newLevel,
          totalExperience: state.player.totalExperience + action.payload.amount,
          lastActiveAt: new Date(),
        },
      };
    }

    case 'PLAYER_LEVEL_UP': {
      return {
        ...state,
        player: {
          ...state.player,
          level: action.payload.newLevel,
          lastActiveAt: new Date(),
        },
      };
    }

    case 'PLAYER_UPDATE_PROFILE': {
      return {
        ...state,
        player: {
          ...state.player,
          ...action.payload,
          lastActiveAt: new Date(),
        },
      };
    }

    // ========================================================================
    // ASSET ACTIONS
    // ========================================================================

    case 'ASSET_ADD_MONEY': {
      return {
        ...state,
        assets: {
          ...state.assets,
          money: Math.max(0, state.assets.money + action.payload.amount),
        },
      };
    }

    case 'ASSET_REMOVE_MONEY': {
      return {
        ...state,
        assets: {
          ...state.assets,
          money: Math.max(0, state.assets.money - action.payload.amount),
        },
      };
    }

    case 'ASSET_ADD_ISC': {
      return {
        ...state,
        assets: {
          ...state.assets,
          isc: Math.max(0, state.assets.isc + action.payload.amount),
        },
      };
    }

    case 'ASSET_REMOVE_ISC': {
      return {
        ...state,
        assets: {
          ...state.assets,
          isc: Math.max(0, state.assets.isc - action.payload.amount),
        },
      };
    }

    case 'ASSET_ADD_ENERGY': {
      return {
        ...state,
        assets: {
          ...state.assets,
          energy: Math.min(100, state.assets.energy + action.payload.amount),
        },
      };
    }

    case 'ASSET_REMOVE_ENERGY': {
      return {
        ...state,
        assets: {
          ...state.assets,
          energy: Math.max(0, state.assets.energy - action.payload.amount),
        },
      };
    }

    case 'ASSET_ADD_FOOD': {
      return {
        ...state,
        assets: {
          ...state.assets,
          food: Math.max(0, state.assets.food + action.payload.amount),
        },
      };
    }

    case 'ASSET_REMOVE_FOOD': {
      return {
        ...state,
        assets: {
          ...state.assets,
          food: Math.max(0, state.assets.food - action.payload.amount),
        },
      };
    }

    case 'ASSET_ADD_POPULATION': {
      return {
        ...state,
        assets: {
          ...state.assets,
          population: state.assets.population + action.payload.amount,
        },
      };
    }

    case 'ASSET_REMOVE_POPULATION': {
      return {
        ...state,
        assets: {
          ...state.assets,
          population: Math.max(1, state.assets.population - action.payload.amount),
        },
      };
    }

    // ========================================================================
    // NPC ACTIONS
    // ========================================================================

    case 'NPC_INTERACT': {
      const existingRelationship = state.npcRelationships.find(
        (r) => r.npcId === action.payload.npcId
      );

      const updatedRelationships = existingRelationship
        ? state.npcRelationships.map((r) =>
            r.npcId === action.payload.npcId
              ? {
                  ...r,
                  lastInteraction: new Date(),
                  interactionCount: r.interactionCount + 1,
                }
              : r
          )
        : [
            ...state.npcRelationships,
            {
              npcId: action.payload.npcId,
              favorability: 0,
              relationship: 'stranger' as const,
              lastInteraction: new Date(),
              interactionCount: 1,
              likes: [],
              dislikes: [],
            },
          ];

      return {
        ...state,
        npcRelationships: updatedRelationships,
      };
    }

    case 'NPC_UPDATE_RELATIONSHIP': {
      return {
        ...state,
        npcRelationships: state.npcRelationships.map((r) =>
          r.npcId === action.payload.npcId
            ? {
                ...r,
                favorability: Math.min(100, Math.max(0, r.favorability + action.payload.favorabilityChange)),
                relationship: getRelationshipLevel(
                  Math.min(100, Math.max(0, r.favorability + action.payload.favorabilityChange))
                ),
              }
            : r
        ),
      };
    }

    case 'NPC_GIFT': {
      // Gifting typically increases favorability
      return {
        ...state,
        npcRelationships: state.npcRelationships.map((r) =>
          r.npcId === action.payload.npcId
            ? {
                ...r,
                favorability: Math.min(100, r.favorability + 10),
                relationship: getRelationshipLevel(Math.min(100, r.favorability + 10)),
              }
            : r
        ),
        inventory: {
          ...state.inventory,
          items: state.inventory.items.filter((item) => item.itemId !== action.payload.itemId),
        },
      };
    }

    case 'NPC_DATE': {
      // Dating typically increases favorability significantly
      return {
        ...state,
        npcRelationships: state.npcRelationships.map((r) =>
          r.npcId === action.payload.npcId
            ? {
                ...r,
                favorability: Math.min(100, r.favorability + 15),
                relationship: getRelationshipLevel(Math.min(100, r.favorability + 15)),
              }
            : r
        ),
        assets: {
          ...state.assets,
          money: Math.max(0, state.assets.money - 50), // Dating costs money
        },
      };
    }

    // ========================================================================
    // ECONOMY ACTIONS
    // ========================================================================

    case 'WALLET_DEPOSIT': {
      const newWallet = { ...state.wallet };
      if (action.payload.currency === 'money') {
        newWallet.money += action.payload.amount;
      } else {
        newWallet.isc += action.payload.amount;
      }
      newWallet.lastUpdated = new Date();

      return {
        ...state,
        wallet: newWallet,
        assets: {
          ...state.assets,
          [action.payload.currency === 'money' ? 'money' : 'isc']:
            state.assets[action.payload.currency === 'money' ? 'money' : 'isc'] + action.payload.amount,
        },
      };
    }

    case 'WALLET_WITHDRAW': {
      const newWallet = { ...state.wallet };
      if (action.payload.currency === 'money') {
        newWallet.money = Math.max(0, newWallet.money - action.payload.amount);
      } else {
        newWallet.isc = Math.max(0, newWallet.isc - action.payload.amount);
      }
      newWallet.lastUpdated = new Date();

      return {
        ...state,
        wallet: newWallet,
        assets: {
          ...state.assets,
          [action.payload.currency === 'money' ? 'money' : 'isc']: Math.max(
            0,
            state.assets[action.payload.currency === 'money' ? 'money' : 'isc'] - action.payload.amount
          ),
        },
      };
    }

    case 'TRANSACTION_ADD': {
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    }

    case 'BANK_DEPOSIT': {
      return {
        ...state,
        bankAccount: {
          ...state.bankAccount,
          balance: state.bankAccount.balance + action.payload.amount,
          depositCount: state.bankAccount.depositCount + 1,
          totalDeposited: state.bankAccount.totalDeposited + action.payload.amount,
        },
        wallet: {
          ...state.wallet,
          money: Math.max(0, state.wallet.money - action.payload.amount),
        },
      };
    }

    case 'BANK_WITHDRAW': {
      return {
        ...state,
        bankAccount: {
          ...state.bankAccount,
          balance: Math.max(0, state.bankAccount.balance - action.payload.amount),
        },
        wallet: {
          ...state.wallet,
          money: state.wallet.money + action.payload.amount,
        },
      };
    }

    case 'BANK_CLAIM_INTEREST': {
      return {
        ...state,
        bankAccount: {
          ...state.bankAccount,
          balance: state.bankAccount.balance + action.payload.amount,
          lastInterestPaid: new Date(),
        },
        assets: {
          ...state.assets,
          isc: state.assets.isc + action.payload.amount,
        },
      };
    }

    // ========================================================================
    // PROPERTY ACTIONS
    // ========================================================================

    case 'PROPERTY_PURCHASE': {
      return {
        ...state,
        properties: state.properties.map((p) =>
          p.id === action.payload.propertyId
            ? {
                ...p,
                ownerId: state.player.id,
                purchaseDate: new Date(),
              }
            : p
        ),
        assets: {
          ...state.assets,
          money: Math.max(0, state.assets.money - action.payload.price),
        },
        progress: {
          ...state.progress,
          propertiesOwned: state.progress.propertiesOwned + 1,
        },
      };
    }

    case 'PROPERTY_COLLECT_RENT': {
      return {
        ...state,
        assets: {
          ...state.assets,
          money: state.assets.money + action.payload.amount,
        },
      };
    }

    case 'PROPERTY_SELL': {
      return {
        ...state,
        properties: state.properties.map((p) =>
          p.id === action.payload.propertyId
            ? {
                ...p,
                ownerId: null,
              }
            : p
        ),
        assets: {
          ...state.assets,
          money: state.assets.money + action.payload.price,
        },
        progress: {
          ...state.progress,
          propertiesOwned: Math.max(0, state.progress.propertiesOwned - 1),
        },
      };
    }

    case 'PROPERTY_RENT': {
      return {
        ...state,
        rentals: [
          ...state.rentals,
          {
            propertyId: action.payload.propertyId,
            renterId: action.payload.renterId,
            ownerId: state.player.id,
            monthlyRent: action.payload.monthlyRent,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'active' as const,
          },
        ],
        properties: state.properties.map((p) =>
          p.id === action.payload.propertyId
            ? {
                ...p,
                isRented: true,
                rentalIncome: action.payload.monthlyRent,
              }
            : p
        ),
      };
    }

    // ========================================================================
    // FARM ACTIONS
    // ========================================================================

    case 'FARM_CREATE': {
      return {
        ...state,
        farms: [...state.farms, action.payload],
        progress: {
          ...state.progress,
          farmsCreated: state.progress.farmsCreated + 1,
        },
      };
    }

    case 'FARM_HARVEST': {
      return {
        ...state,
        harvestHistory: [
          ...state.harvestHistory,
          {
            cropId: action.payload.cropId,
            quantity: action.payload.yield,
            quality: 100,
            profit: action.payload.yield * 10, // Simplified profit calculation
            timestamp: new Date(),
          },
        ],
        assets: {
          ...state.assets,
          money: state.assets.money + action.payload.yield * 10,
        },
      };
    }

    case 'FARM_PLANT': {
      return {
        ...state,
        farms: state.farms.map((f) =>
          f.id === action.payload.farmId
            ? {
                ...f,
                crops: [
                  ...f.crops,
                  {
                    id: `crop-${Date.now()}`,
                    farmId: f.id,
                    type: action.payload.cropType,
                    plantedAt: new Date(),
                    harvestDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    status: 'growing' as const,
                    yield: 0,
                    quality: 100,
                  },
                ],
                availablePlots: Math.max(0, f.availablePlots - action.payload.quantity),
              }
            : f
        ),
      };
    }

    case 'FARM_WATER': {
      return {
        ...state,
        assets: {
          ...state.assets,
          water: Math.max(0, state.assets.water - action.payload.quantity),
        },
      };
    }

    case 'FARM_FERTILIZE': {
      return {
        ...state,
        assets: {
          ...state.assets,
          money: Math.max(0, state.assets.money - action.payload.quantity * 10),
        },
      };
    }

    // ========================================================================
    // TASK ACTIONS
    // ========================================================================

    case 'TASK_ACCEPT': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? {
                ...t,
                status: 'accepted' as const,
                acceptedAt: new Date(),
              }
            : t
        ),
      };
    }

    case 'TASK_COMPLETE': {
      const newExperience = state.player.experience + action.payload.reward.experience;
      const experiencePerLevel = 1000;
      const newLevel = Math.floor(newExperience / experiencePerLevel) + 1;

      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? {
                ...t,
                status: 'completed' as const,
                completedAt: new Date(),
              }
            : t
        ),
        assets: {
          ...state.assets,
          money: state.assets.money + action.payload.reward.money,
          isc: state.assets.isc + action.payload.reward.isc,
        },
        player: {
          ...state.player,
          experience: newExperience % experiencePerLevel,
          level: newLevel,
          totalExperience: state.player.totalExperience + action.payload.reward.experience,
        },
        progress: {
          ...state.progress,
          tasksCompleted: state.progress.tasksCompleted + 1,
        },
      };
    }

    case 'TASK_FAIL': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? {
                ...t,
                status: 'failed' as const,
              }
            : t
        ),
      };
    }

    case 'TASK_ABANDON': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? {
                ...t,
                status: 'available' as const,
                acceptedAt: undefined,
              }
            : t
        ),
      };
    }

    // ========================================================================
    // SHOP ACTIONS
    // ========================================================================

    case 'SHOP_PURCHASE': {
      const existingItem = state.inventory.items.find((i) => i.itemId === action.payload.itemId);
      const updatedItems = existingItem
        ? state.inventory.items.map((i) =>
            i.itemId === action.payload.itemId
              ? {
                  ...i,
                  quantity: i.quantity + action.payload.quantity,
                }
              : i
          )
        : [
            ...state.inventory.items,
            {
              itemId: action.payload.itemId,
              quantity: action.payload.quantity,
              acquiredAt: new Date(),
            },
          ];

      return {
        ...state,
        inventory: {
          ...state.inventory,
          items: updatedItems,
        },
        assets: {
          ...state.assets,
          money: Math.max(0, state.assets.money - action.payload.cost),
        },
      };
    }

    case 'INVENTORY_ADD': {
      const existingItem = state.inventory.items.find((i) => i.itemId === action.payload.itemId);
      const updatedItems = existingItem
        ? state.inventory.items.map((i) =>
            i.itemId === action.payload.itemId
              ? {
                  ...i,
                  quantity: i.quantity + action.payload.quantity,
                }
              : i
          )
        : [
            ...state.inventory.items,
            {
              itemId: action.payload.itemId,
              quantity: action.payload.quantity,
              acquiredAt: new Date(),
            },
          ];

      return {
        ...state,
        inventory: {
          ...state.inventory,
          items: updatedItems,
        },
      };
    }

    case 'INVENTORY_REMOVE': {
      return {
        ...state,
        inventory: {
          ...state.inventory,
          items: state.inventory.items
            .map((i) =>
              i.itemId === action.payload.itemId
                ? {
                    ...i,
                    quantity: Math.max(0, i.quantity - action.payload.quantity),
                  }
                : i
            )
            .filter((i) => i.quantity > 0),
        },
      };
    }

    case 'WALLET_TRANSFER': {
      // Note: This is a simplified implementation
      // In a real system, this would involve two players and server-side validation
      return {
        ...state,
        wallet: {
          ...state.wallet,
          [action.payload.currency === 'money' ? 'money' : 'isc']: Math.max(
            0,
            state.wallet[action.payload.currency === 'money' ? 'money' : 'isc'] -
              action.payload.amount
          ),
        },
        transactions: [
          ...state.transactions,
          {
            id: `tx-${Date.now()}`,
            playerId: state.player.id,
            type: 'transfer',
            amount: action.payload.amount,
            currency: action.payload.currency,
            description: `Transfer to ${action.payload.toPlayerId}`,
            timestamp: new Date(),
            status: 'completed',
          },
        ],
      };
    }

    // ========================================================================
    // GAME META ACTIONS
    // ========================================================================

    case 'GAME_TIME_ADVANCE': {
      const newGameTime = advanceGameTime(state.gameTime, action.payload.minutes);
      return {
        ...state,
        gameTime: newGameTime,
      };
    }

    case 'GAME_SAVE': {
      return {
        ...state,
        lastSaved: action.payload.timestamp,
      };
    }

    case 'GAME_LOAD': {
      return action.payload;
    }

    default:
      return state;
  }
}

/**
 * Helper function to determine relationship level based on favorability
 */
function getRelationshipLevel(favorability: number): 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'lover' {
  if (favorability < 20) return 'stranger';
  if (favorability < 40) return 'acquaintance';
  if (favorability < 60) return 'friend';
  if (favorability < 80) return 'close_friend';
  return 'lover';
}

/**
 * Helper function to advance game time
 */
function advanceGameTime(gameTime: GameTime, minutes: number): GameTime {
  let totalMinutes = gameTime.hour * 60 + gameTime.minute + minutes;

  let day = gameTime.day;
  let month = gameTime.month;
  let year = gameTime.year;

  // Calculate days
  const daysAdvanced = Math.floor(totalMinutes / (24 * 60));
  totalMinutes = totalMinutes % (24 * 60);

  day += daysAdvanced;

  // Handle month/year transitions
  const daysInMonth = 30;
  if (day > daysInMonth) {
    const monthsAdvanced = Math.floor((day - 1) / daysInMonth);
    month += monthsAdvanced;
    day = ((day - 1) % daysInMonth) + 1;

    if (month > 12) {
      const yearsAdvanced = Math.floor((month - 1) / 12);
      year += yearsAdvanced;
      month = ((month - 1) % 12) + 1;
    }
  }

  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;

  // Determine season
  const seasonMap: Record<number, GameTime['season']> = {
    1: 'spring',
    2: 'spring',
    3: 'spring',
    4: 'summer',
    5: 'summer',
    6: 'summer',
    7: 'autumn',
    8: 'autumn',
    9: 'autumn',
    10: 'winter',
    11: 'winter',
    12: 'winter',
  };

  return {
    day,
    month,
    year,
    hour,
    minute,
    season: seasonMap[month] || 'spring',
  };
}
