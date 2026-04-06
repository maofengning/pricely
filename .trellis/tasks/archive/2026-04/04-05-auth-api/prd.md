# Auth API Implementation

## Goal
完善用户认证 API，实现完整的 JWT token 管理和用户认证流程。

## Requirements

### 功能需求
1. **注册** `/auth/register` - 创建用户，初始化模拟资金账户
2. **登录** `/auth/login` - 验证密码，返回 JWT access_token 和 refresh_token
3. **Token 刷新** `/auth/refresh` - 使用 refresh_token 获取新的 access_token
4. **用户信息** `/auth/me` - 获取当前用户信息
5. **登出** `/auth/logout` - 清除 session

### 技术约束
- JWT 实现: 使用 python-jose 或 PyJWT
- 密码哈希: bcrypt
- Token 有效期: access_token 15min, refresh_token 7d
- 错误处理遵循 error-handling.md

## Acceptance Criteria
- [ ] auth_service.py 完整实现 JWT 生成/验证/刷新
- [ ] 注册时自动创建 Fund 记录 (初始资金 100000)
- [ ] 登录返回正确的 token 格式
- [ ] 错误处理符合规范 (UNAUTHORIZED, INVALID_CREDENTIALS, TOKEN_EXPIRED)
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 backend/app/services/auth_service.py 现有实现
- 使用 backend/app/core/security.py 的 JWT 工具
- 参考 backend/app/api/auth.py 的 API 结构