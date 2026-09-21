import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  gap?: string;
}

/**
 * Skeleton shimmer placeholder for loading states.
 * - `className` applies to each skeleton bar.
 * - `count` repeats the bar N times (default 1), wrapped in a flex-col container.
 * - `gap` controls the gap class between bars when count > 1 (default "gap-3").
 */
const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1, gap = 'gap-3' }) => {
  const bar = (key: number) => (
    <div
      key={key}
      className={`animate-pulse rounded-xl bg-surface-container ${className}`}
    />
  );

  if (count === 1) return bar(0);

  return (
    <div className={`flex flex-col ${gap}`}>
      {Array.from({ length: count }, (_, i) => bar(i))}
    </div>
  );
};

export default Skeleton;
