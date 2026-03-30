# Pricely MVP 开发设计文档

**日期：** 2026-03-31
**状态：** 已确认

---

## 一、设计决策汇总

| 项目 | 决策 |
|------|------|
| 开发节奏 | 按模块顺序开发 |
| 仓库结构 | Monorepo（`/frontend` + `/backend`） |
| 前端框架 | React 18 + TypeScript + Vite |
| 前端状态管理 | Zustand |
| 前端UI | 无第三方UI库，自定义组件 |
| 前端样式 | Tailwind CSS |
| 图表库 | lightweight-charts（TradingView开源版） |
| 后端框架 | FastAPI + Python 3.11+ |
| ORM | SQLAlchemy 2.x |
| 数据校验 | Pydantic 2.x |
| 数据库 | PostgreSQL 15.x |
| 缓存 | Redis 7.x |
| 认证模块 | 最小认证（注册/登录 + JWT） |
| 数据方案 | CSV 预置 + 模拟数据生成脚本 |
| 部署方案 | 本地开发，无 Docker |

---

## 二、目录结构

```
pricely/
├── frontend/                 # React + TypeScript
│   ├── src/
│   │   ├── components/       # UI组件
│   │   │   ├── Chart/        # 图表相关
│   │   │   ├── Pattern/      # 形态标注
│   │   │   ├── Trade/        # 模拟交易
│   │   │   ├── Log/          # 交易日志
│   │   │   ├── Auth/         # 认证相关
│   │   │   ├── Compliance/   # 合规提示
│   │   │   └── common/       # 通用组件
│   │   ├── pages/            # 页面
│   │   ├── services/         # API调用
│   │   ├── stores/           # Zustand状态
│   │   ├── hooks/            # 自定义hooks
│   │   ├── utils/            # 工具函数
│   │   ├── types/            # TypeScript类型
│   │   └── App.tsx           # 入口组件
│   │   └── main.tsx          # Vite入口
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
│
├── backend/                  # FastAPI + Python
│   ├── app/
│   │   ├── api/              # API路由
│   │   │   ├── auth.py       # 认证路由
│   │   │   ├── users.py      # 用户路由
│   │   │   ├── market.py     # 行情路由
│   │   │   ├── trade.py      # 交易路由
│   │   │   ├── logs.py       # 日志路由
│   │   │   ├── patterns.py   # 标注路由
│   │   │   ├── ai.py         # AI识别路由
│   │   │   └── compliance.py # 合规路由
│   │   ├── models/           # SQLAlchemy模型
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # 业务逻辑层
│   │   ├── core/             # 核心配置
│   │   │   ├── config.py     # 环境配置
│   │   │   ├── database.py   # 数据库连接
│   │   │   ├── security.py   # JWT/密码处理
│   │   │   └── redis.py      # Redis连接
│   │   └── utils/            # 工具函数
│   ├── data/                 # CSV数据文件
│   │   ├── stocks.json       # 股票列表
│   │   └── klines/           # K线CSV文件
│   ├── scripts/              # 数据生成脚本
│   │   └── generate_data.py  # 模拟数据生成器
│   ├── tests/                # 测试文件
│   ├── alembic/              # 数据库迁移
│   ├── requirements.txt
│   ├── alembic.ini
│   └── main.py               # FastAPI入口
│
├── docs/                     # 文档（已有）
├── .trellis/                 # Trellis配置（已有）
└── README.md
```

---

## 三、开发阶段规划

### Phase 1: 认证模块

**后端任务：**
- 用户表、资金表创建（Alembic迁移）
- 注册 API `/auth/register`
- 登录 API `/auth/login`
- JWT 令牌生成与验证
- 密码 bcrypt 加密

**前端任务：**
- 登录页面 `/login`
- 注册页面 `/register`
- 登录状态持久化（localStorage + Zustand）
- API 请求携带 JWT

**交付物：** 用户可注册、登录，获取 JWT 令牌

---

### Phase 2: 用户模块

**后端任务：**
- 用户信息 API `/users/me`
- 模拟资金初始化（注册时自动创建 ¥100,000）
- 资金查询 API `/trade/fund`
- 资金重置 API `/trade/fund/reset`

**前端任务：**
- 用户信息页面 `/profile`
- 资金显示组件
- 设置页面（资金重置）

**交付物：** 用户可查看信息、管理模拟资金

---

### Phase 3: 行情模块

**后端任务：**
- 股票列表 API `/market/stocks`
- K线数据 API `/market/kline`
- 多周期联动 API `/market/multi-period`
- 实时行情 API `/market/realtime`
- WebSocket 实时推送（模拟3秒更新）
- CSV 数据加载脚本
- Redis 缓存 K 线数据

**前端任务：**
- 股票选择器
- 轻量级 K 线图表组件（lightweight-charts）
- OHLC 信息显示
- 多周期联动面板
- K 线样式设置（颜色、粗细）
- WebSocket 连接管理

**交付物：** 用户可查看裸K图表、切换周期、看实时行情

---

### Phase 4: 支撑阻力识别

**后端任务：**
- 支撑阻力识别 API `/ai/support-resistance`（规则引擎）
- 整数关口 API `/ai/int-levels`
- 用户修正 API `/ai/correct-result`
- 识别结果存储表

**前端任务：**
- 支撑阻力绘制工具栏
- 斐波那契工具组件
- 整数关口显示
- 用户修正交互

**交付物：** AI自动识别支撑阻力，用户可绘制斐波那契

---

### Phase 5: 模拟交易模块

**后端任务：**
- 下单 API `/trade/order`（市价/限价）
- 持仓查询 API `/trade/position`
- 订单查询 API `/trade/orders`
- 限价单撮合逻辑（K线收盘价触发）
- 持仓盈亏计算
- WebSocket 订单成交通知

**前端任务：**
- 交易面板
- 下单表单（市价/限价切换）
- 持仓管理组件
- 订单列表组件

**交付物：** 用户可模拟买卖股票、查看持仓盈亏

---

### Phase 6: 交易日志模块

**后端任务：**
- 日志 CRUD API `/logs`
- 日志分类搜索 API
- 日志表创建

**前端任务：**
- 日志主页面
- 日志编辑弹窗
- 日志搜索/筛选组件
- 日志列表显示

**交付物：** 用户可记录交易日志、分类搜索

---

### Phase 7: 形态标注模块

**后端任务：**
- 标注 CRUD API `/patterns`
- 按周期查询 API `/patterns/by-period`
- 标注表创建

**前端任务：**
- 形态标注工具
- 形态编辑弹窗
- 形态列表侧边栏
- 周期选择器

**交付物：** 用户可手动标注价格形态、保存查看

---

### Phase 8: 合规提示与整合测试

**后端任务：**
- 风险提示 API `/compliance/risk-warning`
- 交易报表定时生成（日报/周报/月报）

**前端任务：**
- 风险提示横幅（首页）
- 风险提示弹窗（模拟交易页首次进入）
- 交易报表页面
- 整体导航布局
- 路由整合

**交付物：** MVP 完整可用，合规风险提示到位

---

## 四、技术依赖清单

### 后端 requirements.txt

```
fastapi>=0.100
uvicorn[standard]>=0.23
python-jose[cryptography]>=3.3  # JWT
passlib[bcrypt]>=1.7            # 密码加密
sqlalchemy>=2.0
psycopg2-binary>=2.9            # PostgreSQL
alembic>=1.12                   # 数据库迁移
pydantic>=2.0
redis>=4.5
python-multipart>=0.0.6         # 表单解析
```

### 前端 package.json 核心依赖

```json
{
  "dependencies": {
    "react": "^18.2",
    "react-dom": "^18.2",
    "react-router-dom": "^6.x",
    "zustand": "^4.x",
    "lightweight-charts": "^4.x",
    "axios": "^1.x",
    "socket.io-client": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

---

## 五、本地开发启动方式

### 后端启动

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head          # 数据库迁移
python scripts/generate_data.py  # 生成模拟数据
uvicorn main:app --reload --port 8000
```

### 前端启动

```bash
cd frontend
npm install
npm run dev    # Vite 开发服务器，默认 http://localhost:5173
```

### 数据库/Redis 启动（本地安装）

```bash
# PostgreSQL（本地安装或使用 Homebrew/Docker 单独启动）
pg_ctl -D /usr/local/var/postgres start

# Redis
redis-server
```

---

## 六、API 响应命名规范

| 层级 | 命名风格 | 示例 |
|------|----------|------|
| 数据库 | snake_case | `trade_count`, `win_rate` |
| API响应 | camelCase | `tradeCount`, `winRate` |
| API路径 | RESTful复数 | `/logs`, `/patterns` |
| TypeScript | camelCase | 与API响应一致 |

---

## 七、安全设计要点

- 密码：bcrypt 加密，加盐处理
- JWT：RS256 签名，accessToken 2小时，refreshToken 7天
- HTTPS：生产环境强制，开发环境可略过
- CORS：后端配置允许前端域名
- 输入校验：Pydantic 严格校验所有 API 输入
- SQL注入：SQLAlchemy ORM，禁止原生 SQL 拼接

---

## 八、后续迭代计划（不在本次 MVP）

| 功能 | 版本 |
|------|------|
| AI 自动形态识别 | v1.1 |
| 策略回测系统 | v1.2 |
| 专业复盘工具 | v1.2 |
| 真实行情数据源对接 | v1.3 |
| OAuth 登录 | v2.0 |

---

## 九、详细任务拆分（82 个任务）

### Phase 1: 认证模块（12 个任务）

| # | 任务 | 预估 | 类型 |
|---|------|------|------|
| 1 | 初始化后端项目结构（FastAPI + 目录结构 + pyproject.toml） | 1h | 后端 |
| 2 | 配置数据库连接（PostgreSQL + SQLAlchemy async） | 1h | 后端 |
| 3 | 创建用户表和资金表（Alembic 迁移） | 1h | 后端 |
| 4 | 实现密码加密和 JWT 工具函数 | 1h | 后端 |
| 5 | 实现注册 API `/auth/register` | 1h | 后端 |
| 6 | 实现登录 API `/auth/login` | 1h | 后端 |
| 7 | 初始化前端项目结构（React + Vite + Tailwind + TypeScript） | 1h | 前端 |
| 8 | 创建 Zustand userStore | 0.5h | 前端 |
| 9 | 实现登录页面 UI | 1h | 前端 |
| 10 | 实现注册页面 UI | 1h | 前端 |
| 11 | 实现 API 请求拦截器（axios + JWT） | 1h | 前端 |
| 12 | 实现路由守卫 | 0.5h | 前端 |

### Phase 2: 用户模块（6 个任务）

| # | 任务 | 预估 | 类型 |
|---|------|------|------|
| 13 | 实现用户信息 API `/users/me` | 0.5h | 后端 |
| 14 | 实现资金查询 API `/trade/fund` | 0.5h | 后端 |
| 15 | 实现资金重置 API `/trade/fund/reset` | 0.5h | 后端 |
| 16 | 实现用户信息页面 UI | 1h | 前端 |
| 17 | 实现资金显示组件 | 0.5h | 前端 |
| 18 | 实现设置页面（资金重置） | 1h | 前端 |

### Phase 3: 行情模块（15 个任务）

| # | 任务 | 预估 | 类型 |
|---|------|------|------|
| 19 | 生成模拟数据脚本（50只股票 CSV） | 2h | 后端 |
| 20 | 实现股票列表 API `/market/stocks` | 0.5h | 后端 |
| 21 | 实现 K 线数据 API `/market/kline` | 1h | 后端 |
| 22 | 实现多周期联动 API `/market/multi-period` | 1h | 后端 |
| 23 | 配置 Redis 连接和 K 线缓存 | 1h | 后端 |
| 24 | 实现实时行情 API `/market/realtime` | 0.5h | 后端 |
| 25 | 实现 WebSocket 服务端 | 2h | 后端 |
| 26 | 创建基础图表组件（lightweight-charts） | 2h | 前端 |
| 27 | 创建 OHLC 信息显示组件 | 0.5h | 前端 |
| 28 | 创建股票选择器组件 | 1h | 前端 |
| 29 | 创建多周期联动面板 | 1h | 前端 |
| 30 | 创建 K 线样式设置面板 | 1h | 前端 |
| 31 | 实现 WebSocket 客户端 Hook | 1h | 前端 |
| 32 | 实现 WebSocket 服务层 | 1h | 前端 |
| 33 | 整合行情页面 | 1h | 前端 |

### Phase 4: 支撑阻力识别（11 个任务）

| # | 任务 | 预估 | 类型 |
|---|------|------|------|
| 34 | 创建支撑阻力表（sr_levels, int_levels） | 0.5h | 后端 |
| 35 | 实现波段高低点识别算法 | 1h | 后端 |
| 36 | 实现水平支撑阻力识别算法 | 1h | 后端 |
| 37 | 实现整数关口识别算法 | 0.5h | 后端 |
| 38 | 实现支撑阻力识别 API `/ai/support-resistance` | 1h | 后端 |
| 39 | 实现整数关口 API `/ai/int-levels` | 0.5h | 后端 |
| 40 | 实现用户修正 API `/ai/correct-result` | 0.5h | 后端 |
| 41 | 实现斐波那契计算工具函数 | 0.5h | 后端 |
| 42 | 创建支撑阻力绘制工具栏 UI | 2h | 前端 |
| 43 | 创建斐波那契工具 UI | 1h | 前端 |
| 44 | 创建整数关口显示组件 | 0.5h | 前端 |

### Phase 5: 模拟交易模块（12 个任务）

| # | 任务 | 预估 | 类型 |
|---|------|------|------|
| 45 | 创建订单表和持仓表（Alembic 迁移） | 0.5h | 后端 |
| 46 | 实现市价单下单 API | 1h | 后端 |
| 47 | 实现限价单下单 API | 1h | 后端 |
| 48 | 实现限价单撮合逻辑 | 2h | 后端 |
| 49 | 实现持仓查询 API `/trade/position` | 0.5h | 后端 |
| 50 | 实现订单查询 API `/trade/orders` | 0.5h | 后端 |
| 51 | 实现持仓盈亏计算 | 1h | 后端 |
| 52 | WebSocket 订单成交通知 | 1h | 后端 |
| 53 | 创建交易面板布局 | 1h | 前端 |
| 54 | 创建下单表单组件 | 1.5h | 前端 |
| 55 | 创建持仓管理组件 | 1h | 前端 |
| 56 | 创建订单列表组件 | 1h | 前端 |

### Phase 6: 交易日志模块（8 个任务）

| # | 任务 | 预估 | 类型 |
|---|------|------|------|
| 57 | 创建交易日志表 | 0.5h | 后端 |
| 58 | 实现日志 CRUD API `/logs` | 1.5h | 后端 |
| 59 | 实现日志分类搜索 API | 1h | 后端 |
| 60 | 创建日志主页面 | 1h | 前端 |
| 61 | 创建日志编辑弹窗 | 1h | 前端 |
| 62 | 创建日志搜索筛选组件 | 1h | 前端 |
| 63 | 创建日志列表组件 | 0.5h | 前端 |
| 64 | 整合日志页面 | 0.5h | 前端 |

### Phase 7: 形态标注模块（9 个任务）

| # | 任务 | 预估 | 类型 |
|---|------|------|------|
| 65 | 创建形态标注表 | 0.5h | 后端 |
| 66 | 实现标注 CRUD API `/patterns` | 1.5h | 后端 |
| 67 | 实现按周期查询 API `/patterns/by-period` | 0.5h | 后端 |
| 68 | 创建形态标注工具 UI（图表交互） | 2h | 前端 |
| 69 | 创建形态编辑弹窗 | 1h | 前端 |
| 70 | 创建形态列表侧边栏 | 1h | 前端 |
| 71 | 创建周期选择器组件 | 0.5h | 前端 |
| 72 | 整合标注功能到图表页 | 1h | 前端 |

### Phase 8: 合规提示与整合（10 个任务）

| # | 任务 | 预估 | 类型 |
|---|------|------|------|
| 73 | 实现风险提示 API `/compliance/risk-warning` | 0.5h | 后端 |
| 74 | 创建交易报表表 | 0.5h | 后端 |
| 75 | 实现报表生成定时任务 | 1.5h | 后端 |
| 76 | 实现报表查询 API `/trade/report` | 0.5h | 后端 |
| 77 | 创建风险提示横幅组件 | 0.5h | 前端 |
| 78 | 创建风险提示弹窗组件 | 0.5h | 前端 |
| 79 | 创建交易报表页面 | 1h | 前端 |
| 80 | 创建主导航布局（Header + Sidebar） | 1.5h | 前端 |
| 81 | 整合所有路由 | 1h | 前端 |
| 82 | 端到端测试与修复 | 2h | 测试 |

---

### 任务统计

| 指标 | 数值 |
|------|------|
| **总任务数** | 82 个 |
| **预估总工时** | ~85 小时 |
| **后端任务** | 40 个 |
| **前端任务** | 42 个 |