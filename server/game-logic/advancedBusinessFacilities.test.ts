import { describe, it, expect } from 'vitest';
import {
  RestaurantSystem,
  CafeSystem,
  LibrarySystem,
  LandmarkSystem,
  AdSpaceSystem,
  GardenSystem,
  FlowerShopSystem,
} from './advancedBusinessFacilities';

describe('Advanced Business Facilities', () => {
  describe('Restaurant System', () => {
    it('should create a restaurant', () => {
      const restaurant = RestaurantSystem.createRestaurant('player1', 'Fine Dining');
      expect(restaurant.ownerId).toBe('player1');
      expect(restaurant.name).toBe('Fine Dining');
      expect(restaurant.level).toBe(1);
      expect(restaurant.capacity).toBe(50);
      expect(restaurant.staff).toBe(5);
      expect(restaurant.menu.length).toBeGreaterThan(0);
    });

    it('should upgrade restaurant', () => {
      const restaurant = RestaurantSystem.createRestaurant('player1', 'Restaurant');
      const upgraded = RestaurantSystem.upgradeRestaurant(restaurant);
      expect(upgraded.level).toBe(2);
      expect(upgraded.capacity).toBeGreaterThan(restaurant.capacity);
      expect(upgraded.staff).toBeGreaterThan(restaurant.staff);
    });

    it('should calculate daily revenue', () => {
      const restaurant = RestaurantSystem.createRestaurant('player1', 'Restaurant');
      const revenue = RestaurantSystem.calculateDailyRevenue(restaurant);
      expect(revenue).toBeGreaterThan(0);
    });

    it('should add menu item', () => {
      const restaurant = RestaurantSystem.createRestaurant('player1', 'Restaurant');
      const initialCount = restaurant.menu.length;
      const newItem = { id: 'new', name: 'Pizza', price: 80, popularity: 85, preparationTime: 400 };
      const updated = RestaurantSystem.addMenuItem(restaurant, newItem);
      expect(updated.menu.length).toBe(initialCount + 1);
    });
  });

  describe('Cafe System', () => {
    it('should create a cafe', () => {
      const cafe = CafeSystem.createCafe('player1', 'Coffee House');
      expect(cafe.ownerId).toBe('player1');
      expect(cafe.name).toBe('Coffee House');
      expect(cafe.level).toBe(1);
      expect(cafe.capacity).toBe(30);
      expect(cafe.staff).toBe(3);
    });

    it('should upgrade cafe', () => {
      const cafe = CafeSystem.createCafe('player1', 'Cafe');
      const upgraded = CafeSystem.upgradeCafe(cafe);
      expect(upgraded.level).toBe(2);
      expect(upgraded.capacity).toBeGreaterThan(cafe.capacity);
      expect(upgraded.ambiance).toBeGreaterThan(cafe.ambiance);
    });

    it('should calculate daily revenue', () => {
      const cafe = CafeSystem.createCafe('player1', 'Cafe');
      const revenue = CafeSystem.calculateDailyRevenue(cafe);
      expect(revenue).toBeGreaterThan(0);
    });
  });

  describe('Library System', () => {
    it('should create a library', () => {
      const library = LibrarySystem.createLibrary('player1', 'Public Library');
      expect(library.ownerId).toBe('player1');
      expect(library.name).toBe('Public Library');
      expect(library.level).toBe(1);
      expect(library.bookCount).toBe(100);
      expect(library.books.length).toBeGreaterThan(0);
    });

    it('should upgrade library', () => {
      const library = LibrarySystem.createLibrary('player1', 'Library');
      const upgraded = LibrarySystem.upgradeLibrary(library);
      expect(upgraded.level).toBe(2);
      expect(upgraded.bookCount).toBeGreaterThan(library.bookCount);
    });

    it('should add book to library', () => {
      const library = LibrarySystem.createLibrary('player1', 'Library');
      const initialCount = library.books.length;
      const newBook = {
        id: 'book_new',
        title: 'New Book',
        author: 'Author D',
        genre: 'Fiction',
        copies: 5,
        borrowedCount: 0,
      };
      const updated = LibrarySystem.addBook(library, newBook);
      expect(updated.books.length).toBe(initialCount + 1);
      expect(updated.bookCount).toBeGreaterThan(library.bookCount);
    });

    it('should calculate daily revenue', () => {
      const library = LibrarySystem.createLibrary('player1', 'Library');
      const revenue = LibrarySystem.calculateDailyRevenue(library);
      expect(revenue).toBeGreaterThan(0);
    });
  });

  describe('Landmark System', () => {
    it('should create a landmark', () => {
      const landmark = LandmarkSystem.createLandmark('player1', 'Monument', 'statue');
      expect(landmark.ownerId).toBe('player1');
      expect(landmark.name).toBe('Monument');
      expect(landmark.type).toBe('statue');
      expect(landmark.level).toBe(1);
    });

    it('should upgrade landmark', () => {
      const landmark = LandmarkSystem.createLandmark('player1', 'Landmark', 'building');
      const upgraded = LandmarkSystem.upgradeLandmark(landmark);
      expect(upgraded.level).toBe(2);
      expect(upgraded.attractiveness).toBeGreaterThan(landmark.attractiveness);
      expect(upgraded.dailyVisitors).toBeGreaterThan(landmark.dailyVisitors);
    });

    it('should calculate daily revenue', () => {
      const landmark = LandmarkSystem.createLandmark('player1', 'Landmark', 'park');
      const revenue = LandmarkSystem.calculateDailyRevenue(landmark);
      expect(revenue).toBeGreaterThan(0);
    });
  });

  describe('Ad Space System', () => {
    it('should create ad space', () => {
      const adSpace = AdSpaceSystem.createAdSpace('player1', 'Downtown');
      expect(adSpace.ownerId).toBe('player1');
      expect(adSpace.location).toBe('Downtown');
      expect(adSpace.level).toBe(1);
      expect(adSpace.activeAds.length).toBe(0);
    });

    it('should upgrade ad space', () => {
      const adSpace = AdSpaceSystem.createAdSpace('player1', 'Location');
      const upgraded = AdSpaceSystem.upgradeAdSpace(adSpace);
      expect(upgraded.level).toBe(2);
      expect(upgraded.visibility).toBeGreaterThan(adSpace.visibility);
    });

    it('should add advertisement', () => {
      const adSpace = AdSpaceSystem.createAdSpace('player1', 'Location');
      const ad = {
        id: 'ad_1',
        advertiserName: 'Company A',
        content: 'Buy our product',
        startDate: Date.now(),
        endDate: Date.now() + 86400000,
        dailyRate: 100,
      };
      const updated = AdSpaceSystem.addAdvertisement(adSpace, ad);
      expect(updated.activeAds.length).toBe(1);
      expect(updated.totalAds).toBe(1);
    });

    it('should calculate daily revenue', () => {
      const adSpace = AdSpaceSystem.createAdSpace('player1', 'Location');
      const ad = {
        id: 'ad_1',
        advertiserName: 'Company',
        content: 'Ad content',
        startDate: Date.now(),
        endDate: Date.now() + 86400000,
        dailyRate: 100,
      };
      const updated = AdSpaceSystem.addAdvertisement(adSpace, ad);
      const revenue = AdSpaceSystem.calculateDailyRevenue(updated);
      expect(revenue).toBeGreaterThan(0);
    });
  });

  describe('Garden System', () => {
    it('should create a garden', () => {
      const garden = GardenSystem.createGarden('player1', 'Flower Garden');
      expect(garden.ownerId).toBe('player1');
      expect(garden.name).toBe('Flower Garden');
      expect(garden.level).toBe(1);
      expect(garden.plantCount).toBe(50);
      expect(garden.plants.length).toBeGreaterThan(0);
    });

    it('should upgrade garden', () => {
      const garden = GardenSystem.createGarden('player1', 'Garden');
      const upgraded = GardenSystem.upgradeGarden(garden);
      expect(upgraded.level).toBe(2);
      expect(upgraded.plantCount).toBeGreaterThan(garden.plantCount);
    });

    it('should calculate daily revenue', () => {
      const garden = GardenSystem.createGarden('player1', 'Garden');
      const revenue = GardenSystem.calculateDailyRevenue(garden);
      expect(revenue).toBeGreaterThan(0);
    });
  });

  describe('Flower Shop System', () => {
    it('should create a flower shop', () => {
      const shop = FlowerShopSystem.createFlowerShop('player1', 'Rose Garden Shop');
      expect(shop.ownerId).toBe('player1');
      expect(shop.name).toBe('Rose Garden Shop');
      expect(shop.level).toBe(1);
      expect(shop.flowerTypes).toBe(5);
      expect(shop.inventory.length).toBeGreaterThan(0);
    });

    it('should upgrade flower shop', () => {
      const shop = FlowerShopSystem.createFlowerShop('player1', 'Shop');
      const upgraded = FlowerShopSystem.upgradeFlowerShop(shop);
      expect(upgraded.level).toBe(2);
      expect(upgraded.flowerTypes).toBeGreaterThan(shop.flowerTypes);
    });

    it('should calculate daily revenue', () => {
      const shop = FlowerShopSystem.createFlowerShop('player1', 'Shop');
      const revenue = FlowerShopSystem.calculateDailyRevenue(shop);
      expect(revenue).toBeGreaterThan(0);
    });
  });

  describe('Cross-System Tests', () => {
    it('should handle multiple facilities for same player', () => {
      const restaurant = RestaurantSystem.createRestaurant('player1', 'Restaurant');
      const cafe = CafeSystem.createCafe('player1', 'Cafe');
      const library = LibrarySystem.createLibrary('player1', 'Library');

      expect(restaurant.ownerId).toBe('player1');
      expect(cafe.ownerId).toBe('player1');
      expect(library.ownerId).toBe('player1');
    });

    it('should calculate combined revenue', () => {
      const restaurant = RestaurantSystem.createRestaurant('player1', 'Restaurant');
      const cafe = CafeSystem.createCafe('player1', 'Cafe');

      const restRevenue = RestaurantSystem.calculateDailyRevenue(restaurant);
      const cafeRevenue = CafeSystem.calculateDailyRevenue(cafe);
      const totalRevenue = restRevenue + cafeRevenue;

      expect(totalRevenue).toBeGreaterThan(0);
      expect(totalRevenue).toBe(restRevenue + cafeRevenue);
    });

    it('should support facility upgrades', () => {
      const facilities = [
        RestaurantSystem.createRestaurant('player1', 'R'),
        CafeSystem.createCafe('player1', 'C'),
        LibrarySystem.createLibrary('player1', 'L'),
        LandmarkSystem.createLandmark('player1', 'L', 'park'),
        AdSpaceSystem.createAdSpace('player1', 'Loc'),
        GardenSystem.createGarden('player1', 'G'),
        FlowerShopSystem.createFlowerShop('player1', 'S'),
      ];

      facilities.forEach((facility) => {
        expect(facility.level).toBe(1);
      });
    });
  });
});
