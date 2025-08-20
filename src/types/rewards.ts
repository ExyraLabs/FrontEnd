export type RewardCategory = "social" | "chat" | "defi" | "referral" | "other";

export interface RewardTask {
  id: string;
  title: string;
  description: string;
  category: RewardCategory;
  points: number; // base points for completion
  maxCompletions?: number; // if repeatable per day
  progress?: number; // runtime progress (messages sent etc)
  target?: number; // target count for progress tasks
  socialPlatform?: "x" | "discord" | "telegram";
  socialPhase?: "connect" | "engage"; // for two-step social tasks
  actionType?:
    | "connect"
    | "follow"
    | "join"
    | "send-message"
    | "stake"
    | "swap"
    | "bridge"
    | "provide-lp"
    | "lend";
  claimed?: boolean; // whether user claimed points (if claim step separate)
  completed?: boolean; // derived
  tierUnlock?: string; // optional badge name unlocked
}

export interface TierDefinition {
  id: string;
  name: string;
  minPoints: number;
  icon: string;
}

export interface RewardsStatePersisted {
  points: number;
  tasks: Record<
    string,
    { progress: number; completions: number; claimed: boolean }
  >; // progress tracking
  lastResetDate: string; // ISO date for daily reset of repeatable tasks
  chatMessageCount: number; // daily messages
}

// Redux replaces the former React context; interface retained only if needed for future adapter.
