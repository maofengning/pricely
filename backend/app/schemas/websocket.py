"""
WebSocket schemas for market data
"""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class WSAction(StrEnum):
    """WebSocket message actions"""
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    PING = "ping"


class WSMessageType(StrEnum):
    """WebSocket message types"""
    PRICE_UPDATE = "price_update"
    SUBSCRIBED = "subscribed"
    UNSUBSCRIBED = "unsubscribed"
    ERROR = "error"
    PONG = "pong"
    HEARTBEAT = "heartbeat"
    ORDER_FILLED = "order_filled"


class WSSubscribeMessage(BaseModel):
    """WebSocket subscription message from client"""
    action: WSAction = Field(..., description="Action type: subscribe/unsubscribe/ping")
    stock_code: str | None = Field(None, description="Stock code to subscribe/unsubscribe")

    class Config:
        json_schema_extra = {
            "examples": [
                {"action": "subscribe", "stock_code": "600519"},
                {"action": "unsubscribe", "stock_code": "600519"},
                {"action": "ping"},
            ]
        }


class WSPriceUpdate(BaseModel):
    """Price update message to client"""
    type: WSMessageType = WSMessageType.PRICE_UPDATE
    stock_code: str = Field(..., alias="stockCode", description="Stock code")
    price: Decimal = Field(..., description="Current price")
    change: Decimal = Field(..., description="Price change")
    change_pct: Decimal = Field(..., alias="changePct", description="Price change percentage")
    time: datetime = Field(..., description="Update timestamp")
    volume: int | None = Field(None, description="Volume")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "type": "price_update",
                "stockCode": "600519",
                "price": 1850.50,
                "change": 10.50,
                "changePct": 0.57,
                "time": "2024-01-01T10:00:00",
                "volume": 1000000,
            }
        }


class WSSubscribedMessage(BaseModel):
    """Subscription confirmation message"""
    type: WSMessageType = WSMessageType.SUBSCRIBED
    stock_code: str = Field(..., alias="stockCode", description="Stock code subscribed")
    message: str = Field(default="Subscription successful", description="Confirmation message")

    class Config:
        populate_by_name = True


class WSUnsubscribedMessage(BaseModel):
    """Unsubscription confirmation message"""
    type: WSMessageType = WSMessageType.UNSUBSCRIBED
    stock_code: str = Field(..., alias="stockCode", description="Stock code unsubscribed")
    message: str = Field(default="Unsubscription successful", description="Confirmation message")

    class Config:
        populate_by_name = True


class WSErrorMessage(BaseModel):
    """Error message"""
    type: WSMessageType = WSMessageType.ERROR
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "error",
                "code": "INVALID_ACTION",
                "message": "Unknown action type",
            }
        }


class WSPongMessage(BaseModel):
    """Pong message for heartbeat"""
    type: WSMessageType = WSMessageType.PONG
    time: datetime = Field(default_factory=datetime.now, description="Server timestamp")

    class Config:
        populate_by_name = True


class WSHeartbeatMessage(BaseModel):
    """Heartbeat message"""
    type: WSMessageType = WSMessageType.HEARTBEAT
    time: datetime = Field(default_factory=datetime.now, description="Server timestamp")


class WSOrderFilledMessage(BaseModel):
    """Order filled notification message"""
    type: WSMessageType = WSMessageType.ORDER_FILLED
    order_id: str = Field(..., alias="orderId", description="Order ID")
    stock_code: str = Field(..., alias="stockCode", description="Stock code")
    stock_name: str | None = Field(None, alias="stockName", description="Stock name")
    order_type: str = Field(..., alias="orderType", description="Order type: buy/sell")
    order_mode: str = Field(..., alias="orderMode", description="Order mode: market/limit")
    quantity: int = Field(..., description="Quantity")
    limit_price: Decimal | None = Field(None, alias="limitPrice", description="Limit price")
    filled_price: Decimal = Field(..., alias="filledPrice", description="Filled price")
    filled_at: datetime = Field(..., alias="filledAt", description="Filled timestamp")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "type": "order_filled",
                "orderId": "123e4567-e89b-12d3-a456-426614174000",
                "stockCode": "600519",
                "stockName": "贵州茅台",
                "orderType": "buy",
                "orderMode": "limit",
                "quantity": 100,
                "limitPrice": 1850.00,
                "filledPrice": 1849.50,
                "filledAt": "2024-01-01T10:30:00",
            }
        }
