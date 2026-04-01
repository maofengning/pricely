"""
Compliance API routes
"""

from fastapi import APIRouter

from app.schemas.compliance import RiskWarningResponse

router = APIRouter(prefix="/compliance", tags=["Compliance"])


@router.get("/risk-warning", response_model=RiskWarningResponse)
async def get_risk_warning(scene: str = "homepage"):
    """获取风险提示内容"""
    warnings = {
        "homepage": {
            "title": "风险提示",
            "content": "本平台仅提供模拟交易服务，不涉及任何实盘交易。模拟交易结果不代表实盘收益，投资有风险，入市需谨慎。",
            "scene": "homepage",
        },
        "trade_page": {
            "title": "模拟交易风险提示",
            "content": "您即将进入模拟交易页面。请注意：\n1. 本平台仅提供模拟交易，不涉及真实资金。\n2. 模拟交易结果不代表实盘收益。\n3. 所有交易决策由您自行做出，本平台不提供任何投资建议。\n4. 请勿根据模拟交易结果进行实盘操作。",
            "scene": "trade_page",
        },
    }

    return RiskWarningResponse(**warnings.get(scene, warnings["homepage"]))
