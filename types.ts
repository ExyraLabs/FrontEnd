// Types for different message types
export interface BaseMessage {
  id: string;
  type?: string;
  constructor: { name: string };
  createdAt?: string;
}

export interface ActionExecutionMessage extends BaseMessage {
  type: "ActionExecutionMessage";
  name: string;
  arguments: Record<string, unknown>;
  status?: { code: string };
}

export interface ResultMessage extends BaseMessage {
  type: "ResultMessage";
  result: string;
  actionExecutionId: string;
  actionName: string;
  status?: { code: string };
}

export interface CombinedToolCall extends BaseMessage {
  type: "CombinedToolCall";
  name: string;
  result?: ResultMessage;
}

export interface CopilotChatProps {
  agent: AgentDetails;
  roomId?: string | null;
}

export interface AgentDetails {
  id: string;
  name: string;
  status: "active" | "inactive";
  avatarUrl: string;
  description?: string;
  roomId?: string;
  framework?: "elizaos" | "copilot" | "langgraph" | "crewai";
}
