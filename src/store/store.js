import { configureStore } from "@reduxjs/toolkit";
import orderBookReducer from "../store/orderBookSlice";

export const store = configureStore({
  reducer: {
    orderBook: orderBookReducer,
  },
});
