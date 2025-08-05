"use client";

import React from "react";

interface GradientLineProps {
  className?: string;
}

const GradientLine: React.FC<GradientLineProps> = ({
  className = "absolute left-3 top-0 w-[1px] h-full",
}) => {
  // Generate a unique gradient ID to avoid conflicts when multiple instances are used
  const gradientId = React.useMemo(
    () => `lineGradient-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  return (
    <svg className={className} viewBox="0 0 2 100" preserveAspectRatio="none">
      <defs>
        <linearGradient
          suppressHydrationWarning
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
          <stop offset="15%" stopColor="var(--color-primary)" stopOpacity="1" />
          <stop offset="85%" stopColor="var(--color-primary)" stopOpacity="1" />
          <stop
            offset="100%"
            stopColor="var(--color-primary)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <rect
        suppressHydrationWarning
        x="0"
        y="0"
        width="2"
        height="100"
        fill={`url(#${gradientId})`}
        rx="1"
        ry="1"
      />
    </svg>
  );
};

export default GradientLine;
