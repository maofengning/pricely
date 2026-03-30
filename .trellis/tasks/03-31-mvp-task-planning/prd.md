# MVP Task Planning

## Goal

基于 PRD 和设计文档，将 Pricely MVP 功能拆分成可执行的开发任务列表，便于后续迭代开发。

## What I already know

### 产品定位
- 基于价格行为学的裸K分析+模拟交易+策略复盘工具
- 纯工具属性，无实盘交易，无投资建议

### MVP核心功能（P0）
1. 极简裸K可视化引擎（多周期联动、K线样式自定义）
2. 智能支撑阻力识别（AI自动识别、斐波那契工具、整数关口）
3. 基础价格形态标注（手动标注、保存编辑删除）
4. 模拟交易功能（市价/限价下单、持仓管理、资金管理、交易报表）
5. 基础交易日志（交易记录、分类搜索）
6. 合规风险提示（首页、模拟交易页提示）

### 技术栈
- 前端：React 18 + TypeScript 5 + lightweight-charts 4 + Zustand + Tailwind CSS
- 后端：FastAPI + Python 3.11+ + SQLAlchemy 2 + Pydantic 2
- 数据库：PostgreSQL 15 + Redis 7
- 部署：Docker + Nginx

### MVP特殊约束
- 行情数据：使用预置历史数据，不接入真实行情源
- AI识别：规则引擎算法，不使用ML模型

### 已完成工作
- 开发指南已填充（frontend/backend guidelines）
- 技术设计文档已完成

## Decision (ADR-lite)

**Context**: 需确定任务分解策略，便于后续迭代开发跟踪
**Decision**: 采用按模块分解策略，每个功能模块作为一个任务单元
**Consequences**: 约15-20个任务，每个任务包含前后端全部实现，便于进度跟踪和功能验收

## Requirements

将 MVP 功能拆分为：
- 独立可测试的任务单元
- 明确的依赖关系
- 合理的优先级顺序

## Out of Scope

- P1/P2/P3 功能（后续迭代）
- 实盘交易相关
- 成交量分析
- ML模型开发

## Technical Notes

### 前端模块（设计文档 2.2）
- Chart、Pattern、Trade、Log、Auth、Compliance、Data Service

### 后端模块（设计文档 2.3）
- Auth、Market、Trade、Log、Pattern、AI、Compliance

### 数据库表
- users, funds, positions, orders, trade_reports, trade_logs, pattern_marks, sr_levels, int_levels

### API 模块
- 7个模块，约25个API端点