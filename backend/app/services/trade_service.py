"""
Trade service for simulated trading operations
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from loguru import logger
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessError
from app.models.enums import OrderModeEnum, OrderStatusEnum, OrderTypeEnum, ReportPeriodEnum
from app.models.trade import Order, Position, TradeReport
from app.models.user import Fund
from app.schemas.trade import FundResetRequest, OrderCreate
from app.services.market_service import MarketService


class TradeService:
    """Service for trade operations"""

    def __init__(self, db: Session):
        self.db = db
        self.market_service = MarketService(db)

    def get_fund(self, user_id: UUID) -> Fund:
        """Get user's fund, raise error if not found"""
        fund = self.db.query(Fund).filter(Fund.user_id == user_id).first()
        if not fund:
            raise BusinessError(
                code="FUND_NOT_FOUND",
                message="用户资金账户不存在",
                details={"user_id": str(user_id)},
            )
        return fund

    def get_stock_info(self, stock_code: str) -> tuple[str, Decimal]:
        """
        Get stock name and current price.

        Returns:
            tuple of (stock_name, current_price)

        Raises:
            BusinessError: If stock not found
        """
        stock_detail = self.market_service.get_stock_by_code(stock_code)
        if not stock_detail.latestPrice:
            raise BusinessError(
                code="KLINE_NOT_FOUND",
                message="该股票暂无价格数据",
                details={"stock_code": stock_code},
            )

        # Get realtime price for market orders
        realtime_quote = self.market_service.get_realtime_quote(stock_code)
        current_price = realtime_quote.price if realtime_quote else stock_detail.latestPrice

        return stock_detail.name, current_price

    def validate_order(self, user_id: UUID, data: OrderCreate) -> tuple[str, Decimal]:
        """
        Validate order before creation.

        Returns:
            tuple of (stock_name, current_price)
        """
        # Validate stock exists and get info
        stock_name, current_price = self.get_stock_info(data.stockCode)

        # Get user's fund
        fund = self.get_fund(user_id)

        # Validate limit price for limit orders
        if data.orderMode == OrderModeEnum.LIMIT and not data.limitPrice:
            raise BusinessError(
                code="INVALID_INPUT",
                message="限价单必须指定限价",
                details={"order_mode": data.orderMode.value},
            )

        # Calculate required amount
        if data.orderMode == OrderModeEnum.MARKET:
            # For market orders, use current price
            required_amount = current_price * data.quantity
        else:
            # For limit orders, use limit price (already validated above)
            assert data.limitPrice is not None
            required_amount = data.limitPrice * data.quantity

        # For buy orders, check available funds
        if data.orderType == OrderTypeEnum.BUY and fund.available < required_amount:
            raise BusinessError(
                code="INSUFFICIENT_FUND",
                message="可用资金不足",
                details={
                    "required": float(required_amount),
                    "available": float(fund.available),
                },
            )

        # For sell orders, check position
        if data.orderType == OrderTypeEnum.SELL:
            position = self.db.query(Position).filter(
                Position.user_id == user_id,
                Position.stock_code == data.stockCode,
            ).first()

            if not position or position.quantity < data.quantity:
                raise BusinessError(
                    code="POSITION_EMPTY",
                    message="持仓不足或不存在",
                    details={
                        "stock_code": data.stockCode,
                        "required_quantity": data.quantity,
                        "available_quantity": position.quantity if position else 0,
                    },
                )

        return stock_name, current_price

    def create_order(self, user_id: UUID, data: OrderCreate) -> Order:
        """
        Create a new order.

        For market orders: execute immediately
        For limit orders: freeze funds and wait for matching
        """
        logger.info(
            f"Order creation started: user={user_id}, stock={data.stockCode}, "
            f"type={data.orderType}, mode={data.orderMode}, quantity={data.quantity}"
        )

        stock_name, current_price = self.validate_order(user_id, data)
        fund = self.get_fund(user_id)

        # Create order
        order = Order(
            user_id=user_id,
            stock_code=data.stockCode,
            stock_name=stock_name,
            order_type=data.orderType,
            order_mode=data.orderMode,
            limit_price=data.limitPrice,
            quantity=data.quantity,
            status=OrderStatusEnum.PENDING,
        )

        # Handle based on order mode
        if data.orderMode == OrderModeEnum.MARKET:
            # Market order: execute immediately
            order.filled_price = current_price
            order.status = OrderStatusEnum.FILLED
            order.filled_at = datetime.utcnow()

            # Execute the trade
            self._execute_trade(user_id, order, fund)

        else:
            # Limit order: freeze funds
            self._freeze_funds(order, fund)

        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)

        logger.info(
            f"Order created: order_id={order.id}, status={order.status}, "
            f"filled_price={order.filled_price}"
        )

        return order

    def _freeze_funds(self, order: Order, fund: Fund) -> None:
        """Freeze funds for limit buy order"""
        if order.order_type == OrderTypeEnum.BUY:
            required_amount = order.limit_price * order.quantity
            fund.available -= required_amount
            fund.frozen += required_amount

    def _unfreeze_funds(self, order: Order, fund: Fund) -> None:
        """Unfreeze funds for cancelled limit buy order"""
        if order.order_type == OrderTypeEnum.BUY and order.order_mode == OrderModeEnum.LIMIT:
            frozen_amount = order.limit_price * order.quantity
            fund.available += frozen_amount
            fund.frozen -= frozen_amount

    def _execute_trade(self, user_id: UUID, order: Order, fund: Fund) -> None:
        """Execute the trade - update position and fund"""
        filled_price = order.filled_price
        quantity = order.quantity

        if order.order_type == OrderTypeEnum.BUY:
            # Buy: increase position
            position = self.db.query(Position).filter(
                Position.user_id == user_id,
                Position.stock_code == order.stock_code,
            ).first()

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
            position = self.db.query(Position).filter(
                Position.user_id == user_id,
                Position.stock_code == order.stock_code,
            ).first()

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
                self.db.delete(position)

    def cancel_order(self, user_id: UUID, order_id: UUID) -> bool:
        """Cancel a pending order"""
        logger.info(f"Order cancellation started: user={user_id}, order_id={order_id}")

        order = self.db.query(Order).filter(
            Order.id == order_id,
            Order.user_id == user_id,
            Order.status == OrderStatusEnum.PENDING,
        ).first()

        if not order:
            raise BusinessError(
                code="ORDER_NOT_FOUND",
                message="订单不存在或已成交",
                details={"order_id": str(order_id)},
            )

        # Unfreeze funds if it was a limit buy order
        fund = self.get_fund(user_id)
        self._unfreeze_funds(order, fund)

        order.status = OrderStatusEnum.CANCELLED
        self.db.commit()

        logger.info(f"Order cancelled: order_id={order_id}")
        return True

    def fill_limit_order(self, order_id: UUID, filled_price: Decimal) -> Order:
        """
        Fill a pending limit order.

        This method is called when market price matches the limit order price.
        """
        logger.info(
            f"Limit order fill started: order_id={order_id}, filled_price={filled_price}"
        )

        order = self.db.query(Order).filter(
            Order.id == order_id,
            Order.status == OrderStatusEnum.PENDING,
        ).first()

        if not order:
            raise BusinessError(
                code="ORDER_NOT_FOUND",
                message="订单不存在或已成交",
                details={"order_id": str(order_id)},
            )

        # Unfreeze funds first
        fund = self.get_fund(order.user_id)
        self._unfreeze_funds(order, fund)

        # Set filled price and status
        order.filled_price = filled_price
        order.status = OrderStatusEnum.FILLED
        order.filled_at = datetime.utcnow()

        # Execute the trade
        self._execute_trade(order.user_id, order, fund)

        self.db.commit()
        self.db.refresh(order)

        logger.info(
            f"Limit order filled: order_id={order.id}, filled_price={filled_price}"
        )

        return order

    def list_orders(
        self,
        user_id: UUID,
        status: OrderStatusEnum | None = None,
    ) -> list[Order]:
        """List user's orders"""
        query = self.db.query(Order).filter(Order.user_id == user_id)

        if status:
            query = query.filter(Order.status == status)

        return query.order_by(Order.created_at.desc()).all()

    def list_positions(self, user_id: UUID) -> list[Position]:
        """List user's positions with updated profit/loss"""
        positions = self.db.query(Position).filter(
            Position.user_id == user_id,
            Position.quantity > 0,
        ).all()

        # Update current price and profit/loss for each position
        for position in positions:
            try:
                _, current_price = self.get_stock_info(position.stock_code)
                position.current_price = current_price
                position.profit_loss = (current_price - position.avg_cost) * position.quantity
            except BusinessError:
                # If cannot get price, keep existing values
                pass

        return positions

    def reset_fund(self, user_id: UUID, data: FundResetRequest) -> bool:
        """Reset user's fund to initial capital"""
        fund = self.db.query(Fund).filter(Fund.user_id == user_id).first()

        if not fund:
            # Create new fund
            fund = Fund(
                user_id=user_id,
                total_balance=data.initialCapital,
                available=data.initialCapital,
                frozen=Decimal("0"),
                initial_capital=data.initialCapital,
            )
            self.db.add(fund)
        else:
            fund.total_balance = data.initialCapital
            fund.available = data.initialCapital
            fund.frozen = Decimal("0")
            fund.initial_capital = data.initialCapital

        # Clear all positions
        self.db.query(Position).filter(Position.user_id == user_id).delete()

        # Cancel all pending orders
        pending_orders = self.db.query(Order).filter(
            Order.user_id == user_id,
            Order.status == OrderStatusEnum.PENDING,
        ).all()

        for order in pending_orders:
            order.status = OrderStatusEnum.CANCELLED

        self.db.commit()

        return True

    def get_trade_reports(
        self,
        user_id: UUID,
        period_type: ReportPeriodEnum | None = None,
    ) -> list[TradeReport]:
        """Get user's trade reports"""
        query = self.db.query(TradeReport).filter(TradeReport.user_id == user_id)

        if period_type:
            query = query.filter(TradeReport.period_type == period_type)

        return query.order_by(TradeReport.period_date.desc()).all()
