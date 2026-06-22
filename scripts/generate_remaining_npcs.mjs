import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Read the existing NPC prototypes
const npcPrototypesPath = path.join(projectRoot, 'npc_prototypes.json');
const npcPrototypes = JSON.parse(fs.readFileSync(npcPrototypesPath, 'utf-8'));

// Template for NPC description
const generateNPCMarkdown = (npc, index) => {
  const npcNumber = String(index + 19).padStart(3, '0'); // Start from 019 (after 18 representative NPCs)
  const imageUrl = `https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/npc_full_${npcNumber}_placeholder.webp`;
  
  const personality = npc.personalityTraits ? npc.personalityTraits.join('、') : '待定';
  const hobbies = npc.hobbies ? npc.hobbies.join('、') : '待定';
  const skills = npc.skills ? npc.skills.join('、') : '待定';
  const gender = npc.gender === '男' ? '男性' : '女性';
  const gameRoles = [
    `提供 ${npc.profession} 相关服务`,
    `执行 ${npc.economicRole}`,
    `发布 ${npc.profession} 相关任务`
  ];
  
  return `
## NPC_${npcNumber}: ${npc.name} | ${npc.profession}

![${npc.name}](${imageUrl})

**图下描述**: ${npc.alias}，${npc.backgroundStory.substring(0, 50)}...

| 属性 | 值 |
|------|-----|
| 名字 | ${npc.name} |
| 职业 | ${npc.profession} |
| 年龄 | ${npc.ageRange} |
| 性别 | ${gender} |
| 性格 | ${personality} |
| 爱好 | ${hobbies} |
| 特殊技能 | ${skills} |

**服装描述**: ${npc.visualDescription}

**背景故事**: ${npc.backgroundStory}

**游戏角色**: 
${gameRoles.map(role => `- ${role}`).join('\n')}

**核心对话**: "欢迎！我是 ${npc.name}，${npc.profession}。${npc.dialogueStyle ? '我很' + npc.dialogueStyle : '很高兴认识您。'}"

---
`;
};

// Generate markdown for remaining NPCs
let markdownContent = `# Ice Snow City - NPC 快速模板库（NPC 019-200）

本文档包含 Ice Snow City 游戏中剩余 182 个 NPC 的快速模板设计。这些 NPC 使用与 18 个代表性 NPC 相同的结构，但采用快速生成方式。

---

`;

// Generate markdown for each NPC (starting from index 18, which is NPC 019)
for (let i = 18; i < Math.min(npcPrototypes.length, 200); i++) {
  const npc = npcPrototypes[i];
  if (npc) {
    markdownContent += generateNPCMarkdown(npc, i);
  }
}

// Write to file
const outputPath = path.join(projectRoot, 'NPC_QUICK_TEMPLATE_LIBRARY.md');
fs.writeFileSync(outputPath, markdownContent, 'utf-8');

console.log(`✅ Generated NPC quick template library: ${outputPath}`);
console.log(`📊 Total NPCs: ${Math.min(npcPrototypes.length, 200)}`);
console.log(`📝 Template NPCs: ${Math.min(npcPrototypes.length - 18, 182)}`);
