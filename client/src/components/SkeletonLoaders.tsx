import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * NPC List Skeleton Loader
 * Displays a skeleton for NPC list items during loading
 */
export function NPCListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="w-16 h-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * NPC Detail Skeleton Loader
 * Displays a skeleton for NPC detail panel during loading
 */
export function NPCDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-start gap-4">
        <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>

      {/* Description Section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>

      {/* Likes/Dislikes Section */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-full rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * NPC Schedule Skeleton Loader
 * Displays a skeleton for NPC schedule panel during loading
 */
export function NPCScheduleSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton className="w-16 h-6 rounded" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-12 h-6 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Economy Panel Skeleton Loader
 * Displays a skeleton for economy data panel during loading
 */
export function EconomyPanelSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 border-b">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Market Prices Table Skeleton Loader
 * Displays a skeleton for market prices table during loading
 */
export function MarketPricesSkeleton() {
  return (
    <div className="space-y-2">
      {/* Header Row */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Data Rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border-b">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

/**
 * Bank Info Skeleton Loader
 * Displays a skeleton for bank information during loading
 */
export function BankInfoSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full rounded" />
      </div>
    </div>
  );
}

/**
 * Generic Loading State Component
 * Displays a loading indicator with optional message
 */
export function LoadingState({
  message = '加载中...',
  size = 'md',
}: {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className={`${sizeClasses[size]} border-2 border-primary border-t-transparent rounded-full animate-spin`} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * Empty State Component
 * Displays when no data is available
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      {Icon && <Icon className="w-12 h-12 text-muted-foreground" />}
      <div className="text-center">
        <h3 className="font-semibold text-lg">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Progress Indicator Component
 * Shows progress of data loading with percentage
 */
export function ProgressIndicator({
  progress,
  label,
}: {
  progress: number; // 0-100
  label?: string;
}) {
  const clampedProgress = Math.max(0, Math.min(progress, 100));

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">{Math.round(clampedProgress)}%</p>
    </div>
  );
}

/**
 * Batch Loading Indicator
 * Shows progress of batch data loading
 */
export function BatchLoadingIndicator({
  total,
  loaded,
  label = '加载中',
}: {
  total: number;
  loaded: number;
  label?: string;
}) {
  const progress = total > 0 ? (loaded / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {loaded} / {total}
        </p>
      </div>
      <ProgressIndicator progress={progress} />
    </div>
  );
}

/**
 * Shimmer Effect Skeleton
 * Enhanced skeleton with shimmer animation
 */
export function ShimmerSkeleton({
  className = '',
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${className} bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse`}
        />
      ))}
    </>
  );
}
