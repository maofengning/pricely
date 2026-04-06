# Chart Base Implementation

## Goal
实现图表基础组件，集成 lightweight-charts，支持 K 线渲染。

## Requirements

### 功能需求
1. **K线图表组件** - 使用 lightweight-charts 渲染 K 线
2. **配置选项** - 支持 TradingView 深色主题
3. **响应式** - 图表宽度自适应容器
4. **交互功能** - 支持缩放、拖动、十字光标

### 技术约束
- 使用 React + TypeScript
- 集成 lightweight-charts 4.x
- 样式使用 Tailwind CSS
- 遵循 component-guidelines.md

## Acceptance Criteria
- [ ] ChartContainer 组件实现 K 线渲染
- [ ] 支持 OHLC 数据格式
- [ ] 主题配置正确（深色）
- [ ] 响应式布局正常工作
- [ ] 基本交互功能正常
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 frontend/src/components/Chart/ChartContainer.tsx 现有实现
- 参考 lightweight-charts 官方文档
- 数据格式: { time, open, high, low, close, volume }