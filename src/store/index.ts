import { configureStore, Middleware } from "@reduxjs/toolkit";
import rewardsReducer, { saveRewardsToDb } from "./rewardsSlice";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// Simple throttle helper
const throttle = (fn: () => void, wait: number) => {
  let last = 0;
  let timeout: NodeJS.Timeout | null = null;
  return () => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      last = now;
      fn();
    } else if (!timeout) {
      timeout = setTimeout(() => {
        last = Date.now();
        timeout = null;
        fn();
      }, remaining);
    }
  };
};

const rewardActionTypes = new Set([
  "rewards/recordChatMessage",
  "rewards/completeSocialTask",
  "rewards/completeDefiAction",
  "rewards/claimTask",
]);

const rewardsPersistenceMiddleware: Middleware = (storeApi) => {
  const triggerSave = throttle(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (storeApi.dispatch as any)(saveRewardsToDb());
  }, 3000);
  return (next) => (action) => {
    const result = next(action);
    if (
      typeof (action as unknown as { type?: unknown }).type === "string" &&
      rewardActionTypes.has((action as { type: string }).type)
    ) {
      triggerSave();
    }
    return result;
  };
};

export const store = configureStore({
  reducer: {
    rewards: rewardsReducer,
  },
  middleware: (getDefault) => getDefault().concat(rewardsPersistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
