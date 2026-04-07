# Pricely Backend

基于价格行为学的裸K分析平台后端API服务。

## 技术栈

- Python 3.11+
- FastAPI 0.100+
- SQLAlchemy 2.x
- PostgreSQL 15.x
- Redis 7.x

## 开发环境设置

```bash
# 安装依赖
uv sync

# 运行开发服务器
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API文档

启动服务后访问:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc