'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useParams } from 'next/navigation';
import { Users, Shield, Plus, X, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { formatRelativeDate } from '@/lib/utils';

export default function ProjectMembersPage() {
  const params = useParams();
  const { user: currentUser } = useAuth();
  const projectId = params.projectId as string;
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/members`),
    staleTime: 30000,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiClient.get('/roles'),
    staleTime: 60000,
  });

  const addMember = useMutation({
    mutationFn: (data: { email: string; roleId: string }) =>
      apiClient.post(`/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      setShowAddModal(false);
      success('Member added', 'They can now collaborate on this project');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to add member';
      showError('Error', typeof msg === 'string' ? msg : msg[0]);
    },
  });

  const memberList = members?.data || [];
  const projectRoles = roles?.data?.filter((r: any) => r.scope === 'project') || [];
  const currentMember = memberList.find((m: any) => m.user?.id === currentUser?.id);
  const isOwner = currentMember?.role?.name === 'owner';

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {memberList.length} {memberList.length === 1 ? 'member' : 'members'} in this project
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {memberList.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {memberList.map((member: any) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.user?.fullName || 'User'}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{member.user?.fullName || 'Unknown'}</span>
                            {member.role?.name === 'owner' && (
                              <Crown className="h-3.5 w-3.5 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={member.role?.name === 'owner' ? 'default' : 'outline'} className="gap-1">
                        <Shield className="h-3 w-3" />
                        {member.role?.name || 'member'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatRelativeDate(member.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add members to collaborate on this project"
          action={
            isOwner ? (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Add Member Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Member"
        description="Invite someone to this project by email"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            addMember.mutate({
              email: formData.get('email') as string,
              roleId: formData.get('roleId') as string,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              className="input"
              placeholder="colleague@company.com"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select name="roleId" className="input" required>
              <option value="">Select a role</option>
              {projectRoles.map((role: any) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addMember.isPending}>
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
