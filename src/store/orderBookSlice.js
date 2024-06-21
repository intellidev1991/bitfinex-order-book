import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  wsConnected: false,
  precision: "P0", // Default precision
  orderBook: {
    bids: [],
    asks: [],
  },
};

const orderBookSlice = createSlice({
  name: "orderBook",
  initialState,
  reducers: {
    connectWS(state) {
      state.wsConnected = true;
    },
    disconnectWS(state) {
      state.wsConnected = false;
    },
    updatePrecision(state, action) {
      state.precision = action.payload;
    },
    snapshotOrderBook(state, action) {
      const { bids, asks } = action.payload;
      state.orderBook.bids = bids;
      state.orderBook.asks = asks;
    },
    updateOrderBook(state, action) {
      const { price, count, amount } = action.payload;
      const bookType = amount > 0 ? "bids" : "asks";
      const orderBook = state.orderBook[bookType];

      if (count === 0) {
        // Remove the order
        state.orderBook[bookType] = orderBook.filter(
          (order) => order[0] !== price
        );
      } else {
        // Update or add the order
        const existingOrderIndex = orderBook.findIndex(
          (order) => order[0] === price
        );
        if (existingOrderIndex >= 0) {
          orderBook[existingOrderIndex] = [price, count, amount];
        } else {
          state.orderBook[bookType].push([price, count, amount]);
        }
      }

      // Sort the order books
      state.orderBook.bids = state.orderBook.bids.sort((a, b) => b[0] - a[0]);
      state.orderBook.asks = state.orderBook.asks.sort((a, b) => a[0] - b[0]);
    },
  },
});

export const {
  connectWS,
  disconnectWS,
  updatePrecision,
  snapshotOrderBook,
  updateOrderBook,
} = orderBookSlice.actions;
export default orderBookSlice.reducer;
