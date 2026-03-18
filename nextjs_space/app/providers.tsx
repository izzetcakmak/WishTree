'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect, ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Suppress ethers overflow errors globally
    const handler = (event: ErrorEvent) => {
      const msg = event?.message ?? '';
      if (msg?.includes?.('NUMERIC_FAULT') || msg?.includes?.('overflow') || msg?.includes?.('toNumber')) {
        event?.preventDefault?.();
        return true;
      }
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message ?? event?.reason?.toString?.() ?? '';
      if (msg?.includes?.('NUMERIC_FAULT') || msg?.includes?.('overflow') || msg?.includes?.('toNumber')) {
        event?.preventDefault?.();
        return true;
      }
    };
    window?.addEventListener?.('error', handler);
    window?.addEventListener?.('unhandledrejection', rejectionHandler);
    return () => {
      window?.removeEventListener?.('error', handler);
      window?.removeEventListener?.('unhandledrejection', rejectionHandler);
    };
  }, []);

  if (!mounted) {
    return <SessionProvider><div style={{ visibility: 'hidden' }}>{children}</div></SessionProvider>;
  }

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
