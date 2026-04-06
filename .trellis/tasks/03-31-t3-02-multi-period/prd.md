# T3-02: 多周期联动面板

## Goal
实现多周期联动面板，支持7个周期的图表联动显示，时间轴对齐，同步缩放和十字光标联动。

## Requirements
- 支持7个周期：1min、5min、15min、30min、1h、4h、1d
- 多图表布局：可配置的网格布局（2x3、3x3等）
- 时间轴对齐：所有图表的时间轴同步对齐
- 同步缩放：缩放任一图表时同步其他图表
- 十字光标联动：十字光标在所有图表同步显示
- 周期切换：支持动态添加/移除周期图表

## Acceptance Criteria
- [ ] MultiPeriodPanel 组件正确渲染多图表布局
- [ ] 时间轴对齐功能正常工作
- [ ] 同步缩放功能正常工作
- [ ] 十字光标联动功能正常工作
- [ ] 支持动态添加/移除周期图表
- [ ] 性能优化：避免不必要的重渲染

## Technical Notes
- 基于 LightweightCharts 库实现
- 使用 useMultiPeriodSync hook 管理联动状态
- 参考 T3-01 完成的 ChartBase 组件