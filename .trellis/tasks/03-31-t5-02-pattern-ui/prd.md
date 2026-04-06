# T5-02: 形态标注工具-前端

## Goal
实现图表形态标注工具，支持在图表上标注、查看、编辑形态。

## Requirements
- PatternMarker: 图表上的形态标注标记组件
- PatternList: 形态标注列表组件（显示当前股票的形态标注）
- PatternEditor: 形态标注编辑器组件（创建/编辑形态）
- 支持的形态类型（参考 T5-01 PatternEnum）:
  - 头肩顶/底 (HeadAndShouldersTop/Bottom)
  - 双顶/底 (DoubleTop/Bottom)
  - 三重顶/底 (TripleTop/Bottom)
  - 三角形 (Triangle)
  - 旗形 (Flag)
- 与图表集成：形态标注显示在对应价格和时间位置
- API 调用：调用 T5-01 完成的 Pattern API

## Acceptance Criteria
- [ ] PatternMarker 组件正确渲染形态标记
- [ ] PatternList 组件正确显示形态列表
- [ ] PatternEditor 组件正确创建/编辑形态
- [ ] 形态标注与图表正确集成
- [ ] API 调用正确（CRUD 操作）
- [ ] 支持所有 8 种形态类型

## Technical Notes
- 基于 T5-01 完成的 Pattern API
- 基于 T3-01 完成的 ChartBase 组件
- 使用 lightweight-charts 的 markers API