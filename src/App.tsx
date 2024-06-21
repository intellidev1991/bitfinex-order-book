import React from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import OrderBook from "./components/OrderBook";
import "./App.css";

const App = () => {
  return (
    <Provider store={store}>
      <OrderBook />
    </Provider>
  );
};

export default App;
