/**
 * OC Pipeline - Organization Settings Component
 * Company profile and settings management (org admins only)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Save,
  Upload,
  Shield,
  Bell,
  Palette,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { OrgAdminGate } from '@/contexts/PermissionContext';

interface OrgProfile {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: OrgSettings;
  subscription_tier: string;
  subscription_status: string;
  max_users: number;
  max_projects: number;
}

interface OrgSettings {
  theme?: 'light' | 'dark' | 'system';
  timezone?: string;
  date_format?: string;
  currency?: string;
  notifications?: {
    email_enabled?: boolean;
    slack_enabled?: boolean;
    daily_digest?: boolean;
  };
  security?: {
    mfa_required?: boolean;
    session_timeout_minutes?: number;
    ip_whitelist?: string[];
  };
  branding?: {
    primary_color?: string;
    accent_color?: string;
  };
}

export function OrgSettings() {
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [settings, setSettings] = useState<OrgSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchOrgProfile();
  }, []);

  const fetchOrgProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/v1/org/profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch organization profile');

      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        setSettings(result.data.settings || {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/v1/org/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          name: profile.name,
          logo_url: profile.logo_url,
          settings,
        }),
      });

      if (!response.ok) throw new Error('Failed to save organization profile');

      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        setSuccess('Organization profile saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (path: string, value: unknown) => {
    setSettings((prev) => {
      const updated = { ...prev };
      const parts = path.split('.');
      let current: Record<string, unknown> = updated;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }

      current[parts[parts.length - 1]] = value;
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <OrgAdminGate
      fallback={
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access organization settings.
          </AlertDescription>
        </Alert>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
            <p className="text-gray-500 mt-1">
              Manage your company profile and configuration
            </p>
          </div>
          <Button onClick={saveProfile} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <Building2 className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="regional">
              <Globe className="h-4 w-4 mr-2" />
              Regional
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={profile?.name || ''}
                      onChange={(e) =>
                        setProfile((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev
                        )
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input id="slug" value={profile?.slug || ''} disabled />
                    <p className="text-sm text-gray-500">
                      This is your organization's unique identifier
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      {profile?.logo_url ? (
                        <img
                          src={profile.logo_url}
                          alt="Logo"
                          className="h-16 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded bg-gray-100 flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">Subscription</h3>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        profile?.subscription_tier === 'enterprise'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {profile?.subscription_tier || 'Free'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {profile?.max_users} users • {profile?.max_projects} projects
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of OC Pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Theme</Label>
                    <div className="flex gap-2">
                      {['light', 'dark', 'system'].map((theme) => (
                        <Button
                          key={theme}
                          variant={
                            settings.theme === theme ? 'default' : 'outline'
                          }
                          onClick={() => updateSetting('theme', theme)}
                        >
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        className="w-16 h-10"
                        value={settings.branding?.primary_color || '#3B82F6'}
                        onChange={(e) =>
                          updateSetting('branding.primary_color', e.target.value)
                        }
                      />
                      <Input
                        value={settings.branding?.primary_color || '#3B82F6'}
                        onChange={(e) =>
                          updateSetting('branding.primary_color', e.target.value)
                        }
                        className="w-32"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how your team receives notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications?.email_enabled ?? true}
                      onCheckedChange={(checked) =>
                        updateSetting('notifications.email_enabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Slack Integration</Label>
                      <p className="text-sm text-gray-500">
                        Send notifications to Slack channels
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications?.slack_enabled ?? false}
                      onCheckedChange={(checked) =>
                        updateSetting('notifications.slack_enabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Daily Digest</Label>
                      <p className="text-sm text-gray-500">
                        Receive a daily summary of activity
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications?.daily_digest ?? false}
                      onCheckedChange={(checked) =>
                        updateSetting('notifications.daily_digest', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security policies for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require MFA</Label>
                      <p className="text-sm text-gray-500">
                        All users must enable multi-factor authentication
                      </p>
                    </div>
                    <Switch
                      checked={settings.security?.mfa_required ?? false}
                      onCheckedChange={(checked) =>
                        updateSetting('security.mfa_required', checked)
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="session_timeout">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="session_timeout"
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.security?.session_timeout_minutes || 60}
                      onChange={(e) =>
                        updateSetting(
                          'security.session_timeout_minutes',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-32"
                    />
                    <p className="text-sm text-gray-500">
                      Users will be logged out after this period of inactivity
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="ip_whitelist">IP Whitelist</Label>
                    <Textarea
                      id="ip_whitelist"
                      placeholder="Enter IP addresses, one per line"
                      value={
                        settings.security?.ip_whitelist?.join('\n') || ''
                      }
                      onChange={(e) =>
                        updateSetting(
                          'security.ip_whitelist',
                          e.target.value.split('\n').filter(Boolean)
                        )
                      }
                      rows={4}
                    />
                    <p className="text-sm text-gray-500">
                      Leave empty to allow access from any IP
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Regional Tab */}
          <TabsContent value="regional">
            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>
                  Configure timezone, date format, and currency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={settings.timezone || 'America/New_York'}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date_format">Date Format</Label>
                    <select
                      id="date_format"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={settings.date_format || 'MM/DD/YYYY'}
                      onChange={(e) =>
                        updateSetting('date_format', e.target.value)
                      }
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={settings.currency || 'USD'}
                      onChange={(e) => updateSetting('currency', e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OrgAdminGate>
  );
}

export default OrgSettings;

