/**
 * Random Events System
 * Generates random events that affect gameplay (weather, disasters, market events, etc.)
 */

import { GameState } from "./types";

export interface GameEvent {
  id: string;
  type: "weather" | "disaster" | "market" | "social" | "special";
  name: string;
  description: string;
  effects: {
    cropYieldModifier?: number;
    priceModifier?: number;
    moneyReward?: number;
    damageAmount?: number;
    durationDays?: number;
  };
  probability: number; // 0-1
  season?: "spring" | "summer" | "autumn" | "winter";
}

export const RANDOM_EVENTS: GameEvent[] = [
  // Weather events
  {
    id: "heavy_rain",
    type: "weather",
    name: "暴雨",
    description: "连续暴雨导致作物生长加快",
    effects: {
      cropYieldModifier: 1.3,
      durationDays: 3,
    },
    probability: 0.15,
    season: "spring",
  },
  {
    id: "drought",
    type: "weather",
    name: "干旱",
    description: "长期干旱导致作物减产",
    effects: {
      cropYieldModifier: 0.5,
      durationDays: 7,
    },
    probability: 0.2,
    season: "summer",
  },
  {
    id: "frost",
    type: "weather",
    name: "霜冻",
    description: "早期霜冻毁坏部分作物",
    effects: {
      cropYieldModifier: 0.3,
      damageAmount: 1000,
      durationDays: 2,
    },
    probability: 0.25,
    season: "autumn",
  },
  {
    id: "blizzard",
    type: "weather",
    name: "暴风雪",
    description: "严重暴风雪导致交通中断，商品短缺",
    effects: {
      priceModifier: 1.5,
      durationDays: 5,
    },
    probability: 0.3,
    season: "winter",
  },

  // Disaster events
  {
    id: "pest_infestation",
    type: "disaster",
    name: "虫灾",
    description: "农田遭受虫灾，需要立即处理",
    effects: {
      cropYieldModifier: 0.2,
      damageAmount: 2000,
    },
    probability: 0.1,
  },
  {
    id: "fire",
    type: "disaster",
    name: "火灾",
    description: "建筑物发生火灾，造成严重损失",
    effects: {
      damageAmount: 5000,
    },
    probability: 0.05,
  },
  {
    id: "flood",
    type: "disaster",
    name: "洪水",
    description: "洪水淹没部分农田和建筑",
    effects: {
      cropYieldModifier: 0.1,
      damageAmount: 3000,
      durationDays: 7,
    },
    probability: 0.08,
  },

  // Market events
  {
    id: "market_boom",
    type: "market",
    name: "市场繁荣",
    description: "商品需求增加，价格上涨",
    effects: {
      priceModifier: 1.4,
      durationDays: 5,
    },
    probability: 0.12,
  },
  {
    id: "market_crash",
    type: "market",
    name: "市场崩盘",
    description: "商品价格暴跌",
    effects: {
      priceModifier: 0.6,
      durationDays: 7,
    },
    probability: 0.08,
  },
  {
    id: "supply_shortage",
    type: "market",
    name: "供应短缺",
    description: "商品供应不足，价格飙升",
    effects: {
      priceModifier: 1.6,
      durationDays: 3,
    },
    probability: 0.1,
  },

  // Social events
  {
    id: "npc_birthday",
    type: "social",
    name: "NPC 生日",
    description: "某个 NPC 的生日，可以送礼增加好感度",
    effects: {
      moneyReward: 100,
    },
    probability: 0.3,
  },
  {
    id: "festival",
    type: "social",
    name: "节日庆典",
    description: "城市举办节日庆典，可以参加获得奖励",
    effects: {
      moneyReward: 500,
    },
    probability: 0.15,
  },
  {
    id: "community_event",
    type: "social",
    name: "社区活动",
    description: "社区组织活动，参加可以增加声望",
    effects: {
      moneyReward: 200,
    },
    probability: 0.2,
  },

  // Special events
  {
    id: "treasure_found",
    type: "special",
    name: "宝藏发现",
    description: "发现隐藏的宝藏！",
    effects: {
      moneyReward: 2000,
    },
    probability: 0.02,
  },
  {
    id: "inheritance",
    type: "special",
    name: "继承遗产",
    description: "远方亲戚留下遗产",
    effects: {
      moneyReward: 1000,
    },
    probability: 0.03,
  },
  {
    id: "lucky_day",
    type: "special",
    name: "幸运日",
    description: "今天是幸运日，所有收入翻倍",
    effects: {
      priceModifier: 2.0,
      durationDays: 1,
    },
    probability: 0.05,
  },
];

export class RandomEventService {
  /**
   * Get random events for current game time
   */
  static getRandomEventsForTime(
    gameTime: any,
    maxEvents: number = 3
  ): GameEvent[] {
    const applicableEvents = RANDOM_EVENTS.filter((event) => {
      // Check if event is applicable to current season
      if (event.season && event.season !== gameTime.season) {
        return false;
      }
      return true;
    });

    // Shuffle and select random events based on probability
    const selectedEvents: GameEvent[] = [];
    for (const event of applicableEvents) {
      if (Math.random() < event.probability && selectedEvents.length < maxEvents) {
        selectedEvents.push(event);
      }
    }

    return selectedEvents;
  }

  /**
   * Get event by ID
   */
  static getEventById(eventId: string): GameEvent | null {
    return RANDOM_EVENTS.find((event) => event.id === eventId) || null;
  }

  /**
   * Get events by type
   */
  static getEventsByType(
    type: "weather" | "disaster" | "market" | "social" | "special"
  ): GameEvent[] {
    return RANDOM_EVENTS.filter((event) => event.type === type);
  }

  /**
   * Get events by season
   */
  static getEventsBySeason(
    season: "spring" | "summer" | "autumn" | "winter"
  ): GameEvent[] {
    return RANDOM_EVENTS.filter(
      (event) => !event.season || event.season === season
    );
  }

  /**
   * Calculate event probability for current state
   */
  static calculateEventProbability(
    event: GameEvent,
    gameState: GameState
  ): number {
    let probability = event.probability;

    // Adjust probability based on game state
    if (event.type === "disaster") {
      // More disasters likely if player is poor
      if (gameState.wallet.money < 1000) {
        probability *= 1.5;
      }
    }

    if (event.type === "market") {
      // Market events more likely if player has many properties
      if ((gameState.properties?.length || 0) > 5) {
        probability *= 1.3;
      }
    }

    return Math.min(1, probability); // Cap at 1.0
  }

  /**
   * Apply event effects to game state
   */
  static applyEventEffects(
    event: GameEvent,
    gameState: GameState
  ): Partial<GameState> {
    const updates: Partial<GameState> = {};

    if (event.effects.moneyReward) {
      updates.wallet = {
        ...gameState.wallet,
        money: gameState.wallet.money + event.effects.moneyReward,
      };
    }

    if (event.effects.damageAmount) {
      updates.wallet = {
        ...gameState.wallet,
        money: Math.max(0, gameState.wallet.money - event.effects.damageAmount),
      };
    }

    return updates;
  }

  /**
   * Get event description with actual values
   */
  static getEventDescription(event: GameEvent, gameState: GameState): string {
    let description = event.description;

    if (event.effects.moneyReward) {
      description += ` 获得 ${event.effects.moneyReward} 金币`;
    }

    if (event.effects.damageAmount) {
      description += ` 损失 ${event.effects.damageAmount} 金币`;
    }

    if (event.effects.durationDays) {
      description += ` (持续 ${event.effects.durationDays} 天)`;
    }

    return description;
  }

  /**
   * Get all possible events
   */
  static getAllEvents(): GameEvent[] {
    return RANDOM_EVENTS;
  }

  /**
   * Get event statistics
   */
  static getEventStatistics(): {
    totalEvents: number;
    byType: Record<string, number>;
    averageProbability: number;
  } {
    const byType: Record<string, number> = {};
    let totalProbability = 0;

    for (const event of RANDOM_EVENTS) {
      byType[event.type] = (byType[event.type] || 0) + 1;
      totalProbability += event.probability;
    }

    return {
      totalEvents: RANDOM_EVENTS.length,
      byType,
      averageProbability: totalProbability / RANDOM_EVENTS.length,
    };
  }
}
