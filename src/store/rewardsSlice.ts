import {
  createSlice,
  PayloadAction,
  createSelector,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { RewardTask, TierDefinition } from "../types/rewards";
import {
  getUserRewardsState,
  updateUserRewardsState,
} from "../actions/rewards";

// Static tier definitions
const tiers: TierDefinition[] = [
  { id: "bronze", name: "Bronze", minPoints: 0, icon: "/icons/bronze.svg" },
  { id: "silver", name: "Silver", minPoints: 500, icon: "/icons/silver.svg" },
  { id: "gold", name: "Gold", minPoints: 1500, icon: "/icons/gold.svg" },
];

// Initial task catalogue (could be fetched from backend later)
const baseTasks: RewardTask[] = [
  // Social
  {
    id: "social-x-follow",
    title: "Follow us on X",
    description: "Connect your wallet & follow the official X account.",
    category: "social",
    points: 100,
    socialPlatform: "x",
    actionType: "follow",
  },
  {
    id: "social-discord-join",
    title: "Join Discord",
    description: "Join the community Discord server.",
    category: "social",
    points: 120,
    socialPlatform: "discord",
    actionType: "join",
  },
  {
    id: "social-telegram-join",
    title: "Join Telegram",
    description: "Join the announcements Telegram channel.",
    category: "social",
    points: 80,
    socialPlatform: "telegram",
    actionType: "join",
  },
  // Chat
  {
    id: "chat-first-message",
    title: "Send your first message",
    description: "Ask the agent any question.",
    category: "chat",
    points: 20,
    maxCompletions: 1,
    progress: 0,
    target: 1,
    actionType: "send-message",
  },
  {
    id: "chat-10-messages",
    title: "Engage with 10 messages",
    description: "Have a deeper conversation with the agent.",
    category: "chat",
    points: 70,
    maxCompletions: 1,
    progress: 0,
    target: 10,
    actionType: "send-message",
  },
  // DeFi placeholder tasks (completed when we dispatch appropriate action externally)
  {
    id: "defi-first-swap",
    title: "Execute first swap",
    description: "Complete one token swap via the platform.",
    category: "defi",
    points: 150,
    maxCompletions: 1,
    progress: 0,
    target: 1,
    actionType: "swap",
  },
  {
    id: "defi-first-stake",
    title: "Stake tokens",
    description: "Stake any supported token.",
    category: "defi",
    points: 200,
    maxCompletions: 1,
    progress: 0,
    target: 1,
    actionType: "stake",
  },
  {
    id: "referral-invite",
    title: "Refer a friend",
    description: "Invite a friend who completes at least one action.",
    category: "referral",
    points: 250,
    maxCompletions: 5,
    progress: 0,
    target: 1,
    // referral not mapped to a defi/social actionType yet
  },
];

export interface RewardsSliceState {
  points: number;
  tasks: Record<
    string,
    RewardTask & { progress: number; completions: number; claimed: boolean }
  >;
  chatMessageCount: number;
  dailyMessageLimit: number;
  lastResetDate: string | null; // ISO date (yyyy-mm-dd)
  wallet?: string | null; // current user wallet for persistence
  saving?: boolean;
  lastSaveError?: string | null;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const buildInitialState = (): RewardsSliceState => {
  const tasks: RewardsSliceState["tasks"] = {};
  baseTasks.forEach((t) => {
    tasks[t.id] = {
      ...t,
      progress: t.progress ?? 0,
      completions: 0,
      claimed: false,
    };
  });
  return {
    points: 0,
    tasks,
    chatMessageCount: 0,
    dailyMessageLimit: 30,
    lastResetDate: todayISO(),
    wallet: null,
    saving: false,
    lastSaveError: null,
  };
};

const initialState: RewardsSliceState = buildInitialState();

interface DefiActionPayload {
  actionType: RewardTask["actionType"];
}
interface SocialActionPayload {
  platform: RewardTask["socialPlatform"];
}

export const rewardsSlice = createSlice({
  name: "rewards",
  initialState,
  reducers: {
    setWallet(state, action: PayloadAction<string | null>) {
      state.wallet = action.payload;
    },
    checkDailyReset(state) {
      const today = todayISO();
      if (state.lastResetDate !== today) {
        state.lastResetDate = today;
        state.chatMessageCount = 0;
        // reset repeatable tasks (progress & claimed if daily?) - for now only progress of chat tasks
        Object.values(state.tasks).forEach((task) => {
          if (task.category === "chat") {
            task.progress = 0;
            task.claimed = false;
            task.completions = 0; // daily tasks reset completions
          }
        });
      }
    },
    recordChatMessage(state) {
      if (state.chatMessageCount >= state.dailyMessageLimit) return; // cap
      state.chatMessageCount += 1;
      // Update chat tasks progress
      Object.values(state.tasks).forEach((task) => {
        if (task.actionType === "send-message" && !task.completed) {
          task.progress = Math.min(
            (task.progress ?? 0) + 1,
            task.target ?? Infinity
          );
          if (task.progress >= (task.target ?? 0)) {
            task.completed = true;
          }
        }
      });
    },
    completeSocialTask(state, action: PayloadAction<SocialActionPayload>) {
      const task = Object.values(state.tasks).find(
        (t) => t.socialPlatform === action.payload.platform
      );
      if (task && !task.completed) {
        task.completed = true;
      }
    },
    completeDefiAction(state, action: PayloadAction<DefiActionPayload>) {
      const task = Object.values(state.tasks).find(
        (t) => t.actionType === action.payload.actionType
      );
      if (task && !task.completed) {
        task.completed = true;
      }
    },
    claimTask(state, action: PayloadAction<{ taskId: string }>) {
      const task = state.tasks[action.payload.taskId];
      if (!task) return;
      if (task.completed && !task.claimed) {
        task.claimed = true;
        task.completions += 1;
        state.points += task.points;
        // If task is repeatable (maxCompletions > completions) allow resetting completion for next round (daily referrals etc.)
        if (task.maxCompletions && task.completions < task.maxCompletions) {
          task.completed = false;
          if (task.target) task.progress = 0;
        }
      }
    },
    // Utility to hydrate from persisted source later
    hydrate(state, action: PayloadAction<Partial<RewardsSliceState>>) {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadRewardsFromDb.pending, (state) => {
        state.saving = true;
        state.lastSaveError = null;
      })
      .addCase(loadRewardsFromDb.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          // merge persisted minimal structure into runtime tasks
          const persisted = action.payload;
          state.points = persisted.points ?? state.points;
          state.lastResetDate = persisted.lastResetDate ?? state.lastResetDate;
          state.chatMessageCount =
            persisted.chatMessageCount ?? state.chatMessageCount;
          Object.entries(persisted.tasks || {}).forEach(([taskId, meta]) => {
            if (state.tasks[taskId]) {
              state.tasks[taskId].progress = meta.progress;
              state.tasks[taskId].completions = meta.completions;
              state.tasks[taskId].claimed = meta.claimed;
              // derive completed
              if (state.tasks[taskId].target) {
                state.tasks[taskId].completed =
                  state.tasks[taskId].progress >=
                  (state.tasks[taskId].target || 0);
              }
            }
          });
        }
      })
      .addCase(loadRewardsFromDb.rejected, (state, action) => {
        state.saving = false;
        state.lastSaveError = action.error.message || "Failed to load rewards";
      })
      .addCase(saveRewardsToDb.pending, (state) => {
        state.saving = true;
        state.lastSaveError = null;
      })
      .addCase(saveRewardsToDb.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveRewardsToDb.rejected, (state, action) => {
        state.saving = false;
        state.lastSaveError = action.error.message || "Failed to save";
      });
  },
});

export const {
  setWallet,
  recordChatMessage,
  completeSocialTask,
  completeDefiAction,
  claimTask,
  checkDailyReset,
  hydrate,
} = rewardsSlice.actions;

// Async thunks
export const loadRewardsFromDb = createAsyncThunk(
  "rewards/load",
  async (wallet: string, { rejectWithValue }) => {
    try {
      const data = await getUserRewardsState(wallet);
      return data;
    } catch (e: unknown) {
      const err = e as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const saveRewardsToDb = createAsyncThunk(
  "rewards/save",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { rewards: RewardsSliceState };
      const { wallet } = state.rewards;
      if (!wallet) return;
      // build minimal persisted shape
      const persisted = {
        points: state.rewards.points,
        lastResetDate: state.rewards.lastResetDate || todayISO(),
        chatMessageCount: state.rewards.chatMessageCount,
        tasks: Object.fromEntries(
          Object.entries(state.rewards.tasks).map(([id, t]) => [
            id,
            {
              progress: t.progress,
              completions: t.completions,
              claimed: !!t.claimed,
            },
          ])
        ),
      };
      await updateUserRewardsState(wallet, persisted);
    } catch (e: unknown) {
      const err = e as Error;
      return rejectWithValue(err.message);
    }
  }
);

// Selectors
export const selectRewardsState = (s: { rewards: RewardsSliceState }) =>
  s.rewards;
export const selectPoints = (s: { rewards: RewardsSliceState }) =>
  s.rewards.points;
export const selectChatMessageCount = (s: { rewards: RewardsSliceState }) =>
  s.rewards.chatMessageCount;
export const selectDailyMessageLimit = (s: { rewards: RewardsSliceState }) =>
  s.rewards.dailyMessageLimit;

export const selectTasksArray = createSelector(selectRewardsState, (state) =>
  Object.values(state.tasks)
);

export const selectTierInfo = createSelector(selectRewardsState, (state) => {
  const points = state.points;
  const current =
    [...tiers].reverse().find((t) => points >= t.minPoints) || tiers[0];
  const next = tiers.find(
    (t) => t.minPoints > current.minPoints && points < t.minPoints
  );
  return { current, next, tiers };
});

export default rewardsSlice.reducer;
