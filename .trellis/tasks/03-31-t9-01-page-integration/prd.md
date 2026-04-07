# T9-01: 前端页面集成

## Goal
完成前端页面的路由集成和布局整合，确保所有主要页面（Home/Trade/Log/Report）通过 Header 和 Sidebar 正确导航。

## Requirements
1. 添加独立的 Report 页面路由，复用 TradeReport 组件
2. 更新 Sidebar 导航添加"交易报表"入口
3. 确保所有页面布局使用统一的 MainLayout（Header + Sidebar）
4. 保持现有页面功能不变

## Acceptance Criteria
- [ ] Report 页面路由 `/report` 已添加
- [ ] Report 页面组件已创建，复用 TradeReport
- [ ] Sidebar 导航包含"交易报表"项
- [ ] 所有页面使用统一布局结构
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过

## Technical Notes
- Report 页面复用 `TradeReport` 组件
- 使用 RiskWarningBanner 提供合规提示
- 保持与现有页面一致的布局风格