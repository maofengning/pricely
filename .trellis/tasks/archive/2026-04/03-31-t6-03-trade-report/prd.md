# T6-03: 交易报表计算

## Goal
定时生成交易报表（日/周/月报）。

## Requirements
- 日报：每日凌晨 0:05 生成
- 周报：每周一凌晨 0:05 生成
- 月报：每月 1 日凌晨 0:05 生成
- 计算胜率、盈亏比、最大回撤

## Acceptance Criteria
- [ ] 报表定时生成正常
- [ ] 胜率、最大回撤计算正确

## Technical Notes
- 依赖 T6-01 (trade-api) 的交易数据
- backend 模块，使用 APScheduler 或类似
