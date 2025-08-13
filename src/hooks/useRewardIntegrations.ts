"use client";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { completeSocialTask, completeDefiAction, setWallet, saveRewardsToDb } from "../store/rewardsSlice";

// Maps social platform identifiers to task socialPlatform values
export type SocialPlatform = "x" | "discord" | "telegram";

export const useRewardIntegrations = (wallet?: string | null) => {
  const dispatch = useAppDispatch();
  const rewards = useAppSelector((s) => s.rewards);

  // Ensure wallet is set for persistence
  if (wallet && rewards.wallet !== wallet) {
    dispatch(setWallet(wallet));
  }

  const handleSocialConnected = useCallback(
    async (platform: SocialPlatform) => {
      dispatch(completeSocialTask({ platform }));
      // Optional auto-claim after completion could be implemented here.
      dispatch(saveRewardsToDb());
    },
    [dispatch]
  );

  const handleDefiAction = useCallback(
    async (actionType: "swap" | "stake" | "bridge" | "provide-lp") => {
      dispatch(completeDefiAction({ actionType }));
      dispatch(saveRewardsToDb());
    },
    [dispatch]
  );

  return { handleSocialConnected, handleDefiAction };
};
