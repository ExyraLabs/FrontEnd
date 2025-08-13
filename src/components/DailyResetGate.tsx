"use client";
import { useEffect } from "react";
import { useAppDispatch } from "../store";
import { checkDailyReset } from "../store/rewardsSlice";

export default function DailyResetGate() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(checkDailyReset());
  }, [dispatch]);
  return null;
}
