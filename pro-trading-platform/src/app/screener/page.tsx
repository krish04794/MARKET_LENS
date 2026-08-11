"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/store/useDashboardStore';

export default function ScreenerRedirect() {
  const { setActiveTab } = useDashboardStore();
  const router = useRouter();

  useEffect(() => {
    setActiveTab('Screener');
    router.replace('/');
  }, [setActiveTab, router]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="animate-pulse font-medium text-muted-foreground text-sm">
        Loading AI Screener...
      </div>
    </div>
  );
}
