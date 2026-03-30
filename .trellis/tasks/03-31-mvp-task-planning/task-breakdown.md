# MVP Task Planning - 详细任务分解

## 任务分解策略

按模块分解，每个任务包含前后端全部实现。任务间有依赖关系，需按顺序执行。

---

## Phase 0: 项目基础设施 (Infrastructure)

### T0-01: 项目脚手架搭建
**优先级**: P0 | **类型**: fullstack | **估时**: 1天

**目标**: 建立前后端项目基础结构

**前端**:
- 初始化 React + TypeScript + Vite 项目
- 配置 Tailwind CSS
- 配置 ESLint + Prettier
- 配置目录结构（components/pages/services/stores/hooks/types）

**后端**:
- 初始化 FastAPI 项目结构
- 配置 SQLAlchemy + Pydantic
- 配置环境变量管理
- 配置日志系统

**验收标准**:
- [ ] 前端项目可启动，显示空白页面
- [ ] 后端项目可启动，访问 /docs 显示 API 文档
- [ ] lint/typecheck 通过

---

### T0-02: Docker + 开发环境配置
**优先级**: P0 | **类型**: infra | **估时**: 0.5天

**目标**: 配置本地开发环境

**内容**:
- 编写 docker-compose.yml（frontend/backend/postgres/redis/nginx）
- 配置开发环境环境变量
- 编写 Makefile 常用命令

**验收标准**:
- [ ] docker-compose up 可启动全部服务
- [ ] 前端可访问后端 API
- [ ] PostgreSQL 和 Redis 连接正常

---

### T0-03: 数据库 Schema 初始化
**优先级**: P0 | **类型**: backend | **估时**: 1天 | **依赖**: T0-01

**目标**: 创建所有数据库表结构

**内容**:
- 创建枚举类型（period_enum, pattern_enum, level_type_enum, order_type_enum 等）
- 创建用户相关表（users, funds）
- 创建交易相关表（positions, orders, trade_reports）
- 创建日志相关表（trade_logs）
- 创建标注相关表（pattern_marks）
- 创建AI识别相关表（sr_levels, int_levels）
- 编写 SQLAlchemy ORM 模型

**验收标准**:
- [ ] 所有表创建成功
- [ ] ORM 模型与表结构一致
- [ ] 外键关系正确

---

### T0-04: 预置数据加载
**优先级**: P0 | **类型**: backend | **估时**: 0.5天 | **依赖**: T0-03

**目标**: 加载模拟行情数据

**内容**:
- 准备股票列表 JSON 文件（50只A股热门）
- 准备K线历史数据 CSV 文件
- 编写数据加载脚本
- 启动时加载入 PostgreSQL 和 Redis

**验收标准**:
- [ ] 50只股票数据加载成功
- [ ] K线数据可通过 API 查询
- [ ] Redis 缓存热点数据

---

## Phase 1: 核心认证与用户模块

### T1-01: 认证模块 - 后端 API
**优先级**: P0 | **类型**: backend | **估时**: 1天 | **依赖**: T0-03

**目标**: 实现用户认证后端逻辑

**API**:
- POST /auth/register — 用户注册
- POST /auth/login — 用户登录，返回 JWT
- POST /auth/refresh — 刷新令牌
- POST /auth/logout — 登出

**内容**:
- 密码 bcrypt 加盐哈希
- JWT 生成与验证（RS256）
- Redis 存储 session
- 注册时自动创建 funds 记录（初始资金 ¥100,000）

**验收标准**:
- [ ] 注册、登录、刷新令牌 API 通过测试
- [ ] JWT 有效期：accessToken 2小时，refreshToken 7天
- [ ] 新用户自动获得初始资金

---

### T1-02: 认证模块 - 前端界面
**优先级**: P0 | **类型**: frontend | **估时**: 1天 | **依赖**: T1-01

**目标**: 实现用户认证前端界面

**组件**:
- LoginForm.tsx — 登录表单
- RegisterForm.tsx — 注册表单
- UserProfile.tsx — 用户信息页
- Settings.tsx — 用户设置（含资金重置）

**状态管理**:
- userStore.ts — 用户状态、JWT 存储
- useAuth.ts hook — 登录/登出/刷新逻辑

**验收标准**:
- [ ] 用户可注册、登录
- [ ] JWT 自动存储和刷新
- [ ] 登录后显示用户信息

---

## Phase 2: 行情数据模块

### T2-01: 行情模块 - 后端 API
**优先级**: P0 | **类型**: backend | **估时**: 1.5天 | **依赖**: T0-04

**目标**: 实现行情数据 API

**REST API**:
- GET /market/kline — 获取单周期K线
- GET /market/multi-period — 获取多周期K线（联动）
- GET /market/realtime — 获取实时行情
- GET /market/stocks — 获取股票列表

**WebSocket**:
- ws://market/stream — 实时行情推送（模拟每3秒）
- 事件：subscribe, unsubscribe, price_update, kline_update

**内容**:
- Redis 缓存K线数据（5min TTL）
- 多周期并行查询
- 实时行情模拟逻辑（±0.5% 随机波动）
- WebSocket 心跳检测（30秒）

**验收标准**:
- [ ] 所有 REST API 通过测试
- [ ] WebSocket 连接、订阅、推送正常
- [ ] 多周期查询响应时间 < 2秒

---

### T2-02: 行情模块 - WebSocket 前端集成
**优先级**: P0 | **类型**: frontend | **估时**: 1天 | **依赖**: T2-01

**目标**: 前端 WebSocket 连接管理

**内容**:
- websocket.ts service — 连接管理、订阅/取消订阅
- useWebSocket.ts hook — WebSocket 状态管理
- 实时价格更新处理

**验收标准**:
- [ ] WebSocket 自动连接认证
- [ ] 订阅股票后接收实时推送
- [ ] 断线自动重连

---

## Phase 3: 图表可视化模块

### T3-01: 裸K图表基础组件
**优先级**: P0 | **类型**: frontend | **估时**: 2天 | **依赖**: T2-01

**目标**: 实现 lightweight-charts K线图集成

**组件**:
- ChartContainer.tsx — 图表容器
- CandleChart.tsx — K线图主体（集成 lightweight-charts）
- OHLCDisplay.tsx — OHLC 信息展示
- ChartStyleSettings.tsx — K线样式设置（阴阳柱颜色、影线粗细）

**内容**:
- lightweight-charts 配置与初始化
- K线数据加载与渲染
- 响应式尺寸调整
- 样式配置存储（localStorage）

**验收标准**:
- [ ] K线图正常显示
- [ ] OHLC 信息实时更新
- [ ] K线样式可自定义

---

### T3-02: 多周期联动面板
**优先级**: P0 | **类型**: frontend | **估时**: 1天 | **依赖**: T3-01

**目标**: 实现多周期联动显示

**组件**:
- MultiPeriodPanel.tsx — 多周期面板
- PeriodSelector.tsx — 周期选择器

**周期**: 1min, 5min, 15min, 60min, daily, weekly, monthly

**内容**:
- 多周期并行加载
- 时间轴对齐
- 周期切换动画

**验收标准**:
- [ ] 7个周期可选
- [ ] 多周期同步显示
- [ ] 时间轴联动对齐

---

## Phase 4: 支撑阻力识别模块

### T4-01: AI支撑阻力识别 - 后端算法
**优先级**: P0 | **类型**: backend | **估时**: 2天 | **依赖**: T0-04

**目标**: 实现规则引擎支撑阻力识别算法

**API**:
- POST /ai/support-resistance — 自动识别支撑阻力
- GET /ai/int-levels — 计算整数关口
- POST /ai/correct-result — 用户修正识别结果

**算法**:
- 波段高低点识别（局部极值，window=5）
- 水平支撑阻力（多次触及价位聚类）
- 整数关口识别（10.00, 15.00 等）
- 强度评分（触及次数 + 最近触及时间）

**内容**:
- 结果缓存 Redis（1小时 TTL）
- PostgreSQL 存储 sr_levels, int_levels
- 用户修正标记

**验收标准**:
- [ ] 识别响应时间 < 2秒
- [ ] 识别准确率 >= 85%（手动测试）
- [ ] 用户可修正结果

---

### T4-02: 支撑阻力绘制工具 - 前端
**优先级**: P0 | **类型**: frontend | **估时**: 1.5天 | **依赖**: T4-01, T3-01

**目标**: 图表上显示和编辑支撑阻力

**组件**:
- SupportResistanceTools.tsx — 工具栏
- PriceLevelMarker.tsx — 价格位标注组件
- FibonacciTools.tsx — 斐波那契工具

**内容**:
- AI识别结果渲染到图表
- 手动添加/删除支撑阻力线
- 斐波那契回调/扩展绘制
- 整数关口标注显示

**验收标准**:
- [ ] AI识别结果自动显示
- [ ] 用户可手动添加支撑阻力
- [ ] 斐波那契工具可用

---

## Phase 5: 价格形态标注模块

### T5-01: 形态标注 - 后端 API
**优先级**: P0 | **类型**: backend | **估时**: 1天 | **依赖**: T0-03

**目标**: 形态标注 CRUD API

**API**:
- POST /patterns — 创建形态标注
- GET /patterns — 查询标注列表
- GET /patterns/{id} — 查询标注详情
- PUT /patterns/{id} — 更新标注
- DELETE /patterns/{id} — 删除标注
- GET /patterns/by-period — 按周期查询

**形态类型**: Pin Bar, 吞没形态, 黄昏星, 黎明星, 十字星, 头肩顶/底

**验收标准**:
- [ ] 所有 CRUD API 通过测试
- [ ] 支持按周期过滤查询
- [ ] 标注关联正确的 K 线时间范围

---

### T5-02: 形态标注工具 - 前端
**优先级**: P0 | **类型**: frontend | **估时**: 1.5天 | **依赖**: T5-01, T3-01

**目标**: 图表上标注和管理形态

**组件**:
- PatternMarker.tsx — 形态标注工具
- PatternList.tsx — 形态列表侧边栏
- PatternEditor.tsx — 形态编辑弹窗

**内容**:
- 在图表上选择 K 线范围标注形态
- 形态标记显示（图标/颜色区分）
- 形态列表管理（查看/编辑/删除）

**验收标准**:
- [ ] 可选择 K 线范围创建标注
- [ ] 7种形态类型可选
- [ ] 标注可保存、编辑、删除

---

## Phase 6: 模拟交易模块

### T6-01: 模拟交易 - 后端 API
**优先级**: P0 | **类型**: backend | **估时**: 2天 | **依赖**: T1-01, T2-01

**目标**: 模拟交易核心逻辑

**API**:
- POST /trade/order — 下单（市价/限价）
- DELETE /trade/order/{id} — 取消订单
- GET /trade/orders — 查询订单列表
- GET /trade/position — 查询当前持仓
- GET /trade/fund — 查询资金信息
- POST /trade/fund/reset — 重置模拟资金
- GET /trade/report — 查询交易报表

**逻辑**:
- 市价单立即成交
- 限价单等待撮合（WebSocket 价格触发）
- 持仓计算（avg_cost, profit_loss）
- 资金冻结/解冻

**验收标准**:
- [ ] 市价单成交逻辑正确
- [ ] 限价单撮合逻辑正确
- [ ] 持仓、资金计算准确

---

### T6-02: 限价单撮合引擎
**优先级**: P0 | **类型**: backend | **估时**: 1天 | **依赖**: T6-01, T2-01

**目标**: WebSocket 价格触发限价单撮合

**内容**:
- 每次 WebSocket 推送检查 pending 订单
- 买入限价单：当前价格 ≤ 限价 → 成交
- 卖出限价单：当前价格 ≥ 限价 → 成交
- 推送 order_filled 事件通知前端

**验收标准**:
- [ ] 限价单在价格触及时自动成交
- [ ] WebSocket 推送成交通知
- [ ] 撮合检查频率每3秒

---

### T6-03: 交易报表计算
**优先级**: P0 | **类型**: backend | **估时**: 0.5天 | **依赖**: T6-01

**目标**: 定时生成交易报表

**内容**:
- 日报：每日凌晨 0:05 生成
- 周报：每周一凌晨 0:05 生成
- 月报：每月 1 日凌晨 0:05 生成
- 计算胜率、盈亏比、最大回撤

**验收标准**:
- [ ] 报表定时生成正常
- [ ] 胜率、最大回撤计算正确

---

### T6-04: 模拟交易 - 前端界面
**优先级**: P0 | **类型**: frontend | **估时**: 2天 | **依赖**: T6-01, T2-02

**目标**: 模拟交易完整界面

**组件**:
- TradePanel.tsx — 交易面板
- OrderForm.tsx — 下单表单（市价/限价选择）
- PositionManager.tsx — 持仓管理
- OrderBook.tsx — 订单列表
- FundManager.tsx — 资金管理（含重置）
- TradeReport.tsx — 交易报表展示

**内容**:
- 下单表单验证
- 实时持仓盈亏显示
- WebSocket 成交通知处理
- 报表图表展示

**验收标准**:
- [ ] 用户可下单、查看持仓
- [ ] 实时盈亏更新
- [ ] 交易报表正确展示

---

## Phase 7: 交易日志模块

### T7-01: 交易日志 - 后端 API
**优先级**: P0 | **类型**: backend | **估时**: 1天 | **依赖**: T0-03

**目标**: 交易日志 CRUD API

**API**:
- POST /logs — 创建交易日志
- GET /logs — 查询日志列表（支持筛选）
- GET /logs/{id} — 查询日志详情
- PUT /logs/{id} — 更新日志
- DELETE /logs/{id} — 删除日志

**筛选**: tags, stock_code, 时间范围

**验收标准**:
- [ ] 所有 CRUD API 通过测试
- [ ] 支持多条件筛选
- [ ] 支持标签数组存储

---

### T7-02: 交易日志 - 前端界面
**优先级**: P0 | **类型**: frontend | **估时**: 1天 | **依赖**: T7-01

**目标**: 交易日志管理界面

**组件**:
- TradeLog.tsx — 日志主界面
- LogEntry.tsx — 单条日志条目
- LogSearch.tsx — 搜索组件
- LogFilter.tsx — 筛选组件
- LogEditor.tsx — 编辑弹窗

**内容**:
- 日志列表虚拟滚动
- 多条件筛选搜索
- 日志详情查看

**验收标准**:
- [ ] 日志可创建、编辑、删除
- [ ] 筛选搜索功能正常
- [ ] 虚拟滚动支持大量数据

---

## Phase 8: 合规风险提示模块

### T8-01: 合规风险提示 - 后端
**优先级**: P0 | **类型**: backend | **估时**: 0.5天

**目标**: 风险提示内容 API

**API**:
- GET /compliance/risk-warning — 获取风险提示内容

**内容**:
- 配置风险提示文案（title, content）
- 支持不同场景（首页、模拟交易页）

**验收标准**:
- [ ] API 返回正确的提示内容

---

### T8-02: 合规风险提示 - 前端
**优先级**: P0 | **类型**: frontend | **估时**: 0.5天 | **依赖**: T8-01

**目标**: 风险提示组件

**组件**:
- RiskWarningBanner.tsx — 风险提示横幅（首页）
- RiskWarningModal.tsx — 风险提示弹窗（模拟交易页首次进入）
- WarningContent.tsx — 提示内容组件

**验收标准**:
- [ ] 首页显示风险提示横幅
- [ ] 模拟交易页首次进入显示弹窗
- [ ] 用户确认后可继续操作

---

## Phase 9: 集成与测试

### T9-01: 前端页面集成
**优先级**: P0 | **类型**: frontend | **估时**: 1天 | **依赖**: All phases

**目标**: 页面路由和布局集成

**页面**:
- Home.tsx — 首页（图表 + 形态标注）
- Trade.tsx — 模拟交易页
- Log.tsx — 交易日志页
- Report.tsx — 报表页
- Login.tsx — 登录页
- Register.tsx — 注册页

**布局**:
- Header.tsx — 导航栏
- Sidebar.tsx — 侧边栏

**验收标准**:
- [ ] 所有页面路由正常
- [ ] 导航栏、侧边栏正常显示

---

### T9-02: 端到端测试
**优先级**: P0 | **类型**: test | **估时**: 2天 | **依赖**: T9-01

**目标**: 完整功能测试

**测试场景**:
- 用户注册 → 登录 → 查看图表 → 标注形态 → 下单 → 查看持仓 → 记录日志 → 查看报表
- 多周期联动测试
- WebSocket 实时行情测试
- 限价单撮合测试

**验收标准**:
- [ ] 核心流程全部通过
- [ ] 边缘场景覆盖

---

## Phase 10: 部署上线

### T10-01: 生产环境部署配置
**优先级**: P0 | **类型**: infra | **估时**: 1天 | **依赖**: T9-02

**目标**: 生产环境 Docker 配置

**内容**:
- 生产环境 docker-compose.yml
- Nginx 配置（SSL、反向代理、静态资源）
- 环境变量配置（生产数据库、Redis）
- 前端构建优化

**验收标准**:
- [ ] 生产环境部署成功
- [ ] HTTPS 正常
- [ ] 前端静态资源正常加载

---

## 任务依赖图

```
T0-01 (脚手架)
  ├─→ T0-02 (Docker)
  ├─→ T0-03 (DB Schema) ─→ T0-04 (预置数据)
  │                         │
  │                         ├─→ T2-01 (行情API) ─→ T2-02 (WebSocket前端)
  │                         │                         │
  │                         │                         ├─→ T3-01 (图表基础) ─→ T3-02 (多周期)
  │                         │                         │
  │                         │                         ├─→ T4-02 (支撑阻力前端)
  │                         │                         │
  │                         │                         └─→ T5-02 (形态标注前端)
  │                         │
  │                         └─→ T4-01 (AI算法) ─→ T4-02
  │
  └─→ T0-03 ─→ T1-01 (认证API) ─→ T1-02 (认证前端)
  │                         │
  │                         ├─→ T6-01 (交易API) ─→ T6-02 (撮合) ─→ T6-04 (交易前端)
  │                         │                         │
  │                         │                         └─→ T6-03 (报表)
  │                         │
  │                         └─→ T7-01 (日志API) ─→ T7-02 (日志前端)
  │
  └─→ T0-03 ─→ T5-01 (形态API) ─→ T5-02
  │
  └─→ T8-01 (合规API) ─→ T8-02 (合规前端)

All ─→ T9-01 (页面集成) ─→ T9-02 (E2E测试) ─→ T10-01 (部署)
```

---

## 任务统计

| Phase | 任务数 | 估时 |
|-------|--------|------|
| Phase 0 基础设施 | 4 | 3天 |
| Phase 1 认证模块 | 2 | 2天 |
| Phase 2 行情模块 | 2 | 2.5天 |
| Phase 3 图表模块 | 2 | 3天 |
| Phase 4 支撑阻力 | 2 | 3.5天 |
| Phase 5 形态标注 | 2 | 2.5天 |
| Phase 6 模拟交易 | 4 | 5.5天 |
| Phase 7 交易日志 | 2 | 2天 |
| Phase 8 合规提示 | 2 | 1天 |
| Phase 9 集成测试 | 2 | 3天 |
| Phase 10 部署 | 1 | 1天 |
| **总计** | **23** | **26天** |

---

## 建议执行顺序

1. **Week 1**: T0-01 ~ T0-04, T1-01, T1-02 (基础设施 + 认证)
2. **Week 2**: T2-01, T2-02, T3-01, T3-02 (行情 + 图表基础)
3. **Week 3**: T4-01, T4-02, T5-01, T5-02 (支撑阻力 + 形态标注)
4. **Week 4**: T6-01 ~ T6-04 (模拟交易核心)
5. **Week 5**: T7-01, T7-02, T8-01, T8-02 (日志 + 合规)
6. **Week 6**: T9-01, T9-02, T10-01 (集成测试 + 部署)

---

## 下一步行动

确认此任务分解方案后，我将：
1. 为每个任务创建 `.trellis/tasks/` 目录下的 task.json
2. 设置任务间的依赖关系
3. 准备开始执行第一个任务（T0-01 项目脚手架）