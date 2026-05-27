'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  MessageSquare,
  History,
  Edit2,
  Check,
  X,
  User,
  Calendar,
  Hash,
  AlertCircle,
  Target,
  TrendingUp,
} from 'lucide-react';

const statusOptions = [
  { value: 'backlog', label: 'Backlog', color: 'bg-gray-500' },
  { value: 'todo', label: 'Todo', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'in_review', label: 'In Review', color: 'bg-purple-500' },
  { value: 'testing', label: 'Testing', color: 'bg-orange-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
];

const priorityOptions = [
  { value: 'lowest', label: 'Lowest' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'highest', label: 'Highest' },
  { value: 'critical', label: 'Critical' },
];

const statusColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-700',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  in_review: 'bg-purple-100 text-purple-700',
  testing: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
};

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const issueId = params.issueId as string;
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newComment, setNewComment] = useState('');

  const queryClient = useQueryClient();

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => apiClient.get(`/projects/${projectId}/issues/${issueId}`),
    enabled: !!issueId,
  });

  const { data: comments } = useQuery({
    queryKey: ['issue-comments', issueId],
    queryFn: () => apiClient.get(`/projects/${projectId}/issues/${issueId}/comments`),
    enabled: !!issueId,
  });

  const { data: activity } = useQuery({
    queryKey: ['issue-activity', issueId],
    queryFn: () => apiClient.get(`/projects/${projectId}/issues/${issueId}/activity`),
    enabled: !!issueId,
  });

  const { data: members } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/members`),
    enabled: !!projectId,
  });

  const { data: epics } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/epics`),
    enabled: !!projectId,
  });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/sprints`),
    enabled: !!projectId,
  });

  const updateIssue = useMutation({
    mutationFn: (data: Record<string, any>) =>
      apiClient.patch(`/projects/${projectId}/issues/${issueId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issue-activity', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      setIsEditing(false);
    },
  });

  const addComment = useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/projects/${projectId}/issues/${issueId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issue-activity', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      setNewComment('');
    },
  });

  const handleSave = () => {
    updateIssue.mutate({
      title: editTitle,
      description: editDescription,
    });
  };

  const handleStatusChange = (status: string) => {
    updateIssue.mutate({ status });
  };

  const handleAssigneeChange = (assigneeId: string | null) => {
    updateIssue.mutate({ assigneeId });
  };

  const handlePriorityChange = (priority: string) => {
    updateIssue.mutate({ priority });
  };

  const handleEpicChange = (epicId: string | null) => {
    updateIssue.mutate({ epicId });
  };

  const handleSprintChange = (sprintId: string | null) => {
    updateIssue.mutate({ sprintId });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment.mutate(newComment);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const issueData = issue?.data;
  if (!issueData) return <div>Issue not found</div>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href={`/projects/${projectId}`} className="hover:text-gray-700">
          {issueData.project?.key || projectId}
        </Link>
        <ChevronLeft className="h-3 w-3 rotate-180" />
        <Link href={`/projects/${projectId}/issues`} className="hover:text-gray-700">
          Issues
        </Link>
        <ChevronLeft className="h-3 w-3 rotate-180" />
        <span className="text-gray-900 font-medium">{issueData.issueNumber}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[150px]"
                  placeholder="Description..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(issueData.title);
                      setEditDescription(issueData.description || '');
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">{issueData.issueNumber}</span>
                      <span className="text-sm text-gray-400">/</span>
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: issueData.issueType?.color }}
                      ></div>
                      <span className="text-sm text-gray-500 capitalize">{issueData.issueType?.name}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">{issueData.title}</h1>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditTitle(issueData.title);
                      setEditDescription(issueData.description || '');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <Edit2 className="h-4 w-4 text-gray-500" />
                  </button>
                </div>

                {issueData.description ? (
                  <div className="prose max-w-none mt-4 p-4 bg-gray-50 rounded-md">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm">
                      {issueData.description}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">No description provided.</p>
                )}
              </div>
            )}
          </div>

          {/* Tabs: Comments / Activity */}
          <div className="bg-white shadow rounded-lg border border-gray-100">
            <div className="border-b border-gray-200">
              <nav className="flex gap-4 px-6">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'comments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Comments ({issueData._count?.comments || 0})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <History className="h-4 w-4" />
                  Activity
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'comments' && (
                <div>
                  {/* Comment List */}
                  <div className="space-y-4 mb-6">
                    {comments?.data?.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600 flex-shrink-0">
                          {comment.author?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.author?.fullName || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {comments?.data?.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <form onSubmit={handleAddComment} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                      U
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="input min-h-[80px]"
                        placeholder="Add a comment..."
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={!newComment.trim() || addComment.isPending}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addComment.isPending ? 'Sending...' : 'Comment'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {activity?.data?.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{log.user?.fullName || 'Unknown'}</span>
                          {' '}{log.action.replace('_', ' ')}
                          {log.newValue && (
                            <span className="text-gray-500">
                              {log.oldValue ? ` from "${typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : log.oldValue}"` : ''}
                              {' '}to "{typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : log.newValue}"
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activity?.data?.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Status
            </label>
            <select
              value={issueData.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="select-sm w-full"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="mt-2">
              <span className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${statusColors[issueData.status] || 'bg-gray-100 text-gray-700'}`}>
                {issueData.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Assignee */}
          <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Assignee
            </label>
            <select
              value={issueData.assigneeId || ''}
              onChange={(e) => handleAssigneeChange(e.target.value || null)}
              className="select-sm w-full"
            >
              <option value="">Unassigned</option>
              {members?.data?.map((member: any) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.fullName}
                </option>
              ))}
            </select>
            {issueData.assignee && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                  {issueData.assignee.fullName.charAt(0)}
                </div>
                <span className="text-sm text-gray-700">{issueData.assignee.fullName}</span>
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Priority
            </label>
            <select
              value={issueData.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="select-sm w-full"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Epic */}
          <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Epic
            </label>
            <select
              value={issueData.epicId || ''}
              onChange={(e) => handleEpicChange(e.target.value || null)}
              className="select-sm w-full"
            >
              <option value="">No epic</option>
              {epics?.data?.map((epic: any) => (
                <option key={epic.id} value={epic.id}>{epic.title}</option>
              ))}
            </select>
            {issueData.epic && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: issueData.epic.color }} />
                <span className="text-sm text-gray-700">{issueData.epic.title}</span>
              </div>
            )}
          </div>

          {/* Sprint */}
          <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sprint
            </label>
            <select
              value={issueData.sprintId || ''}
              onChange={(e) => handleSprintChange(e.target.value || null)}
              className="select-sm w-full"
            >
              <option value="">No sprint</option>
              {sprints?.data?.map((sprint: any) => (
                <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
              ))}
            </select>
            {issueData.sprint && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-700">{issueData.sprint.name}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Reporter</span>
                <span className="text-gray-900">{issueData.reporter?.fullName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(issueData.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-900">
                  {new Date(issueData.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {issueData.storyPoints && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Story Points</span>
                  <span className="text-gray-900 font-medium">{issueData.storyPoints}</span>
                </div>
              )}
              {issueData.dueDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Due Date</span>
                  <span className="text-gray-900">
                    {new Date(issueData.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
