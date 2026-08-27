/**
 * Poster Templates and Presets
 * Provides predefined templates and styles for poster customization
 */

export interface PosterTemplate {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  presets: TextPreset[];
  category: 'transaction' | 'achievement' | 'event' | 'social';
}

export interface TextPreset {
  id: string;
  text: string;
  textZh: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  x: number;
  y: number;
  description: string;
}

// Transaction Templates
const transactionTemplates: PosterTemplate[] = [
  {
    id: 'transaction-minimal',
    name: 'Minimal Transaction',
    nameZh: '极简交易',
    description: 'Clean and minimal transaction poster',
    descriptionZh: '简洁的交易海报',
    category: 'transaction',
    presets: [
      {
        id: 'title',
        text: 'Transaction Successful',
        textZh: '交易成功',
        fontSize: 48,
        fontFamily: 'Microsoft YaHei',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 150,
        description: 'Main title',
      },
      {
        id: 'amount',
        text: 'Amount: 1000 ISC',
        textZh: '金额：1000 ISC',
        fontSize: 32,
        fontFamily: 'Arial',
        color: '#4ECDC4',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 250,
        description: 'Amount display',
      },
      {
        id: 'date',
        text: 'Date: 2026-08-01',
        textZh: '日期：2026-08-01',
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#CCCCCC',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 320,
        description: 'Transaction date',
      },
    ],
  },
  {
    id: 'transaction-premium',
    name: 'Premium Transaction',
    nameZh: '高级交易',
    description: 'Premium styled transaction poster',
    descriptionZh: '高级风格的交易海报',
    category: 'transaction',
    presets: [
      {
        id: 'badge',
        text: '✓ VERIFIED',
        textZh: '✓ 已验证',
        fontSize: 28,
        fontFamily: 'Arial',
        color: '#10B981',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 100,
        description: 'Verification badge',
      },
      {
        id: 'title',
        text: 'Transaction Confirmed',
        textZh: '交易已确认',
        fontSize: 44,
        fontFamily: 'Microsoft YaHei',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 180,
        description: 'Main title',
      },
      {
        id: 'amount',
        text: '1000 ISC',
        textZh: '1000 ISC',
        fontSize: 56,
        fontFamily: 'Arial',
        color: '#FFD700',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 280,
        description: 'Large amount',
      },
      {
        id: 'network',
        text: 'BSC Testnet',
        textZh: 'BSC 测试网',
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#A0AEC0',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 360,
        description: 'Network info',
      },
    ],
  },
];

// Achievement Templates
const achievementTemplates: PosterTemplate[] = [
  {
    id: 'achievement-milestone',
    name: 'Milestone Achievement',
    nameZh: '里程碑成就',
    description: 'Celebrate your achievement milestone',
    descriptionZh: '庆祝你的成就里程碑',
    category: 'achievement',
    presets: [
      {
        id: 'badge',
        text: '🏆',
        textZh: '🏆',
        fontSize: 80,
        fontFamily: 'Arial',
        color: '#FFD700',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 80,
        description: 'Trophy emoji',
      },
      {
        id: 'title',
        text: 'Achievement Unlocked',
        textZh: '成就解锁',
        fontSize: 48,
        fontFamily: 'Microsoft YaHei',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 200,
        description: 'Achievement title',
      },
      {
        id: 'description',
        text: 'You have reached a new milestone!',
        textZh: '你已达到新的里程碑！',
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#E0E7FF',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 280,
        description: 'Achievement description',
      },
    ],
  },
];

// Event Templates
const eventTemplates: PosterTemplate[] = [
  {
    id: 'event-announcement',
    name: 'Event Announcement',
    nameZh: '活动公告',
    description: 'Announce your event with style',
    descriptionZh: '以风格宣布你的活动',
    category: 'event',
    presets: [
      {
        id: 'title',
        text: 'New Event',
        textZh: '新活动',
        fontSize: 52,
        fontFamily: 'Microsoft YaHei',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 120,
        description: 'Event title',
      },
      {
        id: 'subtitle',
        text: 'Join us for an amazing experience',
        textZh: '加入我们，体验精彩',
        fontSize: 28,
        fontFamily: 'Arial',
        color: '#A78BFA',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 200,
        description: 'Event subtitle',
      },
      {
        id: 'details',
        text: 'Limited Time Offer',
        textZh: '限时优惠',
        fontSize: 32,
        fontFamily: 'Arial',
        color: '#F87171',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 300,
        description: 'Event details',
      },
    ],
  },
];

// Social Templates
const socialTemplates: PosterTemplate[] = [
  {
    id: 'social-share',
    name: 'Social Share',
    nameZh: '社交分享',
    description: 'Perfect for social media sharing',
    descriptionZh: '适合社交媒体分享',
    category: 'social',
    presets: [
      {
        id: 'title',
        text: 'Check This Out!',
        textZh: '看看这个！',
        fontSize: 44,
        fontFamily: 'Microsoft YaHei',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 150,
        description: 'Social title',
      },
      {
        id: 'message',
        text: 'Join the Ice Snow City community',
        textZh: '加入冰雪城市社区',
        fontSize: 26,
        fontFamily: 'Arial',
        color: '#60A5FA',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 250,
        description: 'Social message',
      },
      {
        id: 'cta',
        text: 'Share Now',
        textZh: '现在分享',
        fontSize: 28,
        fontFamily: 'Arial',
        color: '#34D399',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        x: 400,
        y: 340,
        description: 'Call to action',
      },
    ],
  },
];

// Combine all templates
export const ALL_TEMPLATES: PosterTemplate[] = [
  ...transactionTemplates,
  ...achievementTemplates,
  ...eventTemplates,
  ...socialTemplates,
];

// Get templates by category
export const getTemplatesByCategory = (
  category: PosterTemplate['category']
): PosterTemplate[] => {
  return ALL_TEMPLATES.filter((template) => template.category === category);
};

// Get template by ID
export const getTemplateById = (id: string): PosterTemplate | undefined => {
  return ALL_TEMPLATES.find((template) => template.id === id);
};

// Color presets
export const COLOR_PRESETS = {
  primary: [
    '#FFFFFF', // White
    '#000000', // Black
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
  ],
  accent: [
    '#FFD700', // Gold
    '#10B981', // Green
    '#A78BFA', // Purple
    '#F87171', // Pink
    '#60A5FA', // Light Blue
    '#34D399', // Emerald
    '#FBBF24', // Amber
    '#8B5CF6', // Violet
  ],
};

// Font presets
export const FONT_PRESETS = [
  { name: '微软雅黑', value: 'Microsoft YaHei', category: 'sans-serif' },
  { name: '宋体', value: 'SimSun', category: 'serif' },
  { name: 'Arial', value: 'Arial', category: 'sans-serif' },
  { name: 'Helvetica', value: 'Helvetica', category: 'sans-serif' },
  { name: 'Georgia', value: 'Georgia', category: 'serif' },
  { name: 'Courier New', value: 'Courier New', category: 'monospace' },
];

// Size presets
export const SIZE_PRESETS = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
  xxlarge: 64,
};

// Export all presets
export const POSTER_PRESETS = {
  templates: ALL_TEMPLATES,
  colors: COLOR_PRESETS,
  fonts: FONT_PRESETS,
  sizes: SIZE_PRESETS,
};
