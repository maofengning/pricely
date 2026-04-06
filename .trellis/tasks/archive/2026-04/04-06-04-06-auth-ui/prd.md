# Auth UI Implementation

## Goal
完善认证 UI 组件，实现登录、注册、用户设置页面的完整功能。

## Requirements

### 功能需求
1. **登录页面** - 邮箱/密码登录，记住登录状态，错误提示
2. **注册页面** - 邮箱注册，密码确认，表单验证
3. **用户设置页面** - 修改密码，个人信息编辑
4. **登出功能** - 清除 token，跳转到登录页

### 技术约束
- 使用 React + TypeScript + Tailwind CSS
- 表单使用 React Hook Form + Zod 验证
- 状态管理使用 Zustand
- API 调用使用已有 auth API

## Acceptance Criteria
- [ ] 登录页面完整实现，表单验证正确
- [ ] 注册页面完整实现，错误处理完善
- [ ] 用户设置页面实现密码修改功能
- [ ] 登出功能正常工作
- [ ] 所有表单有适当的加载状态和错误提示
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 frontend/src/components/Auth/ 现有组件
- 参考 frontend/src/pages/Login.tsx, Register.tsx
- API: /auth/login, /auth/register, /auth/me, /auth/logout