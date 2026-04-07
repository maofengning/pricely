"""
Order matching service for limit orders

Checks pending limit orders against current prices and executes matching orders.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessError
from app.models.enums import OrderModeEnum, OrderStatusEnum, OrderTypeEnum
from app.models.trade import Order, Position
from app.models.user import Fund
from app.schemas.websocket import WSOrderFilledMessage


@dataclass
class OrderMatchResult:
    """Result of a matched order"""

    order: Order
    filled_price: Decimal

    def to_ws_message(self) -> WSOrderFilledMessage:
        """Convert to WebSocket message"""
        return WSOrderFilledMessage(
            order_id=str(self.order.id),
            stock_code=self.order.stock_code,
            stock_name=self.order.stock_name,
            order_type=self.order.order_type.value,
            order_mode=self.order.order_mode.value,
            quantity=self.order.quantity,
            limit_price=self.order.limit_price,
            filled_price=self.filled_price,
            filled_at=datetime.utcnow(),
        )


class OrderMatcher:
    """
    Order matching engine for limit orders.

    Matching rules:
    - Buy limit order: filled when current price <= limit price
    - Sell limit order: filled when current price >= limit price
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_pending_limit_orders(self) -> list[Order]:
        """Get all pending limit orders"""
        result = await self.db.execute(
            select(Order).where(
                Order.status == OrderStatusEnum.PENDING,
                Order.order_mode == OrderModeEnum.LIMIT,
            )
        )
        return list(result.scalars().all())

    async def get_pending_orders_for_stock(self, stock_code: str) -> list[Order]:
        """Get pending limit orders for a specific stock"""
        result = await self.db.execute(
            select(Order).where(
                Order.status == OrderStatusEnum.PENDING,
                Order.order_mode == OrderModeEnum.LIMIT,
                Order.stock_code == stock_code,
            )
        )
        return list(result.scalars().all())

    def check_order_match(
        self,
        order: Order,
        current_price: Decimal,
    ) -> bool:
        """
        Check if order should be filled at current price.

        Args:
            order: The limit order to check
            current_price: Current market price

        Returns:
            True if order should be filled
        """
        if order.order_type == OrderTypeEnum.BUY:
            # Buy limit: fill when price <= limit price
            return current_price <= order.limit_price
        else:
            # Sell limit: fill when price >= limit price
            return current_price >= order.limit_price

    async def match_orders(
        self,
        price_cache: dict[str, dict[str, Any]],
    ) -> list[OrderMatchResult]:
        """
        Match pending limit orders against current prices.

        Args:
            price_cache: Cache of current prices {stock_code: {"price": Decimal, ...}}

        Returns:
            List of matched orders with their fill prices
        """
        matched_orders: list[OrderMatchResult] = []

        # Get all pending limit orders
        pending_orders = await self.get_pending_limit_orders()

        for order in pending_orders:
            # Check if we have price data for this stock
            if order.stock_code not in price_cache:
                continue

            current_price = price_cache[order.stock_code].get("price")
            if current_price is None:
                continue

            # Check if order matches
            if self.check_order_match(order, Decimal(str(current_price))):
                logger.info(
                    f"Order matched: order_id={order.id}, "
                    f"stock={order.stock_code}, type={order.order_type.value}, "
                    f"limit_price={order.limit_price}, current_price={current_price}"
                )

                # For buy orders, use limit price (or better)
                # For sell orders, use limit price (or better)
                # Here we use the current price for simplicity
                filled_price = Decimal(str(current_price))

                matched_orders.append(OrderMatchResult(order, filled_price))

        return matched_orders

    async def match_orders_for_stock(
        self,
        stock_code: str,
        current_price: Decimal,
    ) -> list[OrderMatchResult]:
        """
        Match pending limit orders for a specific stock.

        Args:
            stock_code: Stock code to check
            current_price: Current market price

        Returns:
            List of matched orders with their fill prices
        """
        matched_orders: list[OrderMatchResult] = []

        # Get pending limit orders for this stock
        pending_orders = await self.get_pending_orders_for_stock(stock_code)

        for order in pending_orders:
            # Check if order matches
            if self.check_order_match(order, current_price):
                logger.info(
                    f"Order matched for stock: order_id={order.id}, "
                    f"stock={order.stock_code}, type={order.order_type.value}, "
                    f"limit_price={order.limit_price}, current_price={current_price}"
                )

                matched_orders.append(OrderMatchResult(order, current_price))

        return matched_orders

    async def get_fund(self, user_id: UUID) -> Fund:
        """Get user's fund, raise error if not found"""
        result = await self.db.execute(
            select(Fund).where(Fund.user_id == user_id)
        )
        fund = result.scalar_one_or_none()
        if not fund:
            raise BusinessError(
                code="FUND_NOT_FOUND",
                message="用户资金账户不存在",
                details={"user_id": str(user_id)},
            )
        return fund

    async def _unfreeze_funds(self, order: Order, fund: Fund) -> None:
        """Unfreeze funds for limit buy order"""
        if order.order_type == OrderTypeEnum.BUY and order.order_mode == OrderModeEnum.LIMIT:
            frozen_amount = order.limit_price * order.quantity
            fund.available += frozen_amount
            fund.frozen -= frozen_amount

    async def _execute_trade(self, user_id: UUID, order: Order, fund: Fund) -> None:
        """Execute the trade - update position and fund"""
        filled_price = order.filled_price
        quantity = order.quantity

        if order.order_type == OrderTypeEnum.BUY:
            # Buy: increase position
            result = await self.db.execute(
                select(Position).where(
                    Position.user_id == user_id,
                    Position.stock_code == order.stock_code,
                )
            )
            position = result.scalar_one_or_none()

            if position:
                # Update existing position - calculate average cost
                total_quantity = position.quantity + quantity
                total_cost = (position.avg_cost * position.quantity) + (filled_price * quantity)
                position.avg_cost = total_cost / total_quantity
                position.quantity = total_quantity
                position.stock_name = order.stock_name
            else:
                # Create new position
                position = Position(
                    user_id=user_id,
                    stock_code=order.stock_code,
                    stock_name=order.stock_name,
                    quantity=quantity,
                    avg_cost=filled_price,
                )
                self.db.add(position)

            # Deduct from available funds
            cost = filled_price * quantity
            fund.available -= cost
            fund.total_balance -= cost

        else:
            # Sell: decrease position
            result = await self.db.execute(
                select(Position).where(
                    Position.user_id == user_id,
                    Position.stock_code == order.stock_code,
                )
            )
            position = result.scalar_one_or_none()

            if not position or position.quantity < quantity:
                raise BusinessError(
                    code="POSITION_EMPTY",
                    message="持仓不足",
                    details={
                        "stock_code": order.stock_code,
                        "required": quantity,
                        "available": position.quantity if position else 0,
                    },
                )

            # Update position
            position.quantity -= quantity

            # Add to available funds
            revenue = filled_price * quantity
            fund.available += revenue
            fund.total_balance += revenue

            # Remove position if quantity is 0
            if position.quantity == 0:
                await self.db.delete(position)

    async def execute_matched_order(self, match_result: OrderMatchResult) -> Order:
        """
        Execute a matched limit order.

        This method:
        1. Unfreezes frozen funds (for buy orders)
        2. Updates order status and filled price
        3. Updates position and fund
        4. Commits the transaction

        Args:
            match_result: The matched order with fill price

        Returns:
            The updated order with filled status
        """
        order = match_result.order
        filled_price = match_result.filled_price

        logger.info(
            f"Executing matched order: order_id={order.id}, "
            f"filled_price={filled_price}"
        )

        # Get user's fund
        fund = await self.get_fund(order.user_id)

        # Unfreeze funds first (for limit buy orders)
        await self._unfreeze_funds(order, fund)

        # Set filled price and status
        order.filled_price = filled_price
        order.status = OrderStatusEnum.FILLED
        order.filled_at = datetime.utcnow()

        # Execute the trade
        await self._execute_trade(order.user_id, order, fund)

        # Commit changes
        await self.db.commit()

        logger.info(
            f"Order execution complete: order_id={order.id}, "
            f"status={order.status}, filled_price={filled_price}"
        )

        return order

    async def match_and_execute_orders(
        self,
        price_cache: dict[str, dict[str, Any]],
    ) -> list[OrderMatchResult]:
        """
        Match pending limit orders and execute them.

        Args:
            price_cache: Cache of current prices

        Returns:
            List of executed orders with fill prices
        """
        # Find matching orders
        matched_orders = await self.match_orders(price_cache)

        # Execute each matched order
        executed_results: list[OrderMatchResult] = []
        for match_result in matched_orders:
            try:
                await self.execute_matched_order(match_result)
                executed_results.append(match_result)
            except Exception as e:
                # Rollback any partial changes before continuing
                await self.db.rollback()
                logger.error(
                    f"Failed to execute order {match_result.order.id}: {e}"
                )
                # Continue with other orders

        return executed_results
