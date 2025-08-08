import { useState, useCallback } from "react";

interface UseCopyToClipboardOptions {
  timeout?: number;
  successMessage?: string;
}

interface CopyState {
  isCopied: boolean;
  isError: boolean;
  message?: string;
}

export const useCopyToClipboard = (options: UseCopyToClipboardOptions = {}) => {
  const { timeout = 2000, successMessage = "Copied!" } = options;
  const [copyState, setCopyState] = useState<CopyState>({
    isCopied: false,
    isError: false,
  });

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        // Modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand("copy");
          document.body.removeChild(textArea);

          if (!successful) {
            throw new Error("Copy failed");
          }
        }

        setCopyState({
          isCopied: true,
          isError: false,
          message: successMessage,
        });

        // Reset state after timeout
        setTimeout(() => {
          setCopyState({
            isCopied: false,
            isError: false,
          });
        }, timeout);
      } catch (error) {
        console.error("Failed to copy text:", error);
        setCopyState({
          isCopied: false,
          isError: true,
          message: "Failed to copy",
        });

        // Reset error state after timeout
        setTimeout(() => {
          setCopyState({
            isCopied: false,
            isError: false,
          });
        }, timeout);
      }
    },
    [timeout, successMessage]
  );

  return {
    copyToClipboard,
    isCopied: copyState.isCopied,
    isError: copyState.isError,
    message: copyState.message,
  };
};
