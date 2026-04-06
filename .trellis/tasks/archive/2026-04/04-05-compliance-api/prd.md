# Compliance API Implementation

## Goal
实现合规风险提示 API，提供风险提示内容管理和用户确认记录存储。

## Requirements

### 功能需求
1. **获取风险提示** `/compliance/warning` - 返回风险提示文本内容
2. **用户确认** `/compliance/confirm` - 记录用户已阅读风险提示
3. **确认状态查询** `/compliance/status` - 查询用户是否已确认风险提示

### 技术约束
- 风险提示文本可配置 (支持首页和交易页两种)
- 确认记录持久化存储
- 错误处理遵循 error-handling.md

## Acceptance Criteria
- [ ] ComplianceRecord 模型创建 (user_id, warning_type, confirmed_at)
- [ ] ComplianceService 实现完整
- [ ] API 端点符合 RESTful 规范
- [ ] 错误处理符合规范
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 backend/app/api/compliance.py 现有 API 结构
- 参考 backend/app/schemas/compliance.py schema 定义
- 需要创建 compliance_service.py