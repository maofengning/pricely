# Pricely - 基于价格行为学的裸K分析平台

国内专注价格行为学的裸K分析+模拟交易+策略复盘工具。

## 项目结构

```
pricely/
├── frontend/          # React + TypeScript + Vite 前端
│   ├── src/
│   │   ├── components/  # UI组件
│   │   ├── pages/       # 页面
│   │   ├── services/    # API调用
│   │   ├── stores/      # Zustand状态管理
│   │   ├── hooks/       # 自定义hooks
│   │   ├── utils/       # 工具函数
│   │   └── types/       # TypeScript类型定义
│   └── package.json
├── backend/           # FastAPI + Python 后端
│   ├── app/
│   │   ├── api/         # API路由
│   │   ├── models/      # SQLAlchemy ORM模型
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # 业务逻辑
│   │   ├── core/        # 配置、安全等核心模块
│   │   └── utils/       # 工具函数
│   └── pyproject.toml
├── docs/              # 项目文档
│   ├── pricely_prd_simple.md     # PRD需求文档
│   └── pricely-mvp-design.md     # MVP技术设计文档
├── .trellis/          # AI开发工作流
└── README.md
```

## 快速开始

### 前端

```bash
cd frontend
npm install
npm run dev     # 启动开发服务器 (http://localhost:5173)
```

### 后端

```bash
cd backend
uv sync                    # 安装依赖
uv run uvicorn app.main:app --reload  # 启动开发服务器
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript 5 + Vite |
| 图表库 | lightweight-charts 4.x |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS 4 |
| 后端框架 | FastAPI + Python 3.11 |
| ORM | SQLAlchemy 2.x |
| 数据库 | PostgreSQL 15 |
| 缓存 | Redis 7 |

## 文档

- [PRD需求文档](docs/pricely_prd_simple.md)
- [MVP技术设计](docs/pricely-mvp-design.md)
- [任务分解](.trellis/tasks/03-31-mvp-task-planning/task-breakdown.md)

## 开发进度

MVP开发进行中，详见 `.trellis/tasks/` 目录。