# 买刀买马（Blades & Steeds）游戏开发文档

## 🎮 项目概述

### 项目简介
买刀买马（Blades & Steeds）是一款基于 Cloudflare Workers + Durable Objects 的实时多人回合制策略游戏。玩家通过买刀、买马进行战斗，最后存活的玩家获胜。

> **📋 原始需求文档**: `game/game.py` 包含了游戏的核心规则和职业设计的完整说明（PDF 生成脚本）。本文档基于该需求实现了 Web 版本。

### 技术栈
- **后端**: Cloudflare Workers + Durable Objects (TypeScript)
- **前端**: React 19 + TailwindCSS 4 + Vite
- **通信**: WebSocket (Durable Objects Hibernation API)
- **国际化**: i18next + react-i18next
- **UI 组件**: Lucide React Icons
- **路由**: React Router v7
- **包管理**: pnpm

---

## 📖 游戏规则详解

### 基础规则
- **人数**: 2-9 人
- **获胜条件**: 存活到最后的玩家获胜（特殊：爆破手可以同归于尽获胜）
- **开局流程**: 每位玩家随机获得 2 个不同的职业选项，从中**二选一**

### 角色属性
- **血量**: 初始 10 点
- **初始装备**:
  - 👕 衣服 × 1
  - 🗡️ 买刀权 × 1
  - 🐴 买马权 × 1
  - （特殊职业会有不同的初始配置）

### 地图系统（星型拓扑）
```
        [城池A]
            |
 [城池B]---[中央]---[城池C]
            |
        [城池D]
```

**地图特点**:
- 每个玩家拥有自己的城池（以玩家 ID 命名）
- 所有城池围绕中央呈星型分布
- 只能在**城池↔中央**之间移动
- 城池之间**不直接相连**
- 初始位置：玩家的个人城池

**移动规则**:
- 在城池中 → 只能移动到中央
- 在中央 → 可以移动到任意城池

### 回合与步数系统
**步数计算**:
- **基础步数**: 1 步（每个玩家）
- **随机步数池**: = 存活玩家数量
- **分配方式**: 随机分配步数池给存活玩家

**示例**: 5 名玩家存活时
- 基础步数池: 5 × 1 = 5
- 额外步数池: 5
- 每个玩家至少 1 步，额外 5 步随机分配

### 战斗系统

#### 伤害公式
```
最终伤害 = (武器总伤害) - (衣服总数量) + 1
```
- 若计算结果 ≤ 0，则造成 0 点伤害
- 特殊职业的真实伤害无视防御

#### 武器伤害
- **刀**: 基础伤害 1，每多一把刀 +1 伤害
- **马**: 基础伤害 3，每多一匹马 +1 伤害，**额外效果：强制目标移动到中央**（仅在城池内可用）

#### 防御机制
- 每件衣服提供 1 点防御
- 职业特殊装备（如胖子的脂肪衣）也计入防御

### 行动类型

| 行动 | 消耗 | 详细规则 |
|------|------|----------|
| **移动** | 1 步 | 在所在城池与中央之间移动 |
| **购买** | 1 步 + 购买权 | 仅限在**自己的城池**内，消耗对应购买权获得物品 |
| **抢夺** | 1 步 | 同位置，抢夺对方**任意一件实体物品**（不可抢夺购买权） |
| **攻击-刀** | 1 步 | 同位置，造成刀伤害 |
| **攻击-马** | 1 步 | 同城池内（中央不可用），造成马伤害 + 踢到中央 |

### 物品系统

#### 物品原则
1. **持有 vs 使用**: 
   - 所有物品都可以被抢夺
   - 若职业不匹配，物品**仅占位，无法使用**（无数值加成）
   
2. **遗物处理**:
   - 击杀者可选择拿走 **0 件或 1 件**物品（含购买权）
   - 剩余物品**全部销毁**

#### 结算顺序
- **FIFO 原则**: 所有延时类技能（药水、炮弹）按照玩家操作顺序依次结算
- 回合结束时统一结算所有延时效果

---

## 👥 九大职业系统

### 通用规则
- 每局同职业限 **2 人**
- 所有职业道具伤害遵循**【数量 +1，伤害 +1】**规则

### ① 法师 (Mage) 🧙
**初始配置**: 标准配置 + 药水购买权

**购买选项**:
- 🧪 药水 (X 步) - 无限购买，不占物品栏

**技能机制**:
- **延时回血**: 下回合所有人行动结束后生效
- **全图指定**: 可以指定任意位置（中央或任意城池）
- **效果**: 该位置所有玩家回复 X 点血量

**策略**: 支援职业，可以为队友回血，也可以在战斗中续航

---

### ② 弓箭手 (Archer) 🏹
**初始配置**: 标准配置 + 买弓权

**购买选项**:
- 🏹 弓 (2 步 + 权)
- ➡️ 箭 (1 步) - 可多次购买

**技能机制**:
- **射击消耗**: 1 步 + 1 支箭（需持有弓）
- **射程**: 当前位置或相邻区域（城池→中央，中央→所有城池）
- **伤害**: 1 + (弓数量 - 1)

**策略**: 远程输出，可以跨区域攻击

---

### ③ 火箭兵 (Rocketeer) 🚀
**初始配置**: 标准配置 + 买火箭筒权

**购买选项**:
- 🚀 火箭筒 (2 步 + 权)
- 💣 火箭弹 (2 步) - 可多次购买

**技能机制**:
- **开火消耗**: 1 步 + 1 发火箭弹（需持有火箭筒）
- **延时 AOE**: 全图任意指定区域，**下回合结束生效**
- **真实伤害**: 2 + (火箭筒数量 - 1)，**无视防御**

**策略**: 高伤害 AOE，需要提前预判敌人位置

---

### ④ 爆破手 (Bomber) 💣
**初始配置**: 标准配置（无特殊购买权）

**购买选项**:
- 💥 炸弹 (1 步) - 可多次购买

**技能机制**:
- **埋弹**: 1 步，在当前位置放置炸弹（全场可见）
- **引爆**: 1 步，引爆场上所有自己的炸弹
- **真实伤害**: 炸弹数量 × 基础伤害

**特殊规则**:
- 如果引爆炸弹导致自己死亡且杀死至少 1 名其他玩家 → **同归于尽判胜**

**策略**: 陷阱设置，心理博弈

---

### ⑤ 拳击手 (Boxer) 🥊
**初始配置**: 
- ❌ **无衣服**
- ❌ **无刀马权**
- ✅ 三种拳套购买权

**购买选项**:
- 🥉 铜拳套 (1 步) - 基础伤害 1
- 🥈 银拳套 (2 步) - 基础伤害 2
- 🥇 金拳套 (3 步) - 基础伤害 3

**技能机制**:
- **限制**: 无法使用刀/马/衣
- **攻击消耗**: 1 步
- **真实伤害**: 基础值 + (同种数量 - 1)
- **数量加成**: 铜=1/银=2/金=3

**策略**: 近战高爆发，但无防御能力

---

### ⑥ 武僧 (Monk) 🧘
**初始配置**: 
- ❌ **无衣服**
- ❌ **无刀马权**
- ✅ 三种腰带购买权

**购买选项**:
- 🥉 铜腰带 (1 步) - 基础伤害 1，近身
- 🥈 银腰带 (2 步) - 基础伤害 1，**全图**
- 🥇 金腰带 (3 步) - 基础伤害 2，近身

**技能机制**:
- **限制**: 无法使用刀/马/衣
- **攻击**: 1 步，真实伤害 + **强制移动 1 步**
- **范围**: 
  - 铜腰带/金腰带：近身
  - 银腰带：全图攻击

**策略**: 控制型职业，可以强制移动敌人

---

### ⑦ 外星人 (Alien) 👽
**初始配置**: 
- ✅ 标准配置（刀、衣）
- ❌ **无买马权**
- ✅ 买 UFO 权

**购买选项**:
- 🛸 UFO (2 步 + 权)

**技能机制**:
- **限制**: 无法使用马
- **瞬移**: 1 步，移动到地图任意位置
- **被动**: 拥有 2 个 UFO 时，**回合结束后免费瞬移一次**

**策略**: 高机动性，灵活的位置控制

---

### ⑧ 胖子 (Fatty) 🍔
**初始配置**: 
- ✅ 自带【脂肪衣】（不可抢，死后消失）
- ❌ **无买马权**
- ❌ 无其他购买选项

**技能机制**:
- **限制**: 无法使用马
- **属性**: 自带脂肪衣提供防御
- **抱人**: 移动时**消耗双倍步数**，可以拖拽同位置一人一起移动

**策略**: 防御型，可以强制拖拽敌人

---

### ⑨ 吸血鬼 (Vampire) 🧛
**初始配置**: 标准配置（无特殊）

**技能机制**:
- **被动吸血**: 只有在使用【刀】进行攻击行动时（无论是否造成伤害），自身回复 **1 点血量**

**策略**: 续航型职业，靠刀攻击回血

---

## 🏗️ 技术架构详解

### 后端架构 (Cloudflare Workers + Durable Objects)

#### 文件结构
```
worker/
├── index.ts          # Worker 入口，路由分发
├── gameRoom.ts       # GameRoom Durable Object，游戏核心逻辑
└── roomRegistry.ts   # RoomRegistry Durable Object，房间列表管理
```

#### GameRoom Durable Object (`worker/gameRoom.ts`)

**核心功能**:
1. **游戏状态管理**
   - 玩家列表（Map<playerId, Player>）
   - 当前回合、当前玩家
   - 炸弹位置、延时效果队列
   - 行动日志（ActionLog[]）

2. **WebSocket 会话管理**
   - Hibernation API 支持
   - 自动重连处理
   - 会话序列化/反序列化

3. **持久化**
   - 使用 `ctx.storage.put('gameState', ...)`
   - 状态序列化（Map → Array）
   - 自动保存机制

4. **游戏阶段**
   - `waiting`: 等待玩家加入
   - `class_selection`: 职业选择（顺序进行）
   - `playing`: 游戏进行中
   - `ended`: 游戏结束

5. **核心逻辑**
   ```typescript
   // 状态持久化
   private async saveGameState(): Promise<void>
   
   // 步数分配
   private distributeSteps(players: Player[]): void
   
   // 延时效果处理（药水、火箭）
   private async processDelayedEffects(): Promise<ActionLog[]>
   
   // 伤害计算
   private calculateDamage(attacker: Player, weapon: 'knife' | 'horse'): number
   
   // 玩家死亡处理
   private async handlePlayerDeath(killer: Player, victim: Player): Promise<void>
   
   // 胜利检测
   private checkWinCondition(): Player | null
   ```

6. **WebSocket 消息处理**
   ```typescript
   // 客户端消息类型
   - join_room: 加入房间
   - select_class: 选择职业
   - start_game: 开始游戏（仅房主）
   - perform_action: 执行行动
   
   // 服务端消息类型
   - room_state: 房间状态更新
   - new_action_logs: 增量日志更新
   - error: 错误消息
   ```

7. **休眠机制**
   - 无连接 6 小时后触发 alarm
   - 自动清理空房间
   - WebSocket 状态序列化

#### RoomRegistry Durable Object (`worker/roomRegistry.ts`)

**功能**:
- 管理所有公开房间列表
- 提供房间注册/注销/更新 API
- 持久化房间信息

**API**:
```typescript
POST /register    # 注册新房间
POST /unregister  # 注销房间
POST /update      # 更新房间信息
GET  /list        # 获取公开房间列表（最多 50 个）
```

#### Worker 入口 (`worker/index.ts`)

**路由**:
```typescript
GET  /api/rooms                # 获取公开房间列表
POST /api/rooms                # 创建新房间
WS   /api/rooms/:roomId        # WebSocket 连接
```

---

### 前端架构 (React + TailwindCSS)

#### 目录结构
```
src/
├── pages/              # 页面组件
│   ├── Home.tsx        # 首页（房间列表）
│   ├── Profile.tsx     # 用户资料设置
│   ├── CreateRoom.tsx  # 创建房间
│   ├── GameRoom.tsx    # 游戏房间（核心）
│   └── Settings.tsx    # 设置页面
├── components/         # UI 组件
│   ├── GameBoard.tsx   # 游戏面板（地图、行动按钮）
│   ├── StarMap.tsx     # 星型地图可视化
│   ├── PlayerList.tsx  # 玩家列表
│   └── ActionLog.tsx   # 行动日志
├── hooks/
│   └── useWebSocket.ts # WebSocket 钩子
├── contexts/
│   └── ThemeContext.tsx # 主题上下文
├── utils/
│   └── auth.ts         # 用户认证工具
├── types/
│   └── game.ts         # 游戏类型定义
├── i18n/               # 国际化
│   ├── index.ts
│   └── locales/
│       ├── en.json
│       └── zh.json
├── App.tsx             # 路由配置
└── main.tsx            # 入口
```

#### 核心组件详解

##### GameRoom.tsx（游戏房间）
**职责**:
- WebSocket 连接管理
- 游戏状态同步
- 消息收发协调
- 阶段切换 UI

**状态管理**:
```typescript
const [gameState, setGameState] = useState<GameState | null>(null);
const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
```

**消息处理**:
```typescript
useEffect(() => {
  if (lastMessage?.type === 'room_state') {
    // 完整状态更新
    setGameState(processState(lastMessage.state));
  } else if (lastMessage?.type === 'new_action_logs') {
    // 增量日志更新
    appendLogs(lastMessage.logs);
  }
}, [lastMessage, messageTimestamp]);
```

##### StarMap.tsx（星型地图）
**可视化特点**:
- SVG 绘制
- 响应式布局
- 圆周均匀分布算法
- 点击交互
- 高亮可移动位置

**位置计算**:
```typescript
const getCityPosition = (index: number, total: number) => {
  const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
  const radius = 180;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
};
```

**视觉编码**:
- 🟣 紫色虚线边框：玩家自己的城池
- ⚪ 灰色：其他玩家城池
- 🔵 蓝色大圆：中央
- 🟢 绿色高亮：可移动位置

##### GameBoard.tsx（游戏面板）
**功能模块**:
1. **移动系统**
   ```typescript
   const canMove = currentPlayer.stepsRemaining > 0;
   const availableMoves = getAvailableMoveTargets();
   ```

2. **购买系统**（仅在自己城池）
   ```typescript
   const canBuy = currentPlayer.location.type === 'city' && 
                  currentPlayer.location.cityId === currentPlayer.id && 
                  currentPlayer.stepsRemaining > 0;
   ```

3. **战斗系统**
   - 刀攻击（同位置）
   - 马攻击（同城池，踢到中央）
   - 职业特殊技能

4. **抢夺系统**
   - 显示目标玩家物品栏
   - 点击选择物品抢夺

##### ActionLog.tsx（行动日志）
**日志类型**:
- 移动
- 购买
- 抢夺
- 攻击（刀、马、特殊技能）
- 延时效果生效（药水、火箭）
- 玩家死亡

**结构化日志**:
```typescript
interface ActionLog {
  id: string;
  turn: number;
  playerId: string;
  playerName: string;
  type: ActionType;
  actionResult?: ActionResult; // 结构化结果
  timestamp: number;
}
```

#### 自定义 Hooks

##### useWebSocket.ts
```typescript
export function useWebSocket(roomId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const [messageTimestamp, setMessageTimestamp] = useState(0);
  
  // 自动重连机制
  const connect = useCallback(() => {
    const wsUrl = `${protocol}//${host}/api/rooms/${roomId}`;
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onclose = () => {
      setTimeout(() => connect(), 3000); // 3 秒后重连
    };
  }, [roomId]);
  
  return { isConnected, lastMessage, messageTimestamp, send };
}
```

#### 认证系统 (`utils/auth.ts`)

**Cookie-Based 认证**:
```typescript
// 生成或获取用户 ID
export function getUserId(): string {
  let userId = localStorage.getItem('blade_steeds_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('blade_steeds_user_id', userId);
  }
  return userId;
}

// QQ 头像
export function getQQAvatar(qqNumber: string): string {
  return `https://q.qlogo.cn/g?b=qq&nk=${qqNumber}&s=100`;
}
```

#### 国际化系统 (`i18n/`)

**支持语言**:
- 🇨🇳 中文 (zh)
- 🇺🇸 英文 (en)

**翻译文件结构**:
```json
{
  "app": { "title": "Blades & Steeds" },
  "common": { "loading": "Loading...", "back": "Back" },
  "room": { "waiting": "Waiting Room", "startGame": "Start Game" },
  "game": { "yourTurn": "Your Turn", "phase": {...} },
  "class": { "mage": "Mage", "archer": "Archer", ... },
  "item": { "knife": "Knife", "horse": "Horse", ... },
  "action": { "move": "Move", "purchase": "Purchase", ... }
}
```

**使用方式**:
```typescript
const { t } = useTranslation();
<h1>{t('app.title')}</h1>
```

#### 主题系统 (`contexts/ThemeContext.tsx`)

**主题模式**:
- 💻 System（跟随系统）

当前只有跟随系统一种设置方式。

---

## 🎨 UI/UX 设计规范

### 设计原则
1. **简洁美观**: 使用 TailwindCSS 实用类
2. **图标系统**: 
   - UI 图标：Lucide React（ArrowLeft, Users, Settings 等）
   - 游戏图标：Emoji（🗡️, 🐴, 🧪, 🏹 等）
3. **响应式**: Mobile-First 设计，桌面增强
4. **无障碍**: 语义化 HTML，ARIA 标签

### 配色方案

#### 亮色模式
- 背景：from-blue-50 to-indigo-100
- 卡片：bg-white
- 主色调：blue-500 to indigo-600
- 文字：gray-900

#### 暗色模式
- 背景：from-gray-900 to-gray-800
- 卡片：bg-gray-800
- 主色调：blue-400 to indigo-500
- 文字：white

### 关键 UI 组件

#### 按钮样式
```typescript
// 主要按钮
className="py-3 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 
           text-white font-semibold shadow-lg hover:shadow-xl 
           transition-all hover:scale-[1.02] cursor-pointer"

// 禁用状态
disabled:opacity-50 disabled:cursor-not-allowed
```

#### 卡片样式
```typescript
className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 
           border-2 border-gray-200 dark:border-gray-700"
```

#### 输入框样式
```typescript
className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 
           dark:border-gray-600 bg-white dark:bg-gray-700 
           text-gray-900 dark:text-white"
```

---

## 🚀 开发与部署

### 本地开发

#### 环境要求
- Node.js 20+
- pnpm 8+

#### 安装依赖
```bash
pnpm install
```

#### 开发服务器
```bash
# 前端开发（Vite）
pnpm run dev

# Worker 本地开发
pnpm run dev:worker
```

#### 构建
```bash
pnpm run build
```

#### 类型检查
```bash
pnpm run lint
```

### 部署到 Cloudflare

#### 配置文件 (`wrangler.jsonc`)
```jsonc
{
  "name": "blades-and-steeds",
  "compatibility_date": "2026-02-17",
  "main": "./worker/index.ts",
  "assets": {
    "not_found_handling": "single-page-application" // SPA 路由支持
  },
  "durable_objects": {
    "bindings": [
      { "name": "GAME_ROOM", "class_name": "GameRoom" },
      { "name": "ROOM_REGISTRY", "class_name": "RoomRegistry" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["GameRoom"] },
    { "tag": "v2", "new_sqlite_classes": ["RoomRegistry"] }
  ]
}
```

#### 部署命令
```bash
# 构建 + 部署
pnpm run deploy

# 或分步执行
pnpm run build
pnpm exec wrangler deploy
```

#### 生成类型
```bash
pnpm run cf-typegen
```

---

## ✅ 已实现功能

### 后端功能
- ✅ Durable Objects 游戏房间管理
- ✅ WebSocket Hibernation API 支持
- ✅ 游戏状态持久化
- ✅ 玩家会话管理（重连支持）
- ✅ 房间注册表（公开房间列表）
- ✅ 职业选择系统（顺序选择）
- ✅ 回合制框架
- ✅ 步数分配系统
- ✅ 移动系统（城池 ↔ 中央）
- ✅ 购买系统（城池内）
- ✅ 基础战斗系统（刀、马）
- ✅ 抢夺系统
- ✅ 延时效果系统（药水、火箭）
- ✅ 行动日志系统（结构化）
- ✅ 玩家死亡处理
- ✅ 房间清理机制（Alarm）

### 前端功能
- ✅ 用户认证（Cookie-based）
- ✅ QQ 头像支持
- ✅ 用户资料设置
- ✅ 房间创建（公开/私密）
- ✅ 房间列表（公开房间）
- ✅ WebSocket 自动重连
- ✅ 游戏房间 UI
- ✅ 等待大厅（玩家列表）
- ✅ 职业选择界面
- ✅ 星型地图可视化
- ✅ 游戏面板（移动、购买、攻击、抢夺）
- ✅ 行动日志展示
- ✅ 国际化（中英文）
- ✅ 主题切换（亮色/暗色/系统）
- ✅ 响应式设计（桌面+移动）

### 职业实现状态
- ✅ 法师 (Mage) - 药水治疗
- ✅ 弓箭手 (Archer) - 弓箭射击
- ✅ 火箭兵 (Rocketeer) - 火箭 AOE
- 🚧 爆破手 (Bomber) - 炸弹系统（部分）
- 🚧 拳击手 (Boxer) - 拳套攻击（待完善）
- 🚧 武僧 (Monk) - 腰带攻击（待完善）
- 🚧 外星人 (Alien) - 瞬移（待完善）
- 🚧 胖子 (Fatty) - 抱人（待完善）
- ✅ 吸血鬼 (Vampire) - 吸血被动

---

## 🚧 待实现功能

### 核心游戏逻辑
1. **完整战斗系统**
   - [ ] 弓箭手远程攻击逻辑
   - [ ] 火箭兵延时 AOE 完整实现
   - [ ] 拳击手真实伤害计算
   - [ ] 武僧强制移动效果
   - [ ] 吸血鬼回血触发

2. **爆破手系统**
   - [ ] 炸弹放置逻辑
   - [ ] 炸弹引爆逻辑
   - [ ] 同归于尽判定

3. **外星人系统**
   - [ ] 瞬移目标选择 UI
   - [ ] 2 UFO 被动瞬移

4. **胖子系统**
   - [ ] 抱人目标选择 UI
   - [ ] 双倍步数消耗验证
   - [ ] 脂肪衣特殊属性

5. **购买系统完善**
   - [ ] 购买权消耗验证
   - [ ] 步数不足提示
   - [ ] 物品栏上限检查

6. **胜利条件**
   - [ ] 最后存活判定
   - [ ] 爆破手特殊胜利
   - [ ] 游戏结束动画

7. **观战系统**
   - [ ] 观战者列表
   - [ ] 观战者视角限制

### UI/UX 增强
1. **游戏体验**
   - [ ] 行动动画效果
   - [ ] 音效系统
   - [ ] 伤害数字飘动
   - [ ] 技能特效

2. **信息展示**
   - [ ] 玩家物品栏悬浮提示
   - [ ] 职业技能说明面板
   - [ ] 剩余步数大型显示
   - [ ] 回合倒计时（可选）

3. **社交功能**
   - [ ] 房间内聊天系统
   - [ ] 表情包/快捷语句
   - [ ] 玩家举报/屏蔽

4. **设置优化**
   - [ ] 音量控制
   - [ ] 动画速度调整
   - [ ] 通知偏好设置

### 数据与统计
1. **游戏记录**
   - [ ] 游戏回放系统
   - [ ] 战绩保存
   - [ ] MVP/数据统计

2. **排行榜**
   - [ ] 胜率排行
   - [ ] 击杀排行
   - [ ] 职业使用统计

3. **成就系统**
   - [ ] 各职业成就
   - [ ] 击杀成就
   - [ ] 特殊成就（如"同归于尽"）

### 技术优化
1. **性能优化**
   - [ ] 前端渲染优化
   - [ ] WebSocket 消息压缩
   - [ ] 状态更新防抖

2. **错误处理**
   - [ ] 断线重连优化
   - [ ] 错误日志上报
   - [ ] 用户友好错误提示

3. **测试**
   - [ ] 单元测试（Vitest）
   - [ ] 集成测试
   - [ ] E2E 测试（Playwright）

4. **CI/CD**
   - [ ] GitHub Actions 自动部署
   - [ ] 自动化测试流水线
   - [ ] Staging 环境

---

## 📊 游戏平衡性

### 职业平衡
```
攻击型: 拳击手, 武僧, 吸血鬼
防御型: 胖子
控制型: 武僧, 外星人
辅助型: 法师
远程型: 弓箭手, 火箭兵
特殊型: 爆破手
```

### 步数经济
- 基础步数保证每位玩家有行动能力
- 随机步数增加策略深度
- 多步数玩家可以连续行动

### 地图设计
- 星型拓扑强制玩家经过中央
- 城池作为安全区（购买、马攻击）
- 中央作为必经之路（冲突热点）

---

## 🐛 已知问题

### 高优先级
- [ ] 职业技能尚未完全实现（见待实现功能）
- [ ] 伤害计算逻辑待验证（特别是多件装备）
- [ ] 延时效果结算顺序（FIFO）待测试

### 中优先级
- [ ] 移动端地图交互优化
- [ ] 长时间游戏性能优化
- [ ] 断线重连后状态同步延迟

### 低优先级
- [ ] 某些职业图标使用 Emoji（可替换为自定义图标）
- [ ] 日志样式可以更丰富（颜色编码、图标）
- [ ] 暗色模式某些边框对比度不足

---

## 📚 开发参考

### Cloudflare 文档
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [WebSocket Hibernation API](https://developers.cloudflare.com/durable-objects/api/hibernatable-websockets/)
- [Workers 开发](https://developers.cloudflare.com/workers/)

### React 生态
- [React 19 文档](https://react.dev/)
- [React Router v7](https://reactrouter.com/)
- [TailwindCSS v4](https://tailwindcss.com/)
- [i18next](https://www.i18next.com/)
- [Lucide Icons](https://lucide.dev/)

### 工具链
- [Vite](https://vite.dev/)
- [pnpm](https://pnpm.io/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

---

## 🤝 开发指南

### 添加新职业
1. 在 `src/types/game.ts` 添加职业类型
2. 在 `worker/gameRoom.ts` 的 `getInitialInventory` 和 `getInitialPurchaseRights` 添加配置
3. 在 `src/pages/GameRoom.tsx` 添加职业选择 UI
4. 在 `src/components/GameBoard.tsx` 添加职业特殊技能 UI
5. 在 `worker/gameRoom.ts` 的 `handlePerformAction` 添加技能逻辑
6. 在 `src/i18n/locales/` 添加翻译

### 添加新物品
1. 在 `src/types/game.ts` 的 `ItemType` 添加物品类型
2. 在职业配置中添加购买权
3. 添加物品使用逻辑
4. 添加物品 UI 显示
5. 添加翻译

### 调试技巧
```typescript
// 后端日志
console.log('[GameRoom]', 'Message:', data);

// 前端日志
console.log('[WebSocket]', 'Received:', lastMessage);

// Wrangler 本地调试
pnpm run dev:worker --local --persist
```

---

## 📧 技术支持

### 疑难解答
- **WebSocket 连接失败**: 检查 Cloudflare Workers 部署状态
- **状态不同步**: 清空 localStorage 重新登录
- **地图显示异常**: 检查浏览器缩放比例（建议 100%）

### 性能优化建议
- 定期清理旧房间（Alarm 机制）
- 限制单个房间日志数量（保留最近 100 条）
- 使用增量更新减少 WebSocket 流量

---

**注意**: 本项目仍在开发中，部分功能尚未完全实现。详见「待实现功能」章节。