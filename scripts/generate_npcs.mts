import fs from 'fs';
import path from 'path';

interface NPC {
  npcId: string;
  name: string;
  alias: string;
  gender: string;
  ageRange: string;
  profession: string;
  socialClass: string;
  personalityTraits: string[];
  backgroundStory: string;
  economicRole: string;
  skills: string[];
  hobbies: string[];
  relationshipStatus: string;
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

function generateNPCs(count: number, startIndex: number): NPC[] {
  const npcs: NPC[] = [];
  for (let i = 0; i < count; i++) {
    const prof = getRandomElement(professions);
    const gender = Math.random() > 0.5 ? '男' : '女';
    const ageRange = getRandomElement(['青年', '中年', '老年']);
    const name = `${getRandomElement(names)}·${getRandomElement(givenNames)}`;
    
    npcs.push({
      npcId: `NPC_${(startIndex + i).toString().padStart(3, '0')}`,
      name: name,
      alias: prof.alias,
      gender: gender,
      ageRange: ageRange,
      profession: prof.name,
      socialClass: getRandomElement(['上层', '中层', '下层']),
      personalityTraits: ['勤劳', '勇敢', '智慧'],
      backgroundStory: `${name}是 Ice Snow City 的一名${prof.name}，致力于${prof.role}。`,
      economicRole: prof.role,
      skills: prof.skills,
      hobbies: ['阅读', '旅行', '钓鱼'],
      relationshipStatus: getRandomElement(['单身', '已婚']),
      currentLocation: prof.location,
      dailyRoutine: `白天在${prof.location}工作，晚上休息。`,
      dialogueStyle: '热情、专业',
      visualDescription: `一位${ageRange}的${gender}性${prof.name}，穿着符合职业的服装。`,
      aiImagePrompt: `A ${ageRange === '青年' ? 'young' : ageRange === '中年' ? 'middle-aged' : 'old'} ${gender === '男' ? 'male' : 'female'} ${prof.name}, wearing professional attire. Semi-realistic 3D cartoon style, Asian aesthetic, high-quality rendering, modern fashion. Ice Snow City background.`
    });
  }
  return npcs;
}

const npcs = generateNPCs(140, 61);
const outputPath = path.join(__dirname, '../npc_prototypes.json');
fs.writeFileSync(outputPath, JSON.stringify(npcs, null, 2));
console.log(`Successfully generated 140 NPCs and saved to ${outputPath}`);
