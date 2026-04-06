"""
WebSocket connection manager for market data streaming
"""

import asyncio
import random
from datetime import datetime
from decimal import Decimal
from typing import Any

from fastapi import WebSocket
from loguru import logger

from app.schemas.websocket import (
    WSAction,
    WSErrorMessage,
    WSHeartbeatMessage,
    WSMessageType,
    WSPongMessage,
    WSPriceUpdate,
    WSSubscribedMessage,
    WSSubscribeMessage,
    WSUnsubscribedMessage,
)


class ConnectionManager:
    """
    Manages WebSocket connections and subscriptions.

    Uses in-memory storage for simplicity. For production with multiple
    instances, consider using Redis pub/sub for distributed message passing.
    """

    def __init__(self) -> None:
        # Map of websocket -> set of subscribed stock codes
        self._connections: dict[WebSocket, set[str]] = {}
        # Map of stock_code -> set of subscribed websockets
        self._stock_subscribers: dict[str, set[WebSocket]] = {}
        # Background task for price updates
        self._price_task: asyncio.Task[None] | None = None
        # Flag to control background task
        self._running: bool = False
        # Simulated price cache
        self._price_cache: dict[str, dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self._connections[websocket] = set()
        logger.info(f"WebSocket connected: {websocket.client}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection and clean up subscriptions"""
        # Get subscribed stocks for this connection
        subscribed_stocks = self._connections.pop(websocket, set())

        # Remove this connection from all stock subscriber sets
        for stock_code in subscribed_stocks:
            if stock_code in self._stock_subscribers:
                self._stock_subscribers[stock_code].discard(websocket)
                if not self._stock_subscribers[stock_code]:
                    del self._stock_subscribers[stock_code]

        logger.info(f"WebSocket disconnected: {websocket.client}")

    async def handle_message(
        self,
        websocket: WebSocket,
        message: dict[str, Any],
    ) -> None:
        """Handle incoming WebSocket message"""
        try:
            # Parse and validate message
            ws_message = WSSubscribeMessage(**message)
            action = ws_message.action

            if action == WSAction.PING:
                await self._handle_ping(websocket)
            elif action == WSAction.SUBSCRIBE:
                await self._handle_subscribe(websocket, ws_message.stock_code)
            elif action == WSAction.UNSUBSCRIBE:
                await self._handle_unsubscribe(websocket, ws_message.stock_code)
            else:
                await self.send_error(websocket, "INVALID_ACTION", f"Unknown action: {action}")

        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await self.send_error(websocket, "INVALID_MESSAGE", str(e))

    async def _handle_subscribe(
        self,
        websocket: WebSocket,
        stock_code: str | None,
    ) -> None:
        """Handle subscription request"""
        if not stock_code:
            await self.send_error(websocket, "MISSING_STOCK_CODE", "Stock code is required")
            return

        # Add to connection's subscriptions
        self._connections[websocket].add(stock_code)

        # Add to stock's subscribers
        if stock_code not in self._stock_subscribers:
            self._stock_subscribers[stock_code] = set()
        self._stock_subscribers[stock_code].add(websocket)

        # Initialize price cache if not exists
        if stock_code not in self._price_cache:
            self._price_cache[stock_code] = {
                "price": Decimal("100.0000"),
                "change": Decimal("0.0000"),
                "change_pct": Decimal("0.00"),
                "volume": 0,
            }

        # Send confirmation
        response = WSSubscribedMessage(stock_code=stock_code)
        await websocket.send_json(response.model_dump(by_alias=True))
        logger.info(f"Client subscribed to {stock_code}")

    async def _handle_unsubscribe(
        self,
        websocket: WebSocket,
        stock_code: str | None,
    ) -> None:
        """Handle unsubscription request"""
        if not stock_code:
            await self.send_error(websocket, "MISSING_STOCK_CODE", "Stock code is required")
            return

        # Remove from connection's subscriptions
        self._connections[websocket].discard(stock_code)

        # Remove from stock's subscribers
        if stock_code in self._stock_subscribers:
            self._stock_subscribers[stock_code].discard(websocket)
            if not self._stock_subscribers[stock_code]:
                del self._stock_subscribers[stock_code]

        # Send confirmation
        response = WSUnsubscribedMessage(stock_code=stock_code)
        await websocket.send_json(response.model_dump(by_alias=True))
        logger.info(f"Client unsubscribed from {stock_code}")

    async def _handle_ping(self, websocket: WebSocket) -> None:
        """Handle ping/pong for heartbeat"""
        response = WSPongMessage()
        await websocket.send_json(response.model_dump(by_alias=True))

    async def send_error(
        self,
        websocket: WebSocket,
        code: str,
        message: str,
    ) -> None:
        """Send error message to client"""
        error = WSErrorMessage(code=code, message=message)
        await websocket.send_json(error.model_dump(by_alias=True))

    async def broadcast_price_updates(self) -> None:
        """
        Background task to simulate and broadcast price updates.

        In production, this would connect to a real-time data source
        or Redis pub/sub for price updates.
        """
        self._running = True
        logger.info("Price update broadcaster started")

        while self._running:
            try:
                # Process each stock with subscribers
                for stock_code, subscribers in list(self._stock_subscribers.items()):
                    if not subscribers:
                        continue

                    # Simulate price change
                    price_update = self._generate_price_update(stock_code)

                    # Broadcast to all subscribers
                    disconnected = set()
                    for websocket in subscribers:
                        try:
                            await websocket.send_json(
                                price_update.model_dump(by_alias=True)
                            )
                        except Exception as e:
                            logger.warning(f"Failed to send to client: {e}")
                            disconnected.add(websocket)

                    # Clean up disconnected clients
                    for ws in disconnected:
                        self.disconnect(ws)

                # Wait before next update (simulate real-time interval)
                await asyncio.sleep(1.0)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in price update loop: {e}")
                await asyncio.sleep(1.0)

        logger.info("Price update broadcaster stopped")

    def _generate_price_update(self, stock_code: str) -> WSPriceUpdate:
        """Generate simulated price update"""
        # Get current price from cache or initialize
        if stock_code not in self._price_cache:
            self._price_cache[stock_code] = {
                "price": Decimal("100.0000"),
                "change": Decimal("0.0000"),
                "change_pct": Decimal("0.00"),
                "volume": 0,
            }

        cache = self._price_cache[stock_code]
        current_price = float(cache["price"])

        # Simulate price movement (±0.5%)
        fluctuation = random.uniform(-0.005, 0.005)
        new_price = current_price * (1 + fluctuation)
        base_price = 100.0  # Base price for change calculation

        # Update cache
        cache["price"] = Decimal(str(round(new_price, 4)))
        cache["change"] = Decimal(str(round(new_price - base_price, 4)))
        cache["change_pct"] = Decimal(str(round((new_price - base_price) / base_price * 100, 2)))
        cache["volume"] = random.randint(10000, 1000000)

        return WSPriceUpdate(
            type=WSMessageType.PRICE_UPDATE,
            stock_code=stock_code,
            price=cache["price"],
            change=cache["change"],
            change_pct=cache["change_pct"],
            time=datetime.now(),
            volume=cache["volume"],
        )

    async def send_heartbeat(self, websocket: WebSocket) -> None:
        """Send heartbeat message to client"""
        heartbeat = WSHeartbeatMessage()
        await websocket.send_json(heartbeat.model_dump(by_alias=True))

    def start_background_task(self) -> None:
        """Start the background price update task"""
        if self._price_task is None or self._price_task.done():
            self._price_task = asyncio.create_task(self.broadcast_price_updates())
            logger.info("Background price update task started")

    def stop_background_task(self) -> None:
        """Stop the background price update task"""
        self._running = False
        if self._price_task and not self._price_task.done():
            self._price_task.cancel()
            logger.info("Background price update task stopped")

    def get_subscriber_count(self, stock_code: str | None = None) -> int:
        """Get number of subscribers for a stock or total connections"""
        if stock_code:
            return len(self._stock_subscribers.get(stock_code, set()))
        return len(self._connections)

    def get_subscribed_stocks(self, websocket: WebSocket) -> set[str]:
        """Get stocks subscribed by a connection"""
        return self._connections.get(websocket, set()).copy()


# Global connection manager instance
manager = ConnectionManager()
