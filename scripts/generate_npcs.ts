import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface NpcPrototype {
  npcId: string;
  name: string;
  alias: string;
  gender: '男' | '女';
  ageRange: '青年' | '中年' | '老年';
  profession: string;
  socialClass: '上层' | '中层' | '下层';
  personalityTraits: string[];
  backgroundStory: string;
  economicRole: string;
  skills: string[];
  hobbies: string[];
  relationshipStatus: '单身' | '已婚';
  currentLocation: string;
  dailyRoutine: string;
  dialogueStyle: string;
  visualDescription: string;
  aiImagePrompt: string;
}

const professions = [
  { name: '矿工', alias: '冰雪矿工', role: '开采矿石、销售矿石', skills: ['采矿', '地质学'], location: '冰雪矿场' },
  { name: '铁匠', alias: '冰雪铁匠', role: '打造工具、修理装备', skills: ['锻造', '金属学'], location: '冰雪铁匠铺' },
  { name: '药剂师', alias: '冰雪药剂师', role: '制作药剂、销售药水', skills: ['炼金术', '草药学'], location: '冰雪药剂店' },
  { name: '裁缝', alias: '冰雪裁缝', role: '制作服装、修补衣物', skills: ['缝纫', '设计'], location: '冰雪裁缝铺' },
  { name: '厨师', alias: '冰雪厨师', role: '烹饪食物、销售菜肴', skills: ['烹饪', '食材搭配'], location: '冰雪餐厅' },
  { name: '商人', alias: '冰雪商人', role: '买卖商品、倒卖物资', skills: ['交易', '谈判'], location: '冰雪集市' },
  { name: '卫兵', alias: '冰雪卫兵', role: '维护治安、巡逻城市', skills: ['战斗', '侦查'], location: '冰雪城门' },
  { name: '学者', alias: '冰雪学者', role: '研究历史、提供咨询', skills: ['历史学', '文献研究'], location: '冰雪图书馆' },
  { name: '探险家', alias: '冰雪探险家', role: '探索未知、寻找宝藏', skills: ['野外生存', '寻宝'], location: '探险者公会' },
  { name: '牧师', alias: '冰雪牧师', role: '治疗伤病、提供祝福', skills: ['治疗', '神学'], location: '冰雪教堂' }
];

const names = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨'];
const givenNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ageRanges: ('青年' | '中年' | '老年')[] = ['青年', '中年', '老年'];
const genders: ('男' | '女')[] = ['男', '女'];
const socialClasses: ('上层' | '中层' | '下层')[] = ['上层', '中层', '下层'];
const personalityTraits = ['勤劳', '勇敢', '智慧', '善良', '狡猾', '忠诚', '热情', '冷静', '乐观', '悲观'];
const hobbies = ['阅读', '旅行', '钓鱼', '烹饪', '绘画', '音乐', '运动', '园艺', '编程', '写作'];
const relationshipStatuses: ('单身' | '已婚')[] = ['单身', '已婚'];

const generateRandomName = (gender: '男' | '女'): string => {
  const surnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨'];
  const maleNames = ['明', '刚', '强', '勇', '杰', '磊', '涛', '伟', '军', '波'];
  const femaleNames = ['娜', '娟', '敏', '静', '丽', '芳', '玲', '燕', '萍', '红'];

  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenName = gender === '男' ? maleNames[Math.floor(Math.random() * maleNames.length)] : femaleNames[Math.floor(Math.random() * femaleNames.length)];
  return `${surname}·${givenName}`;
};

const generateNpc = (index: number): NpcPrototype => {
  const selectedGender = getRandomElement(genders);
  const selectedAgeRange = getRandomElement(ageRanges);
  const profession = getRandomElement(professions);
  const selectedSocialClass = getRandomElement(socialClasses);
  const name = generateRandomName(selectedGender);
  const alias = `冰雪${profession.name}`;

  const skills = profession.skills;
  const backgroundStory = `${name}是 Ice Snow City 的一名${profession.name}，致力于${profession.role}。`;
  const economicRole = profession.role;
  const currentLocation = profession.location;
  const dailyRoutine = `白天在${profession.location}工作，晚上休息。`;
  const dialogueStyle = '热情、专业';
  const visualDescription = `一位${selectedAgeRange}的${selectedGender === '男' ? '男性' : '女性'}${profession.name}，穿着符合职业的服装。`;
  const aiImagePrompt = `A ${selectedAgeRange === '青年' ? 'young' : selectedAgeRange === '中年' ? 'middle-aged' : 'old'} ${selectedGender === '男' ? 'male' : 'female'} ${profession.name}, wearing professional attire. Semi-realistic 3D cartoon style, Asian aesthetic, high-quality rendering, modern fashion. Ice Snow City background.`;

  return {
    npcId: `NPC_${(index + 60).toString().padStart(3, '0')}`,
    name,
    alias,
    gender: selectedGender,
    ageRange: selectedAgeRange,
    profession: profession.name,
    socialClass: selectedSocialClass,
    personalityTraits: Array.from({ length: 3 }, () => getRandomElement(personalityTraits)),
    backgroundStory,
    economicRole,
    skills,
    hobbies: Array.from({ length: 3 }, () => getRandomElement(hobbies)),
    relationshipStatus: getRandomElement(relationshipStatuses),
    currentLocation,
    dailyRoutine,
    dialogueStyle,
    visualDescription,
    aiImagePrompt,
  };
};

const generateNpcs = (count: number): NpcPrototype[] => {
  const npcs: NpcPrototype[] = [];
  for (let i = 0; i < count; i++) {
    npcs.push(generateNpc(i));
  }
  return npcs;
};

const main = () => {
  const numNpcsToGenerate = 140;
  const npcs = generateNpcs(numNpcsToGenerate);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outputPath = path.join(__dirname, '../npc_prototypes.json');
  fs.writeFileSync(outputPath, JSON.stringify(npcs, null, 2), 'utf-8');
  console.log(`Generated ${numNpcsToGenerate} NPC prototypes to ${outputPath}`);
};

main();
