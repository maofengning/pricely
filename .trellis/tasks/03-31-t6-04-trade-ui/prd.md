# T6-04: 模拟交易 - 前端界面

## Goal
实现模拟交易完整界面。

## Requirements
### 组件
- TradePanel.tsx — 交易面板
- OrderForm.tsx — 下单表单（市价/限价选择）
- PositionManager.tsx — 持仓管理
- OrderBook.tsx — 订单列表
- FundManager.tsx — 资金管理（含重置）
- TradeReport.tsx — 交易报表展示

### 功能
- 下单表单验证
- 实时持仓盈亏显示
- WebSocket 成交通知处理
- 报表图表展示

## Acceptance Criteria
- [ ] 用户可下单、查看持仓
- [ ] 实时盈亏更新
- [ ] 交易报表正确展示
- [ ] lint/typecheck 通过

## Technical Notes
- 依赖 T6-01 (trade-api) 的 REST API
- 依赖 T2-02 (market-ws) 的 WebSocket
- frontend 模块，遵循 frontend guidelines
