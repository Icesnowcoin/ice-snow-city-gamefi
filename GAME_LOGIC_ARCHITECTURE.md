# Game Logic Architecture - Ice Snow City

## Overview

This document describes the complete game logic architecture for Ice Snow City, based on proven patterns from the Farmhand project and Redux state management principles.

## Architecture Layers

### 1. Type Layer (`server/game-logic/types.ts`)

Defines all TypeScript interfaces and types for the game:

- **GameState** - Central game state object containing all game data
- **GameAction** - Union type of all possible game actions
- **Player Types** - PlayerProfile, PlayerAssets, PlayerProgress
- **NPC Types** - NPCProfile, NPCRelationship, NPCInteraction
- **Economy Types** - Wallet, Transaction, BankAccount, MarketPrice
- **Property Types** - Property, PropertyRental
- **Farm Types** - Farm, Crop, HarvestResult
- **Task Types** - Task, TaskReward
- **Shop Types** - ShopItem, PlayerInventory, InventoryItem
- **Game Meta Types** - GameTime, ServiceResult, GameActionResult

### 2. Reducer Layer (`server/game-logic/reducer.ts`)

Implements the Redux-style reducer pattern for state management:

**Key Functions:**
- `createInitialGameState(playerId, playerName)` - Initialize new player state
- `gameReducer(state, action)` - Pure function that handles all state mutations

**Supported Actions:**
- Player actions (gain experience, level up, update profile)
- Asset actions (add/remove money, ISC, energy, food, population)
- NPC actions (interact, update relationship, gift, date)
- Economy actions (wallet deposit/withdraw, bank operations, interest)
- Property actions (purchase, sell, rent, collect rent)
- Farm actions (create, plant, harvest, water, fertilize)
- Task actions (accept, complete, fail, abandon)
- Shop actions (purchase, add/remove inventory)
- Game meta actions (advance time, save, load)

**Design Principles:**
- Pure functions - no side effects
- Immutable updates - never mutate state directly
- Type-safe - full TypeScript support
- Predictable - same input always produces same output
- Testable - easy to unit test

### 3. Service Layer (`server/game-logic/services.ts`)

Business logic layer with 8 specialized service classes:

#### PlayerService
- `gainExperience(state, amount)` - Add experience
- `levelUp(state, newLevel)` - Level up player
- `updateProfile(state, updates)` - Update player profile
- `getPlayerStats(state)` - Get player statistics

#### NPCService
- `interactWithNPC(state, npcId, type)` - Interact with NPC
- `updateRelationship(state, npcId, change)` - Update favorability
- `giftNPC(state, npcId, itemId)` - Give gift to NPC
- `dateNPC(state, npcId, location)` - Go on date with NPC
- `getNPCRelationship(state, npcId)` - Get relationship info
- `calculateFavorabilityBonus(state, npcId)` - Calculate bonus multiplier

#### EconomyService
- `deposit(state, amount, currency)` - Deposit to wallet
- `withdraw(state, amount, currency)` - Withdraw from wallet
- `transfer(state, toPlayerId, amount, currency)` - Transfer money
- `bankDeposit(state, amount)` - Deposit to bank
- `bankWithdraw(state, amount)` - Withdraw from bank
- `claimInterest(state)` - Claim daily interest
- `getWalletBalance(state)` - Get balance info
- `getTransactionHistory(state, limit)` - Get transaction history

#### TaskService
- `acceptTask(state, taskId)` - Accept a task
- `completeTask(state, taskId, reward)` - Complete task
- `failTask(state, taskId)` - Fail task
- `abandonTask(state, taskId)` - Abandon task
- `getActiveTasks(state)` - Get in-progress tasks
- `getAvailableTasks(state)` - Get available tasks
- `getCompletedTasks(state)` - Get completed tasks
- `calculateTaskReward(task, favorability)` - Calculate rewards

#### PropertyService
- `purchaseProperty(state, propertyId, price)` - Buy property
- `sellProperty(state, propertyId, price)` - Sell property
- `rentProperty(state, propertyId, renterId, rent)` - Rent property
- `collectRent(state, propertyId, amount)` - Collect rent payment
- `getPlayerProperties(state)` - Get owned properties
- `getMonthlyRentalIncome(state)` - Calculate rental income
- `calculatePropertyValue(property)` - Calculate property value

#### FarmService
- `createFarm(state, farm)` - Create new farm
- `harvestCrop(state, farmId, cropId, yield)` - Harvest crop
- `getPlayerFarms(state)` - Get owned farms
- `getTotalFarmProduction(state)` - Get total harvest profit
- `calculateCropYield(crop)` - Calculate crop yield
- `getCropGrowthProgress(crop)` - Get growth percentage

#### ShopService
- `purchaseItem(state, itemId, quantity, cost)` - Buy item
- `addToInventory(state, itemId, quantity)` - Add to inventory
- `removeFromInventory(state, itemId, quantity)` - Remove from inventory
- `getInventorySpace(state)` - Get available space
- `isInventoryFull(state)` - Check if full
- `canPurchaseItem(state, itemId, quantity, cost)` - Validate purchase

#### GameTimeService
- `advanceTime(state, minutes)` - Advance game time
- `getGameTimeString(state)` - Get formatted time string
- `isNight(state)` - Check if nighttime
- `isDaytime(state)` - Check if daytime
- `getTimeOfDay(state)` - Get time period (morning/afternoon/evening/night)

### 4. React Hook Layer (`client/src/hooks/useGameEngine.ts`)

Custom React hook for integrating game logic with UI:

```typescript
const {
  state,           // Current game state
  dispatch,        // Dispatch actions
  gainExperience,  // Helper functions
  addMoney,
  removeMoney,
  interactWithNPC,
  updateNPCRelationship,
  depositMoney,
  withdrawMoney,
  acceptTask,
  completeTask,
  advanceTime,
} = useGameEngine({
  playerId: 'player-1',
  playerName: 'Test Player',
  onStateChange: (state) => {
    // Handle state changes (e.g., save to server)
  }
});
```

## State Flow

```
User Action (UI)
    ↓
useGameEngine Hook
    ↓
Dispatch GameAction
    ↓
gameReducer (pure function)
    ↓
New GameState
    ↓
React Re-render
    ↓
onStateChange Callback (save to server)
```

## Example: Complete Task Flow

```typescript
// 1. User clicks "Complete Task" button
const handleCompleteTask = async (taskId: string) => {
  // 2. Calculate reward using TaskService
  const task = state.tasks.find(t => t.id === taskId);
  const reward = TaskService.calculateTaskReward(task, 50);

  // 3. Dispatch action to update local state
  completeTask(taskId, reward);

  // 4. Save to server via tRPC
  await trpc.game.completeTask.mutate({
    taskId,
    reward,
  });
};
```

## Testing Strategy

### Unit Tests (72 tests total)

**reducer.test.ts (32 tests)**
- Player actions (3 tests)
- Asset actions (7 tests)
- NPC actions (4 tests)
- Economy actions (6 tests)
- Property actions (1 test)
- Farm actions (2 tests)
- Task actions (2 tests)
- Game time actions (4 tests)
- Game save/load (2 tests)
- Edge cases (1 test)

**services.test.ts (40 tests)**
- PlayerService (2 tests)
- NPCService (5 tests)
- EconomyService (7 tests)
- TaskService (4 tests)
- PropertyService (4 tests)
- FarmService (4 tests)
- ShopService (6 tests)
- GameTimeService (8 tests)

### Running Tests

```bash
# Run all game logic tests
pnpm test server/game-logic

# Run specific test file
pnpm test server/game-logic/reducer.test.ts

# Run with coverage
pnpm test server/game-logic -- --coverage
```

## Integration with tRPC

The game logic will be integrated with tRPC procedures:

```typescript
// server/routers/gameCore.ts
export const gameRouter = router({
  // Player actions
  gainExperience: protectedProcedure
    .input(z.object({ amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const action = PlayerService.gainExperience(ctx.gameState, input.amount);
      const newState = gameReducer(ctx.gameState, action);
      await saveGameState(newState);
      return newState;
    }),

  // NPC interactions
  interactWithNPC: protectedProcedure
    .input(z.object({ npcId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action = NPCService.interactWithNPC(ctx.gameState, input.npcId, 'greet');
      const newState = gameReducer(ctx.gameState, action);
      await saveGameState(newState);
      return newState;
    }),

  // ... more procedures
});
```

## Key Design Decisions

### 1. Centralized State
- All game data in single `GameState` object
- Easier to serialize/deserialize for persistence
- Simpler to debug and reason about

### 2. Pure Reducer
- No side effects in reducer
- Deterministic state transitions
- Easy to test and replay actions

### 3. Service Layer
- Business logic separated from state management
- Reusable across different contexts
- Easy to unit test independently

### 4. Type Safety
- Full TypeScript coverage
- Compile-time error checking
- Better IDE support and autocomplete

### 5. Immutable Updates
- Prevents accidental mutations
- Enables efficient React re-renders
- Easier to implement undo/redo

## Performance Considerations

### State Size
- Current GameState is ~5-10KB for typical player
- Efficient for network transmission
- Can be compressed for storage

### Update Frequency
- Most actions are instant (< 1ms)
- Game time advances in batches (e.g., every 60 seconds)
- Saves to server debounced (every 30 seconds)

### Optimization Strategies
- Memoize selectors to prevent unnecessary re-renders
- Use React.memo for expensive components
- Batch multiple actions into single update
- Implement proper cleanup in useEffect

## Future Enhancements

1. **Undo/Redo System**
   - Store action history
   - Replay actions to recompute state

2. **Multiplayer Sync**
   - Send action deltas to other players
   - Merge concurrent actions

3. **Persistent Storage**
   - Save game state to IndexedDB (offline)
   - Sync with server on reconnect

4. **Analytics**
   - Track all actions for analytics
   - Generate player behavior reports

5. **Modding System**
   - Allow custom actions and services
   - Plugin architecture for extensions

## Troubleshooting

### State Not Updating
- Check that action is dispatched correctly
- Verify reducer handles the action type
- Check for mutation bugs (should be immutable)

### Performance Issues
- Profile with React DevTools Profiler
- Check for unnecessary re-renders
- Memoize expensive selectors

### Type Errors
- Ensure GameAction type is correct
- Check payload matches action type
- Use TypeScript strict mode

## References

- [Farmhand Project](https://github.com/jeremyckahn/farmhand) - Inspiration
- [Redux Documentation](https://redux.js.org/) - State management pattern
- [React Hooks API](https://react.dev/reference/react) - Hook implementation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type safety
