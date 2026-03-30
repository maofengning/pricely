#!/usr/bin/env python3
"""Update task.json files with dependencies and metadata."""

import json
from pathlib import Path

TASKS_DIR = Path(".trellis/tasks")

# Task configurations with dependencies
TASK_CONFIGS = {
    "03-31-t0-01-scaffolding": {
        "description": "建立前后端项目基础结构",
        "dev_type": "fullstack",
        "priority": "P0",
        "blockedBy": [],
        "estimate": "1d",
        "phase": 0,
        "notes": "Phase 0: 基础设施 - 前后端项目初始化、配置lint/typecheck"
    },
    "03-31-t0-02-docker": {
        "description": "配置本地开发环境 Docker compose",
        "dev_type": "infra",
        "priority": "P0",
        "blockedBy": ["03-31-t0-01-scaffolding"],
        "estimate": "0.5d",
        "phase": 0,
        "notes": "Phase 0: 基础设施 - Docker compose、Makefile"
    },
    "03-31-t0-03-db-schema": {
        "description": "创建所有数据库表结构和 ORM 模型",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t0-01-scaffolding"],
        "estimate": "1d",
        "phase": 0,
        "notes": "Phase 0: 基础设施 - PostgreSQL schema、SQLAlchemy ORM"
    },
    "03-31-t0-04-data-load": {
        "description": "加载模拟行情数据（股票列表、K线历史）",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t0-03-db-schema"],
        "estimate": "0.5d",
        "phase": 0,
        "notes": "Phase 0: 基础设施 - 预置CSV/JSON数据、Redis缓存"
    },
    "03-31-t1-01-auth-api": {
        "description": "用户认证后端 API（注册、登录、JWT）",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t0-03-db-schema"],
        "estimate": "1d",
        "phase": 1,
        "notes": "Phase 1: 认证模块 - bcrypt密码、JWT RS256、Redis session"
    },
    "03-31-t1-02-auth-ui": {
        "description": "用户认证前端界面（登录、注册、用户信息）",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": ["03-31-t1-01-auth-api"],
        "estimate": "1d",
        "phase": 1,
        "notes": "Phase 1: 认证模块 - LoginForm、RegisterForm、userStore"
    },
    "03-31-t2-01-market-api": {
        "description": "行情数据 REST API 和 WebSocket 推送",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t0-04-data-load"],
        "estimate": "1.5d",
        "phase": 2,
        "notes": "Phase 2: 行情模块 - K线API、多周期、实时推送模拟"
    },
    "03-31-t2-02-market-ws": {
        "description": "前端 WebSocket 连接管理",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": ["03-31-t2-01-market-api"],
        "estimate": "1d",
        "phase": 2,
        "notes": "Phase 2: 行情模块 - websocket service、useWebSocket hook"
    },
    "03-31-t3-01-chart-base": {
        "description": "lightweight-charts K线图集成",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": ["03-31-t2-02-market-ws"],
        "estimate": "2d",
        "phase": 3,
        "notes": "Phase 3: 图表模块 - CandleChart、OHLCDisplay、样式设置"
    },
    "03-31-t3-02-multi-period": {
        "description": "多周期联动面板（7个周期）",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": ["03-31-t3-01-chart-base"],
        "estimate": "1d",
        "phase": 3,
        "notes": "Phase 3: 图表模块 - MultiPeriodPanel、时间轴对齐"
    },
    "03-31-t4-01-sr-algorithm": {
        "description": "规则引擎支撑阻力识别算法",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t0-04-data-load"],
        "estimate": "2d",
        "phase": 4,
        "notes": "Phase 4: 支撑阻力 - 波段高低点、水平支撑阻力、整数关口"
    },
    "03-31-t4-02-sr-tools": {
        "description": "图表支撑阻力绘制工具和斐波那契",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": ["03-31-t4-01-sr-algorithm", "03-31-t3-01-chart-base"],
        "estimate": "1.5d",
        "phase": 4,
        "notes": "Phase 4: 支撑阻力 - SupportResistanceTools、FibonacciTools"
    },
    "03-31-t5-01-pattern-api": {
        "description": "形态标注 CRUD API",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t0-03-db-schema"],
        "estimate": "1d",
        "phase": 5,
        "notes": "Phase 5: 形态标注 - 7种形态类型、按周期查询"
    },
    "03-31-t5-02-pattern-ui": {
        "description": "图表形态标注工具",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": ["03-31-t5-01-pattern-api", "03-31-t3-01-chart-base"],
        "estimate": "1.5d",
        "phase": 5,
        "notes": "Phase 5: 形态标注 - PatternMarker、PatternList、PatternEditor"
    },
    "03-31-t6-01-trade-api": {
        "description": "模拟交易后端 API（下单、持仓、资金）",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t1-01-auth-api", "03-31-t2-01-market-api"],
        "estimate": "2d",
        "phase": 6,
        "notes": "Phase 6: 模拟交易 - 市价单、限价单、持仓计算"
    },
    "03-31-t6-02-order-match": {
        "description": "限价单撮合引擎",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t6-01-trade-api", "03-31-t2-01-market-api"],
        "estimate": "1d",
        "phase": 6,
        "notes": "Phase 6: 模拟交易 - WebSocket触发撮合、order_filled通知"
    },
    "03-31-t6-03-trade-report": {
        "description": "交易报表定时计算",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t6-01-trade-api"],
        "estimate": "0.5d",
        "phase": 6,
        "notes": "Phase 6: 模拟交易 - 日报/周报/月报、胜率、最大回撤"
    },
    "03-31-t6-04-trade-ui": {
        "description": "模拟交易前端界面",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": ["03-31-t6-01-trade-api", "03-31-t2-02-market-ws"],
        "estimate": "2d",
        "phase": 6,
        "notes": "Phase 6: 模拟交易 - TradePanel、OrderForm、PositionManager"
    },
    "03-31-t7-01-log-api": {
        "description": "交易日志 CRUD API",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": ["03-31-t0-03-db-schema"],
        "estimate": "1d",
        "phase": 7,
        "notes": "Phase 7: 交易日志 - 多条件筛选、标签数组"
    },
    "03-31-t7-02-log-ui": {
        "description": "交易日志前端界面",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": ["03-31-t7-01-log-api"],
        "estimate": "1d",
        "phase": 7,
        "notes": "Phase 7: 交易日志 - TradeLog、虚拟滚动、筛选搜索"
    },
    "03-31-t8-01-compliance-api": {
        "description": "合规风险提示 API",
        "dev_type": "backend",
        "priority": "P0",
        "blockedBy": [],
        "estimate": "0.5d",
        "phase": 8,
        "notes": "Phase 8: 合规提示 - 风险提示内容配置"
    },
    "03-31-t8-02-compliance-ui": {
        "description": "合规风险提示前端组件",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": ["03-31-t8-01-compliance-api"],
        "estimate": "0.5d",
        "phase": 8,
        "notes": "Phase 8: 合规提示 - RiskWarningBanner、RiskWarningModal"
    },
    "03-31-t9-01-page-integration": {
        "description": "前端页面路由和布局集成",
        "dev_type": "frontend",
        "priority": "P0",
        "blockedBy": [
            "03-31-t3-02-multi-period",
            "03-31-t4-02-sr-tools",
            "03-31-t5-02-pattern-ui",
            "03-31-t6-04-trade-ui",
            "03-31-t7-02-log-ui",
            "03-31-t8-02-compliance-ui",
            "03-31-t1-02-auth-ui"
        ],
        "estimate": "1d",
        "phase": 9,
        "notes": "Phase 9: 集成 - Home/Trade/Log/Report页面、Header/Sidebar"
    },
    "03-31-t9-02-e2e-test": {
        "description": "端到端功能测试",
        "dev_type": "test",
        "priority": "P0",
        "blockedBy": ["03-31-t9-01-page-integration"],
        "estimate": "2d",
        "phase": 9,
        "notes": "Phase 9: 测试 - 核心流程测试、WebSocket测试、撮合测试"
    },
    "03-31-t10-01-deploy": {
        "description": "生产环境部署配置",
        "dev_type": "infra",
        "priority": "P0",
        "blockedBy": ["03-31-t9-02-e2e-test"],
        "estimate": "1d",
        "phase": 10,
        "notes": "Phase 10: 部署 - 生产Docker compose、Nginx SSL、环境变量"
    },
}

def update_task(task_dir: str, config: dict):
    """Update a task.json file with the given configuration."""
    task_path = TASKS_DIR / task_dir / "task.json"
    if not task_path.exists():
        print(f"Warning: {task_path} does not exist")
        return

    with open(task_path, "r") as f:
        task_data = json.load(f)

    # Update fields
    task_data["description"] = config["description"]
    task_data["dev_type"] = config["dev_type"]
    task_data["priority"] = config["priority"]
    task_data["blockedBy"] = config["blockedBy"]
    task_data["notes"] = config["notes"]
    task_data["meta"] = {
        "estimate": config["estimate"],
        "phase": config["phase"]
    }

    with open(task_path, "w", encoding="utf-8") as f:
        json.dump(task_data, f, indent=2, ensure_ascii=False)

    print(f"Updated: {task_dir}")

def main():
    for task_dir, config in TASK_CONFIGS.items():
        update_task(task_dir, config)
    print("\nAll tasks updated successfully!")

if __name__ == "__main__":
    main()