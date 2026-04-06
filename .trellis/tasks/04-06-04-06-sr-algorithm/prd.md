# Support/Resistance Algorithm Implementation

## Goal
实现支撑阻力位识别算法，基于高低点识别支撑阻力位。

## Requirements

### 功能需求
1. **高低点识别** - 识别局部高点和低点
2. **支撑位计算** - 基于低点聚类计算支撑位
3. **阻力位计算** - 基于高点聚类计算阻力位
4. **强度评分** - 计算每个位置的强度分数

### API 接口
- `POST /ai/sr-detect` - 检测指定股票的支撑阻力位
- 返回: 支撑位列表、阻力位列表、强度分数

### 技术约束
- 使用纯规则算法，不使用 ML 模型
- 使用 numpy 进行数值计算
- 错误处理遵循 error-handling.md

## Acceptance Criteria
- [ ] 高低点识别算法实现
- [ ] 支撑位计算正确
- [ ] 阻力位计算正确
- [ ] 强度评分实现
- [ ] API 接口正常工作
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 backend/app/services/ai_service.py 现有结构
- 参考 backend/app/utils/swing_detector.py 波动检测
- 算法: 使用局部极值点 + 聚类算法