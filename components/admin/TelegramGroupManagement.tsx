"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface Invitation {
  id: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    telegramUsername: string;
    tier: string;
  };
  groupType: string;
  groupName: string;
  status: string;
  inviteToken: string;
  createdAt: string;
  invitedAt?: string;
  joinedAt?: string;
  expiresAt?: string;
  emailSent: boolean;
  emailSentAt?: string;
  remindersSent: number;
}

interface AdminData {
  invitations: Invitation[];
  summary: Record<string, Record<string, number>>;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function TelegramGroupManagement() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [bulkInviteLinks, setBulkInviteLinks] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterGroup) params.append('groupType', filterGroup);
      params.append('limit', '100');

      const response = await fetch(`/api/admin/telegram?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }
      
      const adminData = await response.json();
      setData(adminData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterGroup]);

  const handleBulkAction = async (action: string, actionData?: any) => {
    if (selectedInvitations.length === 0) {
      showToast('Please select invitations to process', 'error');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/admin/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_process',
          invitationIds: selectedInvitations,
          data: {
            newStatus: action,
            inviteLinks: action === 'invited' ? bulkInviteLinks : undefined,
            ...actionData
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process invitations');
      }

      showToast(result.message, 'success');
      setSelectedInvitations([]);
      setBulkInviteLinks({});
      await fetchData();
    } catch (error: any) {
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendEmail = async (invitationId: string) => {
    setProcessing(true);
    
    try {
      const response = await fetch('/api/admin/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_email_notification',
          invitationId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      showToast('Email notification marked as sent', 'success');
      await fetchData();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const exportInvitations = () => {
    if (!data) return;

    const csvData = data.invitations.map(inv => ({
      'User Email': inv.user.email,
      'Display Name': inv.user.displayName,
      'Telegram Username': inv.user.telegramUsername,
      'User Tier': inv.user.tier,
      'Group Type': inv.groupType,
      'Group Name': inv.groupName,
      'Status': inv.status,
      'Created At': new Date(inv.createdAt).toLocaleString(),
      'Invited At': inv.invitedAt ? new Date(inv.invitedAt).toLocaleString() : '',
      'Joined At': inv.joinedAt ? new Date(inv.joinedAt).toLocaleString() : '',
      'Email Sent': inv.emailSent ? 'Yes' : 'No',
      'Reminders Sent': inv.remindersSent
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram-invitations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { variant: 'secondary' as const, icon: ClockIcon },
      invited: { variant: 'default' as const, icon: EnvelopeIcon },
      joined: { variant: 'default' as const, icon: CheckCircleIcon },
      expired: { variant: 'destructive' as const, icon: ExclamationTriangleIcon },
      revoked: { variant: 'destructive' as const, icon: ExclamationTriangleIcon }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" />
            Telegram Group Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" />
            Telegram Group Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error || 'Failed to load admin data'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" />
            Telegram Group Management
          </CardTitle>
          <CardDescription>
            Manage Telegram group invitations and track membership status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
              <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(data.summary).map(([groupType, statuses]) => (
                  <Card key={groupType}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium capitalize">
                        {groupType} Group
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(statuses).map(([status, count]) => (
                        <div key={status} className="flex justify-between text-sm">
                          <span className="capitalize text-gray-600">{status}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={exportInvitations} variant="outline" size="sm">
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={fetchData} variant="outline" size="sm">
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="invitations" className="space-y-4 mt-6">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="status-filter">Filter by Status</Label>
                  <select
                    id="status-filter"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="invited">Invited</option>
                    <option value="joined">Joined</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="group-filter">Filter by Group</Label>
                  <select
                    id="group-filter"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                  >
                    <option value="">All Groups</option>
                    <option value="premium">Premium</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
              </div>

              {/* Invitations List */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Invitations ({data.invitations.length})</h3>
                    {selectedInvitations.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedInvitations.length} selected
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="divide-y">
                  {data.invitations.map((invitation) => (
                    <div key={invitation.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedInvitations.includes(invitation.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvitations(prev => [...prev, invitation.id]);
                            } else {
                              setSelectedInvitations(prev => prev.filter(id => id !== invitation.id));
                            }
                          }}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-sm">
                                {invitation.user.displayName || invitation.user.email}
                              </h4>
                              <p className="text-xs text-gray-500">
                                @{invitation.user.telegramUsername} • {invitation.user.tier} tier
                              </p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(invitation.status)}
                              <p className="text-xs text-gray-500 mt-1">
                                {invitation.groupName}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              Created: {new Date(invitation.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-4">
                              {invitation.emailSent && (
                                <span className="text-green-600">Email sent</span>
                              )}
                              {invitation.remindersSent > 0 && (
                                <span>{invitation.remindersSent} reminders</span>
                              )}
                              {invitation.status === 'invited' && !invitation.emailSent && (
                                <Button
                                  onClick={() => handleSendEmail(invitation.id)}
                                  size="sm"
                                  variant="outline"
                                  disabled={processing}
                                >
                                  Mark Email Sent
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk-actions" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bulk Processing</CardTitle>
                  <CardDescription>
                    Process multiple invitations at once
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {selectedInvitations.length === 0 && (
                    <Alert>
                      <Cog6ToothIcon className="h-4 w-4" />
                      <AlertDescription>
                        Select invitations from the Invitations tab to perform bulk actions.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {selectedInvitations.length > 0 && (
                    <>
                      <Alert>
                        <Cog6ToothIcon className="h-4 w-4" />
                        <AlertDescription>
                          {selectedInvitations.length} invitation(s) selected for processing.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Mark as Invited</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Use this when you've manually sent Telegram group invitations and want to mark them as processed.
                          </p>
                          <div className="space-y-3">
                            {selectedInvitations.map(id => {
                              const invitation = data.invitations.find(inv => inv.id === id);
                              if (!invitation) return null;
                              
                              return (
                                <div key={id} className="flex items-center gap-3">
                                  <span className="text-sm flex-1">
                                    {invitation.user.displayName} ({invitation.groupName})
                                  </span>
                                  <Input
                                    placeholder="Telegram invite link (optional)"
                                    value={bulkInviteLinks[id] || ''}
                                    onChange={(e) => setBulkInviteLinks(prev => ({
                                      ...prev,
                                      [id]: e.target.value
                                    }))}
                                    className="w-64"
                                  />
                                </div>
                              );
                            })}
                            <Button
                              onClick={() => handleBulkAction('invited')}
                              disabled={processing}
                              className="w-full"
                            >
                              {processing ? 'Processing...' : 'Mark as Invited'}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleBulkAction('joined')}
                            disabled={processing}
                            variant="outline"
                          >
                            Mark as Joined
                          </Button>
                          <Button
                            onClick={() => handleBulkAction('revoked', { reason: 'Admin bulk action' })}
                            disabled={processing}
                            variant="destructive"
                          >
                            Revoke Invitations
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}