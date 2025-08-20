"use client";
import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  completeSocialTask,
  completeSocialPhase,
  completeDefiAction,
  setWallet,
  saveRewardsToDb,
} from "../store/rewardsSlice";

// Maps social platform identifiers to task socialPlatform values
export type SocialPlatform = "x" | "discord" | "telegram";

export const useRewardIntegrations = (wallet?: string | null) => {
  const dispatch = useAppDispatch();
  const rewards = useAppSelector((s) => s.rewards);

  // Ensure wallet is set for persistence (move to effect to avoid dispatch during render)
  useEffect(() => {
    if (wallet && rewards.wallet !== wallet) {
      dispatch(setWallet(wallet));
    }
  }, [wallet, rewards.wallet, dispatch]);

  // Generic sequential handler: call for connect phase first, later call with phase="engage"
  const handleSocialConnected = useCallback(
    async (
      platform: SocialPlatform,
      phase: "connect" | "engage" = "connect"
    ) => {
      if (phase === "connect") {
        dispatch(completeSocialPhase({ platform, phase: "connect" }));
      } else {
        dispatch(completeSocialPhase({ platform, phase: "engage" }));
      }
      dispatch(saveRewardsToDb());
    },
    [dispatch]
  );

  // Backwards compatibility single-step (deprecated) – still exposed
  const handleLegacySocialComplete = useCallback(
    async (platform: SocialPlatform) => {
      dispatch(completeSocialTask({ platform }));
      dispatch(saveRewardsToDb());
    },
    [dispatch]
  );

  const handleDefiAction = useCallback(
    async (actionType: "swap" | "stake" | "bridge" | "provide-lp" | "lend") => {
      dispatch(completeDefiAction({ actionType }));
      dispatch(saveRewardsToDb());
    },
    [dispatch]
  );

  return {
    handleSocialConnected,
    handleLegacySocialComplete,
    handleDefiAction,
  };
};
