# 买刀买马 (Blades and Steeds) 🗡️🐴

《买刀买马》是一款支持 2~8 人的强互动、异步与同步结合的回合制网页桌游。项目采用了纯 Serverless 的现代化架构，前端使用 React，后端采用 Cloudflare Workers (Durable Objects) 实现无缝的 WebSocket 状态同步。

## 🛠 准备环境

在开始之前，请确保你的电脑上安装了以下软件：
1. **Node.js** (推荐 v18 或更高版本)
2. **pnpm** 包管理工具 (如果没有，请在终端执行: `npm install -g pnpm`)
3. 一个免费的 **Cloudflare** 账号

## 🚀 本地运行指南 (关键步骤)

### 第一步：安装依赖
使用终端进入项目根目录，执行以下命令安装所有需要的包：
```bash
pnpm install
```

### 第二步：启动开发服务器
执行以下命令，前端与后端会同时启动：
```bash
pnpm dev
```
> **提示：**启动成功后，终端会提示项目运行在 `http://localhost:5173`。用浏览器打开该本地地址，即可开始测试游戏！

## 📦 生产环境部署

本项目仅支持部署到 **Cloudflare**（前端使用 Cloudflare Pages，后端使用 Cloudflare Workers）。如果你想把游戏发布到公网让朋友一起玩，执行以下命令即可一键构建并部署到 Cloudflare：
```bash
pnpm deploy
```

## 📁 核心目录结构指南

- `src/` : 所有的 React 前端代码 (UI组件、页面路由、类型定义)
- `worker/` : 所有的 后端代码 (包含路由入口、核心游戏状态机 gameRoom)
- `RULES.md` : 游戏的详细规则设计文档
- `wrangler.jsonc` : Cloudflare 后端部署相关的配置文件