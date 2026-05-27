'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { User, Mail, Calendar, Shield, Edit2, Save, X } from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { success } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.get('/users/me'),
    staleTime: 10000,
  });

  const updateProfile = useMutation({
    mutationFn: (data: { fullName?: string; avatarUrl?: string }) =>
      apiClient.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setEditing(false);
      success('Profile updated', 'Your changes have been saved');
    },
  });

  const profile = profileData?.data || authUser;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <User className="h-5 w-5 text-white animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const roles = profile?.userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || ['Member'];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your personal information</p>
        </div>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar name={profile?.fullName} src={profile?.avatarUrl} size="lg" />
            <div className="text-center sm:text-left flex-1">
              <p className="text-xl font-semibold text-gray-900">{profile?.fullName}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                {roles.map((role: string) => (
                  <Badge key={role} variant="status" value={role.toLowerCase()} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Edit2 className="h-4 w-4 text-muted-foreground" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateProfile.mutate({
                  fullName: formData.get('fullName') as string,
                  avatarUrl: (formData.get('avatarUrl') as string) || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  className="input"
                  defaultValue={profile?.fullName || ''}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Avatar URL</label>
                <input
                  name="avatarUrl"
                  type="url"
                  className="input"
                  defaultValue={profile?.avatarUrl || ''}
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1">Paste a URL to your profile picture</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={updateProfile.isPending}>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email
              </label>
              <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
            </div>
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Status
              </label>
              <p className="text-sm font-medium text-gray-900">
                {profile?.isActive !== false ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Member Since
              </label>
              <p className="text-sm font-medium text-gray-900">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                User ID
              </label>
              <p className="text-sm font-mono text-gray-900 truncate">{profile?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
