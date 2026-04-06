# Market WebSocket Implementation

## Goal
实现行情 WebSocket，推送实时价格更新。

## Requirements

### 功能需求
1. **WebSocket 连接** `/ws/market` - 建立实时连接
2. **订阅股票** - 客户端可订阅指定股票的价格更新
3. **实时推送** - 服务端推送价格变动信息
4. **心跳机制** - 保持连接活跃

### 消息格式
```json
// 订阅
{"action": "subscribe", "stock_code": "600519"}
// 推送
{"type": "price_update", "stock_code": "600519", "price": 1850.50, "time": "2024-01-01T10:00:00"}
```

### 技术约束
- 使用 FastAPI WebSocket
- 连接管理: 支持多客户端
- 使用 Redis pub/sub 或内存存储

## Acceptance Criteria
- [ ] WebSocket 连接建立成功
- [ ] 订阅/取消订阅功能正常
- [ ] 价格推送正常工作
- [ ] 心跳机制实现
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 FastAPI WebSocket 文档
- 考虑使用 ConnectionManager 管理连接