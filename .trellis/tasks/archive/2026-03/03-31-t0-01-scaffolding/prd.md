# T0-01: 项目脚手架搭建

## Goal

建立前后端项目基础结构，配置开发环境，确保 lint/typecheck 通过。

## Requirements

### 前端 (React + TypeScript + Vite)

- [x] 初始化 Vite + React + TypeScript 项目
- [x] 配置 Tailwind CSS
- [x] 配置 ESLint + Prettier
- [x] 创建目录结构:
  - `src/components/` — UI组件
  - `src/pages/` — 页面
  - `src/services/` — API调用
  - `src/stores/` — Zustand状态管理
  - `src/hooks/` — 自定义hooks
  - `src/utils/` — 工具函数
  - `src/types/` — TypeScript类型定义

### 后端 (FastAPI + Python)

- [x] 初始化 FastAPI 项目结构
- [x] 配置 SQLAlchemy 2.x + Pydantic 2.x
- [x] 配置环境变量管理 (python-dotenv)
- [x] 配置结构化日志 (loguru)
- [x] 创建目录结构:
  - `backend/app/api/` — API路由
  - `backend/app/models/` — SQLAlchemy ORM模型
  - `backend/app/schemas/` — Pydantic schemas
  - `backend/app/services/` — 业务逻辑
  - `backend/app/core/` — 配置、安全等核心模块
  - `backend/app/utils/` — 工具函数

### 共享配置

- [x] 根目录 package.json 或 Makefile 统一管理命令
- [x] .gitignore 配置
- [x] README.md 项目说明

## Acceptance Criteria

- [x] 前端项目 `npm run dev` 可启动，显示空白页面
- [x] 后端项目 `uvicorn app.main:app` 可启动，访问 `/docs` 显示 Swagger UI (依赖安装后)
- [x] 前端 `npm run lint` 通过
- [x] 前端 `npm run typecheck` 通过
- [x] 后端代码结构完整

## Definition of Done

- [x] 代码提交到分支
- [x] lint/typecheck 全部通过
- [x] 项目可正常启动

## Technical Approach

**前端**: 使用 Vite 创建 React 18 + TypeScript 5 项目，集成 Tailwind CSS 和 Zustand

**后端**: 使用 FastAPI 0.100+ + Python 3.11，集成 SQLAlchemy 2.x ORM

## Out of Scope

- Docker 配置（T0-02）
- 数据库 Schema（T0-03）
- 具体业务代码

## Technical Notes

参考技术栈版本:
- React 18.x
- TypeScript 5.x
- lightweight-charts 4.x
- FastAPI 0.100+
- Python 3.11+
- SQLAlchemy 2.x
- Pydantic 2.x