import { useCallback } from "react";

export interface SavedPrompt {
  id: string;
  content: string;
  createdAt: string;
  title?: string;
}

const STORAGE_KEY = "exyra-saved-prompts";

export function useSavedPrompts() {
  // Load all saved prompts from localStorage
  const loadSavedPrompts = useCallback((): SavedPrompt[] => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, []);

  // Save all prompts to localStorage
  const saveSavedPrompts = useCallback((prompts: SavedPrompt[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }, []);

  // Add a new saved prompt
  const savePrompt = useCallback(
    (content: string, title?: string) => {
      const prompts = loadSavedPrompts();
      const newPrompt: SavedPrompt = {
        id: generateUUID(),
        content: content.trim(),
        title:
          title || content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        createdAt: new Date().toISOString(),
      };
      prompts.unshift(newPrompt); // Add to beginning
      saveSavedPrompts(prompts);
      return newPrompt;
    },
    [loadSavedPrompts, saveSavedPrompts]
  );

  // Delete a saved prompt by content
  const deletePromptByContent = useCallback(
    (content: string) => {
      const prompts = loadSavedPrompts();
      const filteredPrompts = prompts.filter(
        (prompt) => prompt.content.trim() !== content.trim()
      );
      saveSavedPrompts(filteredPrompts);
    },
    [loadSavedPrompts, saveSavedPrompts]
  );

  // Delete a saved prompt by ID
  const deletePrompt = useCallback(
    (promptId: string) => {
      const prompts = loadSavedPrompts();
      const filteredPrompts = prompts.filter(
        (prompt) => prompt.id !== promptId
      );
      saveSavedPrompts(filteredPrompts);
    },
    [loadSavedPrompts, saveSavedPrompts]
  );

  // Get a specific prompt by ID
  const getPrompt = useCallback(
    (promptId: string): SavedPrompt | null => {
      const prompts = loadSavedPrompts();
      return prompts.find((prompt) => prompt.id === promptId) || null;
    },
    [loadSavedPrompts]
  );

  // Check if a prompt is already saved
  const isPromptSaved = useCallback(
    (content: string): boolean => {
      const prompts = loadSavedPrompts();
      return prompts.some((prompt) => prompt.content.trim() === content.trim());
    },
    [loadSavedPrompts]
  );

  // Update a saved prompt
  const updatePrompt = useCallback(
    (promptId: string, updates: Partial<Omit<SavedPrompt, "id">>) => {
      const prompts = loadSavedPrompts();
      const promptIndex = prompts.findIndex((prompt) => prompt.id === promptId);
      if (promptIndex === -1) return false;

      prompts[promptIndex] = {
        ...prompts[promptIndex],
        ...updates,
      };
      saveSavedPrompts(prompts);
      return true;
    },
    [loadSavedPrompts, saveSavedPrompts]
  );

  return {
    loadSavedPrompts,
    savePrompt,
    deletePrompt,
    deletePromptByContent,
    getPrompt,
    updatePrompt,
    isPromptSaved,
  };
}

// Helper to generate a uuid (RFC4122 v4)
function generateUUID() {
  return [1, 1, 1, 1, 1]
    .map(() =>
      Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
    )
    .join("-")
    .replace(/-/g, "");
}
