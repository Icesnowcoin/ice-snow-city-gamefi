/**
 * Advanced Business Facilities System
 * Implements: Restaurants, Cafes, Libraries, Landmarks, Ad Spaces, Gardens, Flower Shops
 */

export interface RestaurantFacility {
  id: string;
  ownerId: string;
  name: string;
  level: number;
  capacity: number;
  dailyRevenue: number;
  menu: MenuItem[];
  staff: number;
  reputation: number;
  createdAt: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  popularity: number;
  preparationTime: number;
}

export interface CafeFacility {
  id: string;
  ownerId: string;
  name: string;
  level: number;
  capacity: number;
  dailyRevenue: number;
  coffeeTypes: CoffeeType[];
  staff: number;
  ambiance: number;
  createdAt: number;
}

export interface CoffeeType {
  id: string;
  name: string;
  price: number;
  popularity: number;
}

export interface LibraryFacility {
  id: string;
  ownerId: string;
  name: string;
  level: number;
  bookCount: number;
  dailyRevenue: number;
  books: Book[];
  visitors: number;
  reputation: number;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  copies: number;
  borrowedCount: number;
}

export interface LandmarkFacility {
  id: string;
  ownerId: string;
  name: string;
  level: number;
  attractiveness: number;
  dailyVisitors: number;
  dailyRevenue: number;
  type: string;
  createdAt: number;
}

export interface AdSpaceFacility {
  id: string;
  ownerId: string;
  location: string;
  level: number;
  visibility: number;
  dailyRevenue: number;
  activeAds: Advertisement[];
  totalAds: number;
  createdAt: number;
}

export interface Advertisement {
  id: string;
  advertiserName: string;
  content: string;
  startDate: number;
  endDate: number;
  dailyRate: number;
}

export interface GardenFacility {
  id: string;
  ownerId: string;
  name: string;
  level: number;
  plantCount: number;
  dailyRevenue: number;
  plants: Plant[];
  harvestReady: number;
  createdAt: number;
}

export interface Plant {
  id: string;
  type: string;
  quantity: number;
  growthStage: number;
  harvestDate: number;
}

export interface FlowerShopFacility {
  id: string;
  ownerId: string;
  name: string;
  level: number;
  flowerTypes: number;
  dailyRevenue: number;
  inventory: FlowerInventory[];
  reputation: number;
  createdAt: number;
}

export interface FlowerInventory {
  id: string;
  flowerType: string;
  quantity: number;
  price: number;
  freshness: number;
}

// Restaurant System
export class RestaurantSystem {
  static createRestaurant(ownerId: string, name: string): RestaurantFacility {
    return {
      id: `rest_${Date.now()}`,
      ownerId,
      name,
      level: 1,
      capacity: 50,
      dailyRevenue: 0,
      menu: this.getDefaultMenu(),
      staff: 5,
      reputation: 50,
      createdAt: Date.now(),
    };
  }

  static getDefaultMenu(): MenuItem[] {
    return [
      { id: 'menu_1', name: 'Pasta', price: 100, popularity: 80, preparationTime: 300 },
      { id: 'menu_2', name: 'Steak', price: 150, popularity: 90, preparationTime: 600 },
      { id: 'menu_3', name: 'Salad', price: 50, popularity: 60, preparationTime: 120 },
    ];
  }

  static upgradeRestaurant(restaurant: RestaurantFacility): RestaurantFacility {
    return {
      ...restaurant,
      level: restaurant.level + 1,
      capacity: Math.floor(restaurant.capacity * 1.3),
      staff: restaurant.staff + 2,
      reputation: Math.min(100, restaurant.reputation + 10),
    };
  }

  static addMenuItem(restaurant: RestaurantFacility, item: MenuItem): RestaurantFacility {
    return {
      ...restaurant,
      menu: [...restaurant.menu, item],
    };
  }

  static calculateDailyRevenue(restaurant: RestaurantFacility): number {
    const baseRevenue = restaurant.menu.reduce((sum, item) => sum + item.price * (item.popularity / 100), 0);
    const staffMultiplier = 1 + (restaurant.staff / 10);
    const reputationMultiplier = 1 + (restaurant.reputation / 100);
    return Math.floor(baseRevenue * restaurant.capacity * staffMultiplier * reputationMultiplier);
  }
}

// Cafe System
export class CafeSystem {
  static createCafe(ownerId: string, name: string): CafeFacility {
    return {
      id: `cafe_${Date.now()}`,
      ownerId,
      name,
      level: 1,
      capacity: 30,
      dailyRevenue: 0,
      coffeeTypes: this.getDefaultCoffeeTypes(),
      staff: 3,
      ambiance: 60,
      createdAt: Date.now(),
    };
  }

  static getDefaultCoffeeTypes(): CoffeeType[] {
    return [
      { id: 'coffee_1', name: 'Espresso', price: 30, popularity: 80 },
      { id: 'coffee_2', name: 'Cappuccino', price: 40, popularity: 90 },
      { id: 'coffee_3', name: 'Latte', price: 45, popularity: 85 },
    ];
  }

  static upgradeCafe(cafe: CafeFacility): CafeFacility {
    return {
      ...cafe,
      level: cafe.level + 1,
      capacity: Math.floor(cafe.capacity * 1.25),
      staff: cafe.staff + 1,
      ambiance: Math.min(100, cafe.ambiance + 15),
    };
  }

  static calculateDailyRevenue(cafe: CafeFacility): number {
    const baseRevenue = cafe.coffeeTypes.reduce((sum, coffee) => sum + coffee.price * (coffee.popularity / 100), 0);
    const ambianceMultiplier = 1 + (cafe.ambiance / 100);
    return Math.floor(baseRevenue * cafe.capacity * ambianceMultiplier);
  }
}

// Library System
export class LibrarySystem {
  static createLibrary(ownerId: string, name: string): LibraryFacility {
    return {
      id: `lib_${Date.now()}`,
      ownerId,
      name,
      level: 1,
      bookCount: 100,
      dailyRevenue: 0,
      books: this.getDefaultBooks(),
      visitors: 0,
      reputation: 50,
      createdAt: Date.now(),
    };
  }

  static getDefaultBooks(): Book[] {
    return [
      { id: 'book_1', title: 'Adventure Tales', author: 'Author A', genre: 'Adventure', copies: 10, borrowedCount: 0 },
      { id: 'book_2', title: 'Mystery Novel', author: 'Author B', genre: 'Mystery', copies: 8, borrowedCount: 0 },
      { id: 'book_3', title: 'Science Guide', author: 'Author C', genre: 'Science', copies: 12, borrowedCount: 0 },
    ];
  }

  static upgradeLibrary(library: LibraryFacility): LibraryFacility {
    return {
      ...library,
      level: library.level + 1,
      bookCount: Math.floor(library.bookCount * 1.5),
      reputation: Math.min(100, library.reputation + 10),
    };
  }

  static addBook(library: LibraryFacility, book: Book): LibraryFacility {
    return {
      ...library,
      books: [...library.books, book],
      bookCount: library.bookCount + book.copies,
    };
  }

  static calculateDailyRevenue(library: LibraryFacility): number {
    const baseRevenue = 50 * (library.reputation / 100);
    const bookMultiplier = 1 + (library.bookCount / 100);
    return Math.floor(baseRevenue * bookMultiplier * library.level);
  }
}

// Landmark System
export class LandmarkSystem {
  static createLandmark(ownerId: string, name: string, type: string): LandmarkFacility {
    return {
      id: `land_${Date.now()}`,
      ownerId,
      name,
      level: 1,
      attractiveness: 60,
      dailyVisitors: 100,
      dailyRevenue: 0,
      type,
      createdAt: Date.now(),
    };
  }

  static upgradeLandmark(landmark: LandmarkFacility): LandmarkFacility {
    return {
      ...landmark,
      level: landmark.level + 1,
      attractiveness: Math.min(100, landmark.attractiveness + 15),
      dailyVisitors: Math.floor(landmark.dailyVisitors * 1.3),
    };
  }

  static calculateDailyRevenue(landmark: LandmarkFacility): number {
    const baseRevenue = landmark.dailyVisitors * (landmark.attractiveness / 100);
    return Math.floor(baseRevenue * landmark.level);
  }
}

// Ad Space System
export class AdSpaceSystem {
  static createAdSpace(ownerId: string, location: string): AdSpaceFacility {
    return {
      id: `ads_${Date.now()}`,
      ownerId,
      location,
      level: 1,
      visibility: 60,
      dailyRevenue: 0,
      activeAds: [],
      totalAds: 0,
      createdAt: Date.now(),
    };
  }

  static upgradeAdSpace(adSpace: AdSpaceFacility): AdSpaceFacility {
    return {
      ...adSpace,
      level: adSpace.level + 1,
      visibility: Math.min(100, adSpace.visibility + 20),
    };
  }

  static addAdvertisement(adSpace: AdSpaceFacility, ad: Advertisement): AdSpaceFacility {
    return {
      ...adSpace,
      activeAds: [...adSpace.activeAds, ad],
      totalAds: adSpace.totalAds + 1,
    };
  }

  static calculateDailyRevenue(adSpace: AdSpaceFacility): number {
    const activeRevenue = adSpace.activeAds.reduce((sum, ad) => sum + ad.dailyRate, 0);
    const visibilityMultiplier = 1 + (adSpace.visibility / 100);
    return Math.floor(activeRevenue * visibilityMultiplier * adSpace.level);
  }
}

// Garden System
export class GardenSystem {
  static createGarden(ownerId: string, name: string): GardenFacility {
    return {
      id: `gard_${Date.now()}`,
      ownerId,
      name,
      level: 1,
      plantCount: 50,
      dailyRevenue: 0,
      plants: this.getDefaultPlants(),
      harvestReady: 0,
      createdAt: Date.now(),
    };
  }

  static getDefaultPlants(): Plant[] {
    return [
      { id: 'plant_1', type: 'Rose', quantity: 20, growthStage: 0, harvestDate: Date.now() + 86400000 },
      { id: 'plant_2', type: 'Tulip', quantity: 15, growthStage: 0, harvestDate: Date.now() + 86400000 },
      { id: 'plant_3', type: 'Daisy', quantity: 15, growthStage: 0, harvestDate: Date.now() + 86400000 },
    ];
  }

  static upgradeGarden(garden: GardenFacility): GardenFacility {
    return {
      ...garden,
      level: garden.level + 1,
      plantCount: Math.floor(garden.plantCount * 1.4),
    };
  }

  static calculateDailyRevenue(garden: GardenFacility): number {
    const baseRevenue = garden.plantCount * 5;
    return Math.floor(baseRevenue * garden.level);
  }
}

// Flower Shop System
export class FlowerShopSystem {
  static createFlowerShop(ownerId: string, name: string): FlowerShopFacility {
    return {
      id: `shop_${Date.now()}`,
      ownerId,
      name,
      level: 1,
      flowerTypes: 5,
      dailyRevenue: 0,
      inventory: this.getDefaultInventory(),
      reputation: 50,
      createdAt: Date.now(),
    };
  }

  static getDefaultInventory(): FlowerInventory[] {
    return [
      { id: 'inv_1', flowerType: 'Rose', quantity: 50, price: 100, freshness: 100 },
      { id: 'inv_2', flowerType: 'Tulip', quantity: 40, price: 80, freshness: 100 },
      { id: 'inv_3', flowerType: 'Daisy', quantity: 60, price: 60, freshness: 100 },
    ];
  }

  static upgradeFlowerShop(shop: FlowerShopFacility): FlowerShopFacility {
    return {
      ...shop,
      level: shop.level + 1,
      flowerTypes: shop.flowerTypes + 2,
      reputation: Math.min(100, shop.reputation + 10),
    };
  }

  static calculateDailyRevenue(shop: FlowerShopFacility): number {
    const baseRevenue = shop.inventory.reduce((sum, item) => sum + item.price * (item.quantity / 100), 0);
    const reputationMultiplier = 1 + (shop.reputation / 100);
    return Math.floor(baseRevenue * reputationMultiplier * shop.level);
  }
}

// Export all systems
export const AdvancedBusinessFacilities = {
  RestaurantSystem,
  CafeSystem,
  LibrarySystem,
  LandmarkSystem,
  AdSpaceSystem,
  GardenSystem,
  FlowerShopSystem,
};
