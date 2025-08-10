"use client";

import { useSession } from 'next-auth/react';
import { TelegramInvitationModal } from '@/components/account/TelegramInvitationModal';
import { useTelegramInvitation } from '@/hooks/useTelegramInvitation';

interface TelegramInvitationProviderProps {
  children: React.ReactNode;
}

export function TelegramInvitationProvider({ children }: TelegramInvitationProviderProps) {
  const { data: session } = useSession();
  const { isModalOpen, closeModal, triggerSource } = useTelegramInvitation();

  const userTier = session?.user?.tier || 'free';

  return (
    <>
      {children}
      <TelegramInvitationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        userTier={userTier}
        triggerSource={triggerSource}
      />
    </>
  );
}