/**
 * Character Customization System Types
 * Defines all character creation and customization data structures
 */

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum SkinTone {
  FAIR = 'fair',           // 白皙
  LIGHT = 'light',         // 浅色
  MEDIUM = 'medium',       // 中等
  OLIVE = 'olive',         // 橄榄色
  DEEP = 'deep',           // 深色
  DARK = 'dark',           // 很深
}

export enum FaceShape {
  OVAL = 'oval',           // 椭圆形
  ROUND = 'round',         // 圆形
  SQUARE = 'square',       // 方形
  HEART = 'heart',         // 心形
  LONG = 'long',           // 长形
}

export enum EyeShape {
  ROUND = 'round',         // 圆形
  ALMOND = 'almond',       // 杏仁形
  UPTURNED = 'upturned',   // 上扬
  DOWNTURNED = 'downturned', // 下垂
  MONOLID = 'monolid',     // 单眼皮
}

export enum EyeColor {
  BROWN = 'brown',
  BLUE = 'blue',
  GREEN = 'green',
  HAZEL = 'hazel',
  GRAY = 'gray',
  AMBER = 'amber',
}

export enum HairStyle {
  SHORT = 'short',         // 短发
  MEDIUM = 'medium',       // 中长发
  LONG = 'long',           // 长发
  WAVY = 'wavy',           // 波浪卷
  CURLY = 'curly',         // 卷发
  STRAIGHT = 'straight',   // 直发
  BOB = 'bob',             // 齐肩发
  PIXIE = 'pixie',         // 超短发
}

export enum HairColor {
  BLACK = 'black',
  BROWN = 'brown',
  BLONDE = 'blonde',
  RED = 'red',
  AUBURN = 'auburn',
  SILVER = 'silver',
  BLUE = 'blue',
  PURPLE = 'purple',
}

export enum BodyType {
  SLIM = 'slim',           // 纤细
  ATHLETIC = 'athletic',   // 运动型
  CURVY = 'curvy',         // 丰满
  MUSCULAR = 'muscular',   // 肌肉型
  AVERAGE = 'average',     // 普通
}

export enum Height {
  SHORT = 'short',         // 矮个子
  AVERAGE = 'average',     // 平均身高
  TALL = 'tall',           // 高个子
}

export enum ClothingStyle {
  CASUAL = 'casual',       // 休闲
  FORMAL = 'formal',       // 正式
  SPORTY = 'sporty',       // 运动
  ELEGANT = 'elegant',     // 优雅
  BUSINESS = 'business',   // 商务
  BOHEMIAN = 'bohemian',   // 波西米亚
  PUNK = 'punk',           // 朋克
  VINTAGE = 'vintage',     // 复古
}

export enum ShoeType {
  SNEAKERS = 'sneakers',
  HEELS = 'heels',
  BOOTS = 'boots',
  FLATS = 'flats',
  LOAFERS = 'loafers',
  SANDALS = 'sandals',
  DRESS_SHOES = 'dress_shoes',
}

export enum AccessoryType {
  NONE = 'none',
  NECKLACE = 'necklace',
  EARRINGS = 'earrings',
  BRACELET = 'bracelet',
  RING = 'ring',
  WATCH = 'watch',
  HAT = 'hat',
  GLASSES = 'glasses',
}

export interface CharacterCustomization {
  // Basic Info
  gender: Gender;
  name: string;

  // Facial Features
  faceShape: FaceShape;
  eyeShape: EyeShape;
  eyeColor: EyeColor;
  noseSize: number;        // 0-100
  mouthSize: number;       // 0-100
  skinTone: SkinTone;

  // Hair
  hairStyle: HairStyle;
  hairColor: HairColor;

  // Body
  bodyType: BodyType;
  height: Height;

  // Clothing
  clothingStyle: ClothingStyle;
  clothingColor: string;   // Hex color

  // Accessories
  shoes: ShoeType;
  shoeColor: string;       // Hex color
  accessories: AccessoryType[];
  accessoryColor: string;  // Hex color

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerCharacter {
  id: string;
  userId: string;
  customization: CharacterCustomization;
  level: number;
  experience: number;
  position: {
    x: number;
    y: number;
    scene: string;
  };
  appearance: {
    modelUrl: string;      // 3D model URL
    thumbnailUrl: string;  // Character thumbnail
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterPreset {
  id: string;
  name: string;
  description: string;
  customization: Partial<CharacterCustomization>;
  gender: Gender;
  thumbnail: string;
}

// Default character presets based on NPC styles
export const CHARACTER_PRESETS: Record<string, CharacterPreset> = {
  aurora_style: {
    id: 'aurora_style',
    name: 'Aurora Style',
    description: '优雅的冰系魔法师风格 - 蓝紫色系、长发、魔法服饰',
    gender: Gender.FEMALE,
    thumbnail: '❄️',
    customization: {
      faceShape: FaceShape.OVAL,
      eyeShape: EyeShape.UPTURNED,
      eyeColor: EyeColor.BLUE,
      skinTone: SkinTone.FAIR,
      hairStyle: HairStyle.LONG,
      hairColor: HairColor.SILVER,
      bodyType: BodyType.SLIM,
      height: Height.AVERAGE,
      clothingStyle: ClothingStyle.ELEGANT,
      clothingColor: '#6366f1',
      shoes: ShoeType.HEELS,
      shoeColor: '#4f46e5',
      accessories: [AccessoryType.NECKLACE, AccessoryType.EARRINGS],
    },
  },
  marcus_style: {
    id: 'marcus_style',
    name: 'Marcus Style',
    description: '商务风格 - 棕色系、短发、西装',
    gender: Gender.MALE,
    thumbnail: '💼',
    customization: {
      faceShape: FaceShape.SQUARE,
      eyeShape: EyeShape.ALMOND,
      eyeColor: EyeColor.BROWN,
      skinTone: SkinTone.MEDIUM,
      hairStyle: HairStyle.SHORT,
      hairColor: HairColor.BROWN,
      bodyType: BodyType.ATHLETIC,
      height: Height.TALL,
      clothingStyle: ClothingStyle.BUSINESS,
      clothingColor: '#1e40af',
      shoes: ShoeType.DRESS_SHOES,
      shoeColor: '#1e1b4b',
      accessories: [AccessoryType.WATCH, AccessoryType.RING],
    },
  },
  casual_female: {
    id: 'casual_female',
    name: 'Casual Girl',
    description: '休闲女性风格 - 日常穿搭',
    gender: Gender.FEMALE,
    thumbnail: '👧',
    customization: {
      faceShape: FaceShape.ROUND,
      eyeShape: EyeShape.ROUND,
      eyeColor: EyeColor.BROWN,
      skinTone: SkinTone.LIGHT,
      hairStyle: HairStyle.MEDIUM,
      hairColor: HairColor.BROWN,
      bodyType: BodyType.AVERAGE,
      height: Height.AVERAGE,
      clothingStyle: ClothingStyle.CASUAL,
      clothingColor: '#f97316',
      shoes: ShoeType.SNEAKERS,
      shoeColor: '#ffffff',
      accessories: [AccessoryType.EARRINGS],
    },
  },
  casual_male: {
    id: 'casual_male',
    name: 'Casual Guy',
    description: '休闲男性风格 - 日常穿搭',
    gender: Gender.MALE,
    thumbnail: '👦',
    customization: {
      faceShape: FaceShape.SQUARE,
      eyeShape: EyeShape.ALMOND,
      eyeColor: EyeColor.GREEN,
      skinTone: SkinTone.MEDIUM,
      hairStyle: HairStyle.SHORT,
      hairColor: HairColor.BLACK,
      bodyType: BodyType.ATHLETIC,
      height: Height.TALL,
      clothingStyle: ClothingStyle.CASUAL,
      clothingColor: '#3b82f6',
      shoes: ShoeType.SNEAKERS,
      shoeColor: '#000000',
      accessories: [AccessoryType.WATCH],
    },
  },
};

// Character customization options
export const CUSTOMIZATION_OPTIONS = {
  genders: Object.values(Gender),
  skinTones: Object.values(SkinTone),
  faceShapes: Object.values(FaceShape),
  eyeShapes: Object.values(EyeShape),
  eyeColors: Object.values(EyeColor),
  hairStyles: Object.values(HairStyle),
  hairColors: Object.values(HairColor),
  bodyTypes: Object.values(BodyType),
  heights: Object.values(Height),
  clothingStyles: Object.values(ClothingStyle),
  shoeTypes: Object.values(ShoeType),
  accessories: Object.values(AccessoryType),
};

// Labels for UI display
export const CUSTOMIZATION_LABELS: Record<string, Record<string, string>> = {
  skinTone: {
    [SkinTone.FAIR]: '白皙',
    [SkinTone.LIGHT]: '浅色',
    [SkinTone.MEDIUM]: '中等',
    [SkinTone.OLIVE]: '橄榄色',
    [SkinTone.DEEP]: '深色',
    [SkinTone.DARK]: '很深',
  },
  faceShape: {
    [FaceShape.OVAL]: '椭圆形',
    [FaceShape.ROUND]: '圆形',
    [FaceShape.SQUARE]: '方形',
    [FaceShape.HEART]: '心形',
    [FaceShape.LONG]: '长形',
  },
  eyeShape: {
    [EyeShape.ROUND]: '圆形',
    [EyeShape.ALMOND]: '杏仁形',
    [EyeShape.UPTURNED]: '上扬',
    [EyeShape.DOWNTURNED]: '下垂',
    [EyeShape.MONOLID]: '单眼皮',
  },
  eyeColor: {
    [EyeColor.BROWN]: '棕色',
    [EyeColor.BLUE]: '蓝色',
    [EyeColor.GREEN]: '绿色',
    [EyeColor.HAZEL]: '浅褐色',
    [EyeColor.GRAY]: '灰色',
    [EyeColor.AMBER]: '琥珀色',
  },
  hairStyle: {
    [HairStyle.SHORT]: '短发',
    [HairStyle.MEDIUM]: '中长发',
    [HairStyle.LONG]: '长发',
    [HairStyle.WAVY]: '波浪卷',
    [HairStyle.CURLY]: '卷发',
    [HairStyle.STRAIGHT]: '直发',
    [HairStyle.BOB]: '齐肩发',
    [HairStyle.PIXIE]: '超短发',
  },
  hairColor: {
    [HairColor.BLACK]: '黑色',
    [HairColor.BROWN]: '棕色',
    [HairColor.BLONDE]: '金色',
    [HairColor.RED]: '红色',
    [HairColor.AUBURN]: '栗色',
    [HairColor.SILVER]: '银色',
    [HairColor.BLUE]: '蓝色',
    [HairColor.PURPLE]: '紫色',
  },
  bodyType: {
    [BodyType.SLIM]: '纤细',
    [BodyType.ATHLETIC]: '运动型',
    [BodyType.CURVY]: '丰满',
    [BodyType.MUSCULAR]: '肌肉型',
    [BodyType.AVERAGE]: '普通',
  },
  height: {
    [Height.SHORT]: '矮个子',
    [Height.AVERAGE]: '平均身高',
    [Height.TALL]: '高个子',
  },
  clothingStyle: {
    [ClothingStyle.CASUAL]: '休闲',
    [ClothingStyle.FORMAL]: '正式',
    [ClothingStyle.SPORTY]: '运动',
    [ClothingStyle.ELEGANT]: '优雅',
    [ClothingStyle.BUSINESS]: '商务',
    [ClothingStyle.BOHEMIAN]: '波西米亚',
    [ClothingStyle.PUNK]: '朋克',
    [ClothingStyle.VINTAGE]: '复古',
  },
  shoeType: {
    [ShoeType.SNEAKERS]: '运动鞋',
    [ShoeType.HEELS]: '高跟鞋',
    [ShoeType.BOOTS]: '靴子',
    [ShoeType.FLATS]: '平底鞋',
    [ShoeType.LOAFERS]: '乐福鞋',
    [ShoeType.SANDALS]: '凉鞋',
    [ShoeType.DRESS_SHOES]: '正装鞋',
  },
  accessoryType: {
    [AccessoryType.NONE]: '无',
    [AccessoryType.NECKLACE]: '项链',
    [AccessoryType.EARRINGS]: '耳环',
    [AccessoryType.BRACELET]: '手镯',
    [AccessoryType.RING]: '戒指',
    [AccessoryType.WATCH]: '手表',
    [AccessoryType.HAT]: '帽子',
    [AccessoryType.GLASSES]: '眼镜',
  },
};
