"use client";
import { Provider } from "react-redux";
import { store } from "../store";
import DailyResetGate from "./DailyResetGate";

export default function ReduxProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <DailyResetGate />
      {children}
    </Provider>
  );
}
