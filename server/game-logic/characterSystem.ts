/**
 * Character Customization System
 * Handles character creation, customization, and appearance management
 */

import { getDb } from '../db';

import { playerCharacters, characterPresets, characterPositions } from '../../drizzle/schema';

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db;
};
import { eq, and } from 'drizzle-orm';
import {
  CharacterCustomization,
  PlayerCharacter,
  Gender,
  BodyType,
  Height,
  ClothingStyle,
  ShoeType,
  SkinTone,
  HairStyle,
  HairColor,
  FaceShape,
  EyeShape,
  EyeColor,
  CHARACTER_PRESETS,
} from '@shared/types/character';

/**
 * Create a new player character with customization
 */
export async function createPlayerCharacter(
  userId: number,
  customization: CharacterCustomization
): Promise<PlayerCharacter> {
  const database = await getDatabase();
  const now = new Date();

  const character = await database.insert(playerCharacters).values({
    userId,
    name: customization.name,
    gender: customization.gender,
    faceShape: customization.faceShape,
    eyeShape: customization.eyeShape,
    eyeColor: customization.eyeColor,
    noseSize: customization.noseSize,
    mouthSize: customization.mouthSize,
    skinTone: customization.skinTone,
    hairStyle: customization.hairStyle,
    hairColor: customization.hairColor,
    bodyType: customization.bodyType,
    height: customization.height,
    clothingStyle: customization.clothingStyle,
    clothingColor: customization.clothingColor,
    shoes: customization.shoes,
    shoeColor: customization.shoeColor,
    accessories: JSON.stringify(customization.accessories),
    accessoryColor: customization.accessoryColor,
    positionX: '0',
    positionY: '0',
    currentScene: 'home',
    createdAt: now,
    updatedAt: now,
  });

  // Initialize character position
  await database.insert(characterPositions).values({
    userId,
    scene: 'home',
    positionX: '0',
    positionY: '0',
    direction: 'down',
    isMoving: 'no',
    lastUpdated: now,
    createdAt: now,
  });

  return getPlayerCharacter(userId);
}

/**
 * Get player character data
 */
export async function getPlayerCharacter(userId: number): Promise<PlayerCharacter> {
  const database = await getDatabase();
  const characters = await database
    .select()
    .from(playerCharacters)
    .where(eq(playerCharacters.userId, userId))
    .limit(1);
  const character = characters[0];

  if (!character) {
    throw new Error(`Character not found for user ${userId}`);
  }

  return {
    id: character.id.toString(),
    userId: character.userId.toString(),
    customization: {
      gender: character.gender as Gender,
      name: character.name,
      faceShape: character.faceShape as any,
      eyeShape: character.eyeShape as any,
      eyeColor: character.eyeColor as any,
      noseSize: character.noseSize,
      mouthSize: character.mouthSize,
      skinTone: character.skinTone as any,
      hairStyle: character.hairStyle as any,
      hairColor: character.hairColor as any,
      bodyType: character.bodyType as any,
      height: character.height as any,
      clothingStyle: character.clothingStyle as any,
      clothingColor: character.clothingColor,
      shoes: character.shoes as any,
      shoeColor: character.shoeColor,
      accessories: JSON.parse(character.accessories),
      accessoryColor: character.accessoryColor,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    },
    level: 1,
    experience: 0,
    position: {
      x: typeof character.positionX === 'string' ? parseFloat(character.positionX) : character.positionX,
      y: typeof character.positionY === 'string' ? parseFloat(character.positionY) : character.positionY,
      scene: character.currentScene,
    },
    appearance: {
      modelUrl: character.modelUrl || '',
      thumbnailUrl: character.thumbnailUrl || '',
    },
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  } as PlayerCharacter;
}

/**
 * Update player character customization
 */
export async function updatePlayerCharacter(
  userId: number,
  customization: Partial<CharacterCustomization>
): Promise<PlayerCharacter> {
  const database = await getDatabase();
  const updates: any = {};

  if (customization.name) updates.name = customization.name;
  if (customization.gender) updates.gender = customization.gender;
  if (customization.faceShape) updates.faceShape = customization.faceShape;
  if (customization.eyeShape) updates.eyeShape = customization.eyeShape;
  if (customization.eyeColor) updates.eyeColor = customization.eyeColor;
  if (customization.noseSize !== undefined) updates.noseSize = customization.noseSize;
  if (customization.mouthSize !== undefined) updates.mouthSize = customization.mouthSize;
  if (customization.skinTone) updates.skinTone = customization.skinTone;
  if (customization.hairStyle) updates.hairStyle = customization.hairStyle;
  if (customization.hairColor) updates.hairColor = customization.hairColor;
  if (customization.bodyType) updates.bodyType = customization.bodyType;
  if (customization.height) updates.height = customization.height;
  if (customization.clothingStyle) updates.clothingStyle = customization.clothingStyle;
  if (customization.clothingColor) updates.clothingColor = customization.clothingColor;
  if (customization.shoes) updates.shoes = customization.shoes;
  if (customization.shoeColor) updates.shoeColor = customization.shoeColor;
  if (customization.accessories) updates.accessories = JSON.stringify(customization.accessories);
  if (customization.accessoryColor) updates.accessoryColor = customization.accessoryColor;

  updates.updatedAt = new Date();

  await database
    .update(playerCharacters)
    .set(updates)
    .where(eq(playerCharacters.userId, userId));

  return getPlayerCharacter(userId);
}

/**
 * Update character position
 */
export async function updateCharacterPosition(
  userId: number,
  scene: string,
  x: number,
  y: number,
  direction: string = 'down'
): Promise<void> {
  const database = await getDatabase();
  // Update player character position
  await database
    .update(playerCharacters)
    .set({
      currentScene: scene,
      positionX: x.toString(),
      positionY: y.toString(),
      updatedAt: new Date(),
    })
    .where(eq(playerCharacters.userId, userId));

  // Update character position tracking
  const existingPosition = await database
    .select()
    .from(characterPositions)
    .where(eq(characterPositions.userId, userId))
    .limit(1)
    .then((results) => results[0]);

  if (existingPosition) {
    await database
      .update(characterPositions)
      .set({
        scene,
        positionX: x.toString(),
        positionY: y.toString(),
        direction,
        lastUpdated: new Date(),
      })
      .where(eq(characterPositions.userId, userId));
  } else {
    await database.insert(characterPositions).values({
      userId,
      scene,
      positionX: x.toString(),
      positionY: y.toString(),
      direction,
      isMoving: 'no',
      lastUpdated: new Date(),
      createdAt: new Date(),
    });
  }
}

/**
 * Save character preset
 */
export async function saveCharacterPreset(
  userId: number,
  name: string,
  description: string,
  customization: CharacterCustomization,
  isPublic: boolean = false
): Promise<any> {
  const database = await getDatabase();
  const preset = await database.insert(characterPresets).values({
    userId,
    name,
    description,
    customizationData: JSON.stringify(customization),
    isPublic: isPublic ? 'yes' : 'no',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return preset;
}

/**
 * Get character presets
 */
export async function getCharacterPresets(userId: number): Promise<any[]> {
  const database = await getDatabase();
  const presets = await database
    .select()
    .from(characterPresets)
    .where(eq(characterPresets.userId, userId));

  return presets.map((preset: any) => ({
    id: preset.id,
    name: preset.name,
    description: preset.description,
    customization: JSON.parse(preset.customizationData),
    thumbnailUrl: preset.thumbnailUrl,
    isPublic: preset.isPublic === 'yes',
    createdAt: preset.createdAt,
  }));
}

/**
 * Load character from preset
 */
export async function loadCharacterFromPreset(
  userId: number,
  presetId: number
): Promise<PlayerCharacter> {
  const database = await getDatabase();
  const presets = await database
    .select()
    .from(characterPresets)
    .where(
      and(
        eq(characterPresets.id, presetId),
        eq(characterPresets.userId, userId)
      )
    )
    .limit(1);
  const preset = presets[0];

  if (!preset) {
    throw new Error(`Preset ${presetId} not found for user ${userId}`);
  }

  const customization = JSON.parse(preset.customizationData);
  return updatePlayerCharacter(userId, customization);
}

/**
 * Get character appearance data for rendering
 */
export async function getCharacterAppearanceData(userId: number): Promise<any> {
  const character = await getPlayerCharacter(userId);
  const customization = character.customization;

  return {
    gender: customization.gender,
    faceShape: customization.faceShape,
    eyeShape: customization.eyeShape,
    eyeColor: customization.eyeColor,
    noseSize: customization.noseSize,
    mouthSize: customization.mouthSize,
    skinTone: customization.skinTone,
    hairStyle: customization.hairStyle,
    hairColor: customization.hairColor,
    bodyType: customization.bodyType,
    height: customization.height,
    clothingStyle: customization.clothingStyle,
    clothingColor: customization.clothingColor,
    shoes: customization.shoes,
    shoeColor: customization.shoeColor,
    accessories: customization.accessories,
    accessoryColor: customization.accessoryColor,
    position: character.position,
  };
}

/**
 * Check if character exists
 */
export async function playerHasCharacter(userId: number): Promise<boolean> {
  const database = await getDatabase();
  const characters = await database
    .select()
    .from(playerCharacters)
    .where(eq(playerCharacters.userId, userId))
    .limit(1);
  const character = characters[0];

  return !!character;
}

/**
 * Get default character customization based on preset
 */
export function getDefaultCharacterCustomization(
  name: string,
  gender: Gender,
  presetId?: string
): CharacterCustomization {
  const preset = presetId ? CHARACTER_PRESETS[presetId] : null;

  if (preset && preset.gender === gender) {
    return {
      name,
      gender,
      ...preset.customization,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CharacterCustomization;
  }

  // Default customization
  return {
    name,
    gender,
    faceShape: FaceShape.OVAL,
    eyeShape: EyeShape.ROUND,
    eyeColor: EyeColor.BROWN,
    noseSize: 50,
    mouthSize: 50,
    skinTone: SkinTone.MEDIUM,
    hairStyle: HairStyle.MEDIUM,
    hairColor: gender === Gender.FEMALE ? HairColor.BROWN : HairColor.BLACK,
    bodyType: BodyType.AVERAGE,
    height: Height.AVERAGE,
    clothingStyle: ClothingStyle.CASUAL,
    clothingColor: '#3b82f6',
    shoes: ShoeType.SNEAKERS,
    shoeColor: '#ffffff',
    accessories: [],
    accessoryColor: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
