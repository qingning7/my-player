# My Player

一个前端播放器 + 后端代理 + 网易云api

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 一键启动（推荐）
```bash
npm run dev:all
```
会同时启动：
- NCM API（`services/ncm-api`）
- Nest 后端（`server`）
- 前端 Vite（默认 `http://localhost:5173`）

## 访问地址
- 前端：`http://localhost:5173`
- 后端：`http://localhost:3000`
- NCM API：`http://localhost:3001`

## 说明
- 前端通过 `GET /netease/*` 走后端代理访问 NCM API。
- 部分歌曲可能没有可用播放源，会提示无法播放。

