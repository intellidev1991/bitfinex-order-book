import React, { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  connectWS,
  disconnectWS,
  updatePrecision,
  snapshotOrderBook,
  updateOrderBook,
} from "../store/orderBookSlice";

const OrderBook = () => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const { wsConnected, precision, orderBook } = useSelector(
    (state) => state.orderBook
  );

  const connectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    socketRef.current = new WebSocket("wss://api-pub.bitfinex.com/ws/2");

    socketRef.current.onopen = () => {
      dispatch(connectWS());
      const msg = JSON.stringify({
        event: "subscribe",
        channel: "book",
        symbol: "tBTCUSD",
        prec: precision,
      });
      socketRef.current.send(msg);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (Array.isArray(data) && data[1] !== "hb") {
        if (Array.isArray(data[1])) {
          const orders = data[1];
          if (orders.length > 3) {
            const bids = orders.filter((order) => order[2] > 0);
            const asks = orders.filter((order) => order[2] < 0);
            dispatch(snapshotOrderBook({ bids, asks }));
          } else {
            const [price, count, amount] = orders;
            dispatch(updateOrderBook({ price, count, amount }));
          }
        } else if (data.length === 3) {
          const [price, count, amount] = data;
          dispatch(updateOrderBook({ price, count, amount }));
        }
      }
    };

    socketRef.current.onclose = () => {
      dispatch(disconnectWS());
    };
  }, [dispatch, precision]);

  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket, precision]);

  const handlePrecisionChange = (event) => {
    dispatch(updatePrecision(event.target.value));
  };

  const calculateTotal = (orders) => {
    return orders.map((order) => ({
      ...order,
      total: Math.abs(order[2]) * order[0], // Total is Amount * Price
    }));
  };

  const formatSignificantDigits = (num, precision) => {
    const precisionLevels = {
      P0: 5,
      P1: 4,
      P2: 3,
      P3: 2,
      P4: 1,
    };
    const significantDigits = precisionLevels[precision];
    return parseFloat(num.toPrecision(significantDigits));
  };

  const getMaxAmount = (orders) => {
    return Math.max(...orders.map((order) => Math.abs(order[2])));
  };

  const getRowStyle = (amount, maxAmount, isBid) => {
    const percentage = (Math.abs(amount) / maxAmount) * 100;
    const color = isBid ? "rgba(0, 150, 0, 0.5)" : "rgba(150, 0, 0, 0.5)";
    return isBid
      ? {
          background: `linear-gradient(to left, ${color} ${percentage}%, transparent ${percentage}%)`,
        }
      : {
          background: `linear-gradient(to right, ${color} ${percentage}%, transparent ${percentage}%)`,
        };
  };

  const bidsWithTotal = calculateTotal(orderBook.bids);
  const asksWithTotal = calculateTotal(orderBook.asks);
  const maxBidAmount = getMaxAmount(orderBook.bids);
  const maxAskAmount = getMaxAmount(orderBook.asks);

  const renderConnectionStatus = () => {
    return (
      <div className="connection-status">
        <h1>Order Book</h1>
        <div>
          <button onClick={connectWebSocket} disabled={wsConnected}>
            Connect
          </button>
          <button onClick={disconnectWebSocket} disabled={!wsConnected}>
            Disconnect
          </button>
        </div>
      </div>
    );
  };

  const renderOrderBookHeader = () => {
    return (
      <div className="order-book-descriptor">
        <h2>
          ORDER BOOK <span className="order-book-name">BTC/USD</span>
        </h2>
        <label>
          Precision: &nbsp;
          <select value={precision} onChange={handlePrecisionChange}>
            <option value="P0">P0</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
            <option value="P4">P4</option>
          </select>
        </label>
      </div>
    );
  };

  const renderBidsTable = () => {
    return (
      <div className="order-book-column">
        <table>
          <thead>
            <tr>
              <th>Count</th>
              <th>Amount</th>
              <th>Total</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {bidsWithTotal.map((bid, index) => (
              <tr key={index} style={getRowStyle(bid[2], maxBidAmount, true)}>
                <td>{bid[1]}</td>
                <td>{formatSignificantDigits(bid[2], precision)}</td>
                <td>{formatSignificantDigits(bid.total, precision)}</td>
                <td>{formatSignificantDigits(bid[0], precision)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAsksTable = () => {
    return (
      <div className="order-book-column">
        <table>
          <thead>
            <tr>
              <th>Price</th>
              <th>Total</th>
              <th>Amount</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {asksWithTotal.map((ask, index) => (
              <tr key={index} style={getRowStyle(ask[2], maxAskAmount, false)}>
                <td>{formatSignificantDigits(ask[0], precision)}</td>
                <td>{formatSignificantDigits(ask.total, precision)}</td>
                <td>{formatSignificantDigits(Math.abs(ask[2]), precision)}</td>
                <td>{ask[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {renderConnectionStatus()}
      <div className="container">
        {renderOrderBookHeader()}
        <div className="order-book">
          {renderBidsTable()}
          {renderAsksTable()}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
