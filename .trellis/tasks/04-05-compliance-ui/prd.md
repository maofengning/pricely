# Compliance UI Implementation

## Goal
完善合规风险提示 UI 组件，实现首页和交易页的风险提示功能。

## Requirements

### 功能需求
1. **首页风险提示弹窗** - 用户首次进入时显示，必须确认后才能继续
2. **交易页风险提示横幅** - 持续显示在交易页面顶部
3. **确认状态管理** - 使用 Zustand 或 API 存储确认状态
4. **国际化支持** - 提示文本可配置

### 技术约束
- 使用 React + TypeScript + Tailwind CSS
- 组件遵循 component-guidelines.md
- 样式使用 TradingView 深色主题风格

## Acceptance Criteria
- [ ] RiskWarningModal 组件完善，支持确认状态持久化
- [ ] RiskWarningBanner 组件完善，样式符合主题
- [ ] 首页集成弹窗显示逻辑
- [ ] 交易页集成横幅显示逻辑
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 frontend/src/components/Compliance/RiskWarningModal.tsx 现有实现
- 参考 frontend/src/components/Compliance/RiskWarningBanner.tsx 现有实现
- 状态管理: frontend/src/stores/ 或使用 API