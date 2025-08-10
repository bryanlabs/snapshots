"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UseTelegramInvitationReturn {
  isModalOpen: boolean;
  openModal: (source?: 'upgrade' | 'dashboard' | 'manual') => void;
  closeModal: () => void;
  triggerSource: 'upgrade' | 'dashboard' | 'manual';
  shouldShowUpgradePrompt: boolean;
}

export function useTelegramInvitation(): UseTelegramInvitationReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [triggerSource, setTriggerSource] = useState<'upgrade' | 'dashboard' | 'manual'>('manual');
  const [shouldShowUpgradePrompt, setShouldShowUpgradePrompt] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Check if user just upgraded and should see telegram invitation
    const checkForUpgradeFlow = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const showTelegram = urlParams.get('telegram_invite');
      const upgradeSuccess = urlParams.get('upgrade_success');
      
      if (showTelegram === 'true' || upgradeSuccess === 'true') {
        // Check if user has a tier that provides telegram access
        const userTier = session?.user?.tier || 'free';
        if (userTier === 'premium' || userTier === 'ultra') {
          setShouldShowUpgradePrompt(true);
          
          // Auto-open modal after a short delay to allow page to load
          setTimeout(() => {
            openModal('upgrade');
          }, 1500);
        }
        
        // Clean up URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('telegram_invite');
        newUrl.searchParams.delete('upgrade_success');
        window.history.replaceState({}, '', newUrl.toString());
      }
    };

    if (session) {
      checkForUpgradeFlow();
    }
  }, [session]);

  const openModal = (source: 'upgrade' | 'dashboard' | 'manual' = 'manual') => {
    setTriggerSource(source);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShouldShowUpgradePrompt(false);
    
    // If this was triggered by upgrade flow, mark as seen
    if (triggerSource === 'upgrade') {
      localStorage.setItem('telegram_upgrade_prompt_seen', Date.now().toString());
    }
  };

  return {
    isModalOpen,
    openModal,
    closeModal,
    triggerSource,
    shouldShowUpgradePrompt
  };
}