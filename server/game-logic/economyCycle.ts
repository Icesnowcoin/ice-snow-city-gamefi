/**
 * Economy Cycle System
 * Manages market prices, seasonal changes, and economic cycles
 */

import { GameState, GameTime } from "./types";

export interface MarketCycle {
  itemId: string;
  basePrices: Record<string, number>; // season -> price
  volatility: number; // 0-1, how much prices fluctuate
  trend: "rising" | "falling" | "stable";
  demandLevel: "low" | "medium" | "high";
}

export interface SeasonalModifier {
  season: "spring" | "summer" | "autumn" | "winter";
  cropMultiplier: number;
  demandMultiplier: number;
  weatherEffect: string;
}

export const SEASONAL_MODIFIERS: Record<string, SeasonalModifier> = {
  spring: {
    season: "spring",
    cropMultiplier: 0.8, // Lower prices, more supply
    demandMultiplier: 1.0,
    weatherEffect: "pleasant",
  },
  summer: {
    season: "summer",
    cropMultiplier: 1.2, // Higher prices, less supply
    demandMultiplier: 1.3,
    weatherEffect: "hot",
  },
  autumn: {
    season: "autumn",
    cropMultiplier: 0.9, // Harvest season, moderate prices
    demandMultiplier: 1.1,
    weatherEffect: "mild",
  },
  winter: {
    season: "winter",
    cropMultiplier: 1.5, // Scarcity, high prices
    demandMultiplier: 1.4,
    weatherEffect: "cold",
  },
};

export const BASE_MARKET_PRICES: Record<string, number> = {
  wheat: 100,
  corn: 120,
  rice: 150,
  tomato: 80,
  carrot: 60,
  apple: 90,
  milk: 200,
  egg: 50,
  meat: 300,
  fish: 250,
};

export class EconomyCycleService {
  /**
   * Get current season modifier
   */
  static getSeasonalModifier(gameTime: GameTime): SeasonalModifier {
    return SEASONAL_MODIFIERS[gameTime.season];
  }

  /**
   * Calculate market price for item based on season and demand
   */
  static calculateMarketPrice(
    itemId: string,
    gameTime: GameTime,
    demandLevel: "low" | "medium" | "high" = "medium",
    volatility: number = 0.1
  ): number {
    const basePrice = BASE_MARKET_PRICES[itemId] || 100;
    const modifier = this.getSeasonalModifier(gameTime);

    // Apply seasonal modifier
    let price = basePrice * modifier.cropMultiplier;

    // Apply demand modifier
    const demandMultipliers = { low: 0.8, medium: 1.0, high: 1.3 };
    price *= demandMultipliers[demandLevel];

    // Add random volatility
    const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
    price *= randomFactor;

    return Math.round(price);
  }

  /**
   * Get price trend for next period
   */
  static getPriceTrend(
    itemId: string,
    currentPrice: number,
    gameTime: GameTime
  ): { trend: "rising" | "falling" | "stable"; nextPrice: number } {
    const modifier = this.getSeasonalModifier(gameTime);
    const nextSeason = this.getNextSeason(gameTime.season);
    const nextModifier = SEASONAL_MODIFIERS[nextSeason];

    const basePrice = BASE_MARKET_PRICES[itemId] || 100;
    const currentModified = basePrice * modifier.cropMultiplier;
    const nextModified = basePrice * nextModifier.cropMultiplier;

    let trend: "rising" | "falling" | "stable";
    if (nextModified > currentModified * 1.1) {
      trend = "rising";
    } else if (nextModified < currentModified * 0.9) {
      trend = "falling";
    } else {
      trend = "stable";
    }

    return {
      trend,
      nextPrice: Math.round(nextModified),
    };
  }

  /**
   * Get next season
   */
  private static getNextSeason(
    season: "spring" | "summer" | "autumn" | "winter"
  ): "spring" | "summer" | "autumn" | "winter" {
    const seasons = ["spring", "summer", "autumn", "winter"];
    const currentIndex = seasons.indexOf(season);
    return seasons[(currentIndex + 1) % 4] as any;
  }

  /**
   * Calculate interest accrual for bank account
   */
  static calculateMonthlyInterest(
    bankBalance: number,
    interestRate: number,
    gameTime: GameTime
  ): number {
    // Interest accrues monthly
    const monthlyRate = interestRate / 100 / 12;
    const interest = Math.floor(bankBalance * monthlyRate);
    return Math.max(1, interest); // Minimum 1 ISC interest
  }

  /**
   * Check if month has changed
   */
  static hasMonthChanged(previousTime: GameTime, currentTime: GameTime): boolean {
    return previousTime.month !== currentTime.month || previousTime.year !== currentTime.year;
  }

  /**
   * Check if season has changed
   */
  static hasSeasonChanged(
    previousTime: GameTime,
    currentTime: GameTime
  ): boolean {
    return previousTime.season !== currentTime.season;
  }

  /**
   * Get economic forecast for next 4 seasons
   */
  static getEconomicForecast(
    itemId: string,
    currentGameTime: GameTime
  ): Array<{
    season: string;
    predictedPrice: number;
    demand: "low" | "medium" | "high";
  }> {
    const forecast = [];
    let currentSeason = currentGameTime.season;
    const basePrice = BASE_MARKET_PRICES[itemId] || 100;

    for (let i = 0; i < 4; i++) {
      const modifier = SEASONAL_MODIFIERS[currentSeason];
      const predictedPrice = Math.round(basePrice * modifier.cropMultiplier);

      const demand: "low" | "medium" | "high" =
        currentSeason === "winter"
          ? "high"
          : currentSeason === "spring"
          ? "low"
          : "medium";

      forecast.push({
        season: currentSeason,
        predictedPrice,
        demand,
      });

      // Move to next season
      const seasons = ["spring", "summer", "autumn", "winter"];
      const index = seasons.indexOf(currentSeason);
      currentSeason = seasons[(index + 1) % 4] as any;
    }

    return forecast;
  }

  /**
   * Calculate total asset value based on current market prices
   */
  static calculateAssetValue(
    items: Record<string, number>,
    gameTime: GameTime
  ): number {
    let totalValue = 0;

    for (const [itemId, quantity] of Object.entries(items)) {
      const price = this.calculateMarketPrice(itemId, gameTime, "medium");
      totalValue += price * quantity;
    }

    return totalValue;
  }

  /**
   * Get market volatility index (0-100)
   */
  static getMarketVolatilityIndex(gameTime: GameTime): number {
    // Volatility increases in winter (scarcity) and decreases in spring (abundance)
    const baseVolatility = {
      spring: 20,
      summer: 30,
      autumn: 25,
      winter: 60,
    };

    return baseVolatility[gameTime.season];
  }

  /**
   * Apply economic shock (random event affecting prices)
   */
  static applyEconomicShock(
    itemId: string,
    shockType: "positive" | "negative",
    magnitude: number = 0.2
  ): number {
    const basePrice = BASE_MARKET_PRICES[itemId] || 100;
    const shockMultiplier = shockType === "positive" ? 1 + magnitude : 1 - magnitude;
    return Math.round(basePrice * shockMultiplier);
  }
}
