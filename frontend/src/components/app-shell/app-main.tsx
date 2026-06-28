'use client';

import type { ReactNode } from 'react';

interface AppMainProps {
  children: ReactNode;
}

/** Main content scroll region for authenticated routes. */
export function AppMain({ children }: AppMainProps) {
  return <main className="flex-1 overflow-auto">{children}</main>;
}
