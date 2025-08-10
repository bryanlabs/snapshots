"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toast";
import { QueryProvider } from "./providers/query-provider";
import { TelegramInvitationProvider } from "./providers/TelegramInvitationProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ToastProvider>
          <TelegramInvitationProvider>
            {children}
          </TelegramInvitationProvider>
        </ToastProvider>
      </QueryProvider>
    </SessionProvider>
  );
}