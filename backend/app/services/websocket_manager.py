"""
WebSocket connection manager for market data streaming
"""

import asyncio
import random
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import WebSocket
from loguru import logger

from app.core.database import AsyncSessionLocal
from app.schemas.websocket import (
    WSAction,
    WSErrorMessage,
    WSHeartbeatMessage,
    WSMessageType,
    WSOrderFilledMessage,
    WSPongMessage,
    WSPriceUpdate,
    WSSubscribedMessage,
    WSSubscribeMessage,
    WSUnsubscribedMessage,
)
from app.services.order_matcher import OrderMatcher


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
        # Map of websocket -> user_id (for authenticated connections)
        self._user_connections: dict[WebSocket, UUID] = {}
        # Map of user_id -> websocket (reverse mapping for notifications)
        self._websocket_by_user: dict[UUID, WebSocket] = {}
        # Background task for price updates
        self._price_task: asyncio.Task[None] | None = None
        # Background task for order matching
        self._order_match_task: asyncio.Task[None] | None = None
        # Flag to control background tasks
        self._running: bool = False
        # Simulated price cache
        self._price_cache: dict[str, dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID | None = None) -> None:
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self._connections[websocket] = set()

        # Track user connection if authenticated
        if user_id:
            self._user_connections[websocket] = user_id
            self._websocket_by_user[user_id] = websocket
            logger.info(f"WebSocket connected with user_id: {websocket.client}, user_id={user_id}")
        else:
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

        # Clean up user tracking
        user_id = self._user_connections.pop(websocket, None)
        if user_id:
            self._websocket_by_user.pop(user_id, None)

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

    def get_subscriber_count(self, stock_code: str | None = None) -> int:
        """Get number of subscribers for a stock or total connections"""
        if stock_code:
            return len(self._stock_subscribers.get(stock_code, set()))
        return len(self._connections)

    def get_subscribed_stocks(self, websocket: WebSocket) -> set[str]:
        """Get stocks subscribed by a connection"""
        return self._connections.get(websocket, set()).copy()

    async def send_order_filled_notification(
        self,
        user_id: UUID,
        message: WSOrderFilledMessage,
    ) -> None:
        """Send order filled notification to a specific user"""
        websocket = self._websocket_by_user.get(user_id)
        if websocket:
            try:
                await websocket.send_json(message.model_dump(by_alias=True))
                logger.info(
                    f"Order filled notification sent to user_id={user_id}, "
                    f"order_id={message.order_id}"
                )
            except Exception as e:
                logger.warning(f"Failed to send order notification to user_id={user_id}: {e}")

    async def check_and_match_orders(self) -> None:
        """
        Background task to check and match pending limit orders.

        Runs every 3 seconds to check if any pending orders match current prices.
        """
        logger.info("Order matching checker started")

        while self._running:
            try:
                # Only run if there are price data and user connections
                if self._price_cache and self._user_connections:
                    # Create async session for database operations
                    async with AsyncSessionLocal() as db:
                        matcher = OrderMatcher(db)

                        # Match and execute orders
                        executed_results = await matcher.match_and_execute_orders(
                            self._price_cache
                        )

                        # Send notifications for executed orders
                        for result in executed_results:
                            ws_message = result.to_ws_message()
                            await self.send_order_filled_notification(
                                result.order.user_id,
                                ws_message,
                            )

                # Wait 3 seconds before next check
                await asyncio.sleep(3.0)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in order matching loop: {e}")
                await asyncio.sleep(3.0)

        logger.info("Order matching checker stopped")

    def start_background_task(self) -> None:
        """Start the background price update task"""
        if self._price_task is None or self._price_task.done():
            self._price_task = asyncio.create_task(self.broadcast_price_updates())
            logger.info("Background price update task started")

        # Start order matching task
        if self._order_match_task is None or self._order_match_task.done():
            self._order_match_task = asyncio.create_task(self.check_and_match_orders())
            logger.info("Background order matching task started")

    def stop_background_task(self) -> None:
        """Stop the background tasks"""
        self._running = False

        if self._price_task and not self._price_task.done():
            self._price_task.cancel()
            logger.info("Background price update task stopped")

        if self._order_match_task and not self._order_match_task.done():
            self._order_match_task.cancel()
            logger.info("Background order matching task stopped")

# Global connection manager instance
manager = ConnectionManager()
