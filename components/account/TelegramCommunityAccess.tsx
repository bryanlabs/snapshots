"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface TelegramStatus {
  userTier: string;
  telegramUsername?: string;
  telegramUserId?: string;
  availableGroups: string[];
  invitations: Record<string, any>;
  communityAccess: {
    free: { available: boolean; description: string };
    premium: { available: boolean; description: string; groupName: string };
    ultra: { available: boolean; description: string; groupName: string };
  };
}

export function TelegramCommunityAccess() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/account/telegram');
      if (!response.ok) {
        throw new Error('Failed to fetch telegram status');
      }
      const data = await response.json();
      setStatus(data);
      setTelegramUsername(data.telegramUsername || '');
    } catch (error) {
      console.error('Error fetching telegram status:', error);
      setError('Failed to load Telegram community status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const updateTelegramUsername = async () => {
    if (!telegramUsername.trim()) {
      setError('Telegram username is required');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const response = await fetch('/api/account/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_telegram_info',
          telegramUsername: telegramUsername.replace('@', '') // Remove @ if present
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update username');
      }

      showToast('Telegram username updated successfully', 'success');
      await fetchStatus();
    } catch (error: any) {
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const requestInvitation = async (groupType: string) => {
    setUpdating(true);
    setError('');

    try {
      const response = await fetch('/api/account/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_invitation',
          groupType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request invitation');
      }

      showToast('Telegram invitation requested successfully', 'success');
      await fetchStatus();
    } catch (error: any) {
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const cancelInvitation = async (groupType: string) => {
    setUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/account/telegram?groupType=${groupType}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      showToast('Telegram invitation cancelled', 'success');
      await fetchStatus();
    } catch (error: any) {
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (invitation: any) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: ClockIcon, text: 'Pending Review' },
      invited: { variant: 'default' as const, icon: ChatBubbleLeftRightIcon, text: 'Invitation Sent' },
      joined: { variant: 'default' as const, icon: CheckCircleIcon, text: 'Joined' },
      expired: { variant: 'destructive' as const, icon: ExclamationTriangleIcon, text: 'Expired' },
      revoked: { variant: 'destructive' as const, icon: ExclamationTriangleIcon, text: 'Cancelled' }
    };

    const config = statusConfig[invitation.status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" />
            Telegram Community Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" />
            Telegram Community Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error || 'Failed to load community access information'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5" />
          Telegram Community Access
        </CardTitle>
        <CardDescription>
          Connect with the BryanLabs community and get support based on your tier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Tier Status */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Tier</span>
            <Badge variant="outline" className="capitalize">
              {status.userTier}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {status.communityAccess[status.userTier as keyof typeof status.communityAccess]?.description}
          </p>
        </div>

        {/* Telegram Username Setup */}
        <div className="space-y-3">
          <Label htmlFor="telegram-username">Telegram Username</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="telegram-username"
                type="text"
                placeholder="Enter your Telegram username (without @)"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                disabled={updating}
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps us identify you when processing group invitations
              </p>
            </div>
            <Button 
              onClick={updateTelegramUsername}
              disabled={updating || !telegramUsername.trim()}
              size="sm"
            >
              {updating ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Community Access Levels */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Available Community Access</h4>
          
          {/* Free Tier */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-900 dark:text-white">Free Community</h5>
              <Badge variant="secondary">Always Available</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {status.communityAccess.free.description}
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com/bryanlabs/community" target="_blank" rel="noopener noreferrer">
                Visit Forums <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </div>

          {/* Premium Tier */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-900 dark:text-white">
                {status.communityAccess.premium.groupName}
              </h5>
              {status.availableGroups.includes('premium') ? (
                <Badge variant="default">Available</Badge>
              ) : (
                <Badge variant="secondary">Premium Required</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {status.communityAccess.premium.description}
            </p>
            
            {status.availableGroups.includes('premium') ? (
              status.invitations.premium ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(status.invitations.premium)}
                    <span className="text-xs text-gray-500">
                      {status.invitations.premium.invitedAt 
                        ? `Invited: ${new Date(status.invitations.premium.invitedAt).toLocaleDateString()}`
                        : `Requested: ${new Date(status.invitations.premium.createdAt).toLocaleDateString()}`
                      }
                    </span>
                  </div>
                  
                  {status.invitations.premium.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => cancelInvitation('premium')}
                        disabled={updating}
                      >
                        Cancel Request
                      </Button>
                    </div>
                  )}

                  {status.invitations.premium.status === 'invited' && (
                    <Alert>
                      <InformationCircleIcon className="h-4 w-4" />
                      <AlertDescription>
                        Check your email for Telegram group invitation instructions. 
                        If you haven't received it, contact support.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={() => requestInvitation('premium')}
                  disabled={updating || !status.telegramUsername}
                  size="sm"
                >
                  {updating ? 'Requesting...' : 'Request Invitation'}
                </Button>
              )
            ) : (
              <Button variant="outline" size="sm" asChild>
                <a href="/pricing">Upgrade to Premium</a>
              </Button>
            )}
          </div>

          {/* Ultra Tier */}
          <div className="border rounded-lg p-4 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-900 dark:text-white">
                {status.communityAccess.ultra.groupName}
              </h5>
              {status.availableGroups.includes('ultra') ? (
                <Badge variant="default" className="bg-purple-600">Available</Badge>
              ) : (
                <Badge variant="secondary">Ultra Required</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {status.communityAccess.ultra.description}
            </p>
            
            {status.availableGroups.includes('ultra') ? (
              status.invitations.ultra ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(status.invitations.ultra)}
                    <span className="text-xs text-gray-500">
                      {status.invitations.ultra.invitedAt 
                        ? `Invited: ${new Date(status.invitations.ultra.invitedAt).toLocaleDateString()}`
                        : `Requested: ${new Date(status.invitations.ultra.createdAt).toLocaleDateString()}`
                      }
                    </span>
                  </div>
                  
                  {status.invitations.ultra.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => cancelInvitation('ultra')}
                        disabled={updating}
                      >
                        Cancel Request
                      </Button>
                    </div>
                  )}

                  {status.invitations.ultra.status === 'invited' && (
                    <Alert>
                      <CheckCircleIcon className="h-4 w-4" />
                      <AlertDescription>
                        You've been invited to the Ultra VIP group! Check your email for the personal invitation from Dan.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={() => requestInvitation('ultra')}
                  disabled={updating || !status.telegramUsername}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {updating ? 'Requesting...' : 'Request VIP Access'}
                </Button>
              )
            ) : (
              <Button variant="outline" size="sm" asChild>
                <a href="/pricing">Upgrade to Ultra</a>
              </Button>
            )}
          </div>
        </div>

        {!status.telegramUsername && (
          <Alert>
            <InformationCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Add your Telegram username above to request group invitations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}