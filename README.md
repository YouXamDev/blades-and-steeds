# 买刀买马 (Blades and Steeds) 🗡️🐴

《买刀买马》是一款支持 2~8 人的强互动、异步与同步结合的回合制网页桌游。项目采用了纯 Serverless 的现代化架构，前端使用 React，后端采用 Cloudflare Workers (Durable Objects) 实现无缝的 WebSocket 状态同步。

## 🛠 准备环境

在开始之前，请确保你的电脑上安装了以下软件：
1. **Node.js** (推荐 v18 或更高版本)
2. **pnpm** 包管理工具 (如果没有，请在终端执行: `npm install -g pnpm`)
3. 一个免费的 **Cloudflare** 账号

## 🚀 本地运行指南 (关键步骤)

注意：由于本项目包含前端页面和后端服务器，你需要**同时打开两个终端窗口**来分别启动它们。

### 第一步：安装依赖
使用终端进入项目根目录，执行以下命令安装所有需要的包：
```bash
pnpm install
```

### 第二步：启动后端服务 (终端 A)
在第一个终端窗口中，执行以下命令启动 Cloudflare Worker 本地模拟环境：
```bash
pnpm run start:worker
```
> **提示：**第一次运行该命令时，可能会自动打开浏览器要求你登录 Cloudflare 账号进行授权。登录成功后，你会看到终端提示运行在 `http://127.0.0.1:8787`，请保持此终端开启，不要关闭。

### 第三步：启动前端页面 (终端 B)
打开一个全新的第二个终端窗口，同样进入项目根目录，执行：
```bash
pnpm run dev
```
> **提示：**启动成功后，终端会提示项目运行在 `http://localhost:5173`。Vite 代理会自动将游戏数据转发给后台。现在，用浏览器打开该本地地址，即可开始测试游戏！

## 📦 生产环境部署

如果你想把游戏发布到公网让朋友一起玩，请按以下步骤操作：

### 1. 部署后端 (Cloudflare)
执行以下命令，将游戏逻辑与状态机一键发布到你的 Cloudflare Workers：
```bash
pnpm run deploy:worker
```

### 2. 部署前端
执行以下命令打包前端静态文件：
```bash
pnpm run build
```
打包完成后，产物会生成在 `dist/` 目录中。你可以将该目录直接托管至 Cloudflare Pages、Vercel 等任何静态网站托管平台。

## 📁 核心目录结构指南

- `src/` : 所有的 React 前端代码 (UI组件、页面路由、类型定义)
- `worker/` : 所有的 后端代码 (包含路由入口、核心游戏状态机 gameRoom)
- `RULES.md` : 游戏的详细规则设计文档
- `wrangler.jsonc` : Cloudflare 后端部署相关的配置文件