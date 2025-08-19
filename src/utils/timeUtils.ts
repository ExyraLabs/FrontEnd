/**
 * Format a date to relative time (e.g., "2 hours ago", "3 days ago") or absolute date for older items
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // If it's within the last minute
  if (diffInSeconds < 60) {
    return "Just now";
  }

  // If it's within the last hour
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  // If it's within the last 24 hours
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  // If it's within the last week
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }

  // If it's within the last month
  if (diffInDays < 30) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
  }

  // If it's within the last year
  if (diffInDays < 365) {
    return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
  }

  // For older dates, show the actual date
  if (diffInYears >= 1) {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // Fallback
  return date.toLocaleDateString();
}

/**
 * Get relative time for a chat based on its most recent message
 */
export function getChatRelativeTime(messages: { createdAt: string }[]): string {
  if (!messages || messages.length === 0) {
    return "";
  }

  // Find the most recent message
  const mostRecentMessage = messages.reduce((latest, current) => {
    const currentDate = new Date(current.createdAt);
    const latestDate = new Date(latest.createdAt);
    return currentDate > latestDate ? current : latest;
  });

  return formatRelativeTime(new Date(mostRecentMessage.createdAt));
}
