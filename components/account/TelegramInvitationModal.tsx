"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TelegramInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTier: string;
  triggerSource?: 'upgrade' | 'dashboard' | 'manual';
}

export function TelegramInvitationModal({ 
  isOpen, 
  onClose, 
  userTier, 
  triggerSource = 'manual' 
}: TelegramInvitationModalProps) {
  const [step, setStep] = useState<'welcome' | 'username' | 'groups' | 'success'>('welcome');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const getAvailableGroups = () => {
    const groups = [];
    
    if (userTier === 'premium' || userTier === 'ultra') {
      groups.push({
        id: 'premium',
        name: 'BryanLabs Premium Users',
        description: 'Connect with other premium users, get priority support, and access exclusive content',
        icon: ChatBubbleLeftRightIcon,
        recommended: true
      });
    }
    
    if (userTier === 'ultra') {
      groups.push({
        id: 'ultra',
        name: 'BryanLabs Ultra VIP',
        description: 'Direct access to Dan for technical discussions, early feature previews, and personalized support',
        icon: UserGroupIcon,
        exclusive: true
      });
    }

    return groups;
  };

  const availableGroups = getAvailableGroups();

  useEffect(() => {
    if (isOpen) {
      setStep('welcome');
      setTelegramUsername('');
      setSelectedGroups([]);
      setError('');
      
      // Auto-select all available groups for upgrade flow
      if (triggerSource === 'upgrade') {
        setSelectedGroups(availableGroups.map(g => g.id));
      }
    }
  }, [isOpen, triggerSource]);

  const handleUsernameSubmit = async () => {
    if (!telegramUsername.trim()) {
      setError('Telegram username is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/account/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_telegram_info',
          telegramUsername: telegramUsername.replace('@', '')
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save username');
      }

      setStep('groups');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelection = async () => {
    if (selectedGroups.length === 0) {
      setError('Please select at least one group to join');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const promises = selectedGroups.map(groupType =>
        fetch('/api/account/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'request_invitation',
            groupType
          })
        })
      );

      const responses = await Promise.all(promises);
      
      // Check if all requests succeeded
      const failed = [];
      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          const errorData = await responses[i].json();
          failed.push(errorData.error);
        }
      }

      if (failed.length > 0) {
        throw new Error(failed.join(', '));
      }

      setStep('success');
      showToast('Telegram invitations requested successfully!', 'success');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserGroupIcon className="w-6 h-6 text-blue-600" />
          Welcome to the BryanLabs Community!
        </DialogTitle>
        <DialogDescription>
          {triggerSource === 'upgrade' 
            ? `Congratulations on upgrading to ${userTier}! You now have access to exclusive Telegram groups.`
            : `Join our Telegram community to connect with other users and get priority support.`
          }
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        <div className="space-y-4">
          <Alert>
            <InformationCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Our Telegram groups provide direct access to the BryanLabs team and community for support, 
              feature discussions, and networking with other blockchain developers.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3">
            {availableGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 text-blue-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{group.name}</h4>
                        {group.recommended && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                        {group.exclusive && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            Exclusive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {group.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Skip for Now
        </Button>
        <Button onClick={() => setStep('username')}>
          Join Community
        </Button>
      </DialogFooter>
    </>
  );

  const renderUsernameStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Add Your Telegram Username</DialogTitle>
        <DialogDescription>
          We need your Telegram username to send you group invitations.
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="telegram-username">Telegram Username</Label>
          <Input
            id="telegram-username"
            type="text"
            placeholder="username (without @)"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-gray-500">
            Enter your Telegram username without the @ symbol. This helps us identify you when processing invitations.
          </p>
        </div>

        <Alert>
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Note:</strong> Your Telegram username is only used for group invitations and is not shared publicly.
          </AlertDescription>
        </Alert>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setStep('welcome')}>
          Back
        </Button>
        <Button 
          onClick={handleUsernameSubmit}
          disabled={loading || !telegramUsername.trim()}
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </DialogFooter>
    </>
  );

  const renderGroupsStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Select Groups to Join</DialogTitle>
        <DialogDescription>
          Choose which Telegram groups you'd like to be invited to.
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {availableGroups.map((group) => {
            const Icon = group.icon;
            const isSelected = selectedGroups.includes(group.id);
            
            return (
              <div 
                key={group.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => {
                  if (isSelected) {
                    setSelectedGroups(prev => prev.filter(id => id !== group.id));
                  } else {
                    setSelectedGroups(prev => [...prev, group.id]);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <CheckCircleIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <Icon className="w-5 h-5 mt-0.5 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{group.name}</h4>
                      {group.recommended && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                      {group.exclusive && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          Exclusive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {group.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Alert>
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>
            You can always join additional groups later from your account settings.
          </AlertDescription>
        </Alert>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setStep('username')}>
          Back
        </Button>
        <Button 
          onClick={handleGroupSelection}
          disabled={loading || selectedGroups.length === 0}
        >
          {loading ? 'Requesting...' : 'Request Invitations'}
        </Button>
      </DialogFooter>
    </>
  );

  const renderSuccessStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
          Invitations Requested!
        </DialogTitle>
        <DialogDescription>
          Your Telegram group invitations have been submitted for review.
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4 space-y-4">
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>What happens next:</strong>
            <br />
            1. We'll review your invitation request (usually within 24 hours)
            <br />
            2. You'll receive an email with group invitation links
            <br />
            3. Click the links to join your selected Telegram groups
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Groups Requested:</h4>
          <div className="space-y-1">
            {selectedGroups.map(groupId => {
              const group = availableGroups.find(g => g.id === groupId);
              if (!group) return null;
              
              const Icon = group.icon;
              return (
                <div key={groupId} className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span>{group.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Alert>
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>
            You can check your invitation status and manage group access from your account settings.
          </AlertDescription>
        </Alert>
      </div>

      <DialogFooter>
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </DialogFooter>
    </>
  );

  if (availableGroups.length === 0) {
    return null; // Don't show modal if no groups are available
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'welcome' && renderWelcomeStep()}
        {step === 'username' && renderUsernameStep()}
        {step === 'groups' && renderGroupsStep()}
        {step === 'success' && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
}