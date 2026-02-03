'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
}

export function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground text-xs sm:text-sm">{title}</span>
        <div className="text-teal-400">{icon}</div>
      </div>
      <div className="text-2xl sm:text-3xl font-bold">{value}</div>
      {trend && (
        <div className="text-xs text-green-500 mt-1">{trend}</div>
      )}
    </div>
  );
}
