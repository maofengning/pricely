# T7-02: 交易日志 - 前端界面

## Goal
实现交易日志管理界面。

## Requirements
### 组件
- TradeLog.tsx — 日志主界面
- LogEntry.tsx — 单条日志条目
- LogSearch.tsx — 搜索组件
- LogFilter.tsx — 筛选组件
- LogEditor.tsx — 编辑弹窗

### 功能
- 日志列表虚拟滚动
- 多条件筛选搜索（tags, stock_code, 时间范围）
- 日志详情查看

## Acceptance Criteria
- [ ] 日志可创建、编辑、删除
- [ ] 筛选搜索功能正常
- [ ] 虚拟滚动支持大量数据
- [ ] lint/typecheck 通过

## Technical Notes
- 依赖 T7-01 (log-api) 的 REST API
- frontend 模块，遵循 frontend guidelines
