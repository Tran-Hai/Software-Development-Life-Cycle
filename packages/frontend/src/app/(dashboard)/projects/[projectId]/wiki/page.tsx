'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useParams } from 'next/navigation';
import { Plus, FileText, ChevronRight, Edit, Trash2, Save, X, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatRelativeDate } from '@/lib/utils';

export default function ProjectWikiPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();
  const { success } = useToast();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/documents`),
    staleTime: 30000,
  });

  const createDocument = useMutation({
    mutationFn: (data: { title: string; slug: string; content?: string }) =>
      apiClient.post(`/projects/${projectId}/documents`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      setShowCreateModal(false);
      const doc = (data as any)?.data || data;
      setSelectedDoc(doc);
      setEditContent(doc.content || '');
      setIsEditing(true);
      success('Document created', 'Your new document is ready');
    },
  });

  const updateDocument = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; content?: string; status?: string } }) =>
      apiClient.patch(`/projects/${projectId}/documents/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      const doc = (data as any)?.data || data;
      if (doc) setSelectedDoc(doc);
      setIsEditing(false);
      success('Document updated', 'Changes have been saved');
    },
  });

  const deleteDocument = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/projects/${projectId}/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      setSelectedDoc(null);
      setShowDeleteConfirm(false);
      success('Document deleted', 'The document has been removed');
    },
  });

  const handleSelectDoc = (doc: any) => {
    setSelectedDoc(doc);
    setEditContent(doc.content || '');
    setIsEditing(false);
  };

  const handleSave = () => {
    if (selectedDoc) {
      updateDocument.mutate({ id: selectedDoc.id, data: { content: editContent } });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <Card className="w-72 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Documents
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {documents?.data?.length > 0 ? (
              <div className="space-y-1">
                {documents?.data?.map((doc: any) => (
                  <div key={doc.id}>
                    <button
                      onClick={() => handleSelectDoc(doc)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-left transition-colors ${
                        selectedDoc?.id === doc.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate flex-1">{doc.title}</span>
                      {doc.status === 'draft' && (
                        <span className="h-2 w-2 rounded-full bg-yellow-400 flex-shrink-0" />
                      )}
                    </button>
                    {doc.children?.map((child: any) => (
                      <button
                        key={child.id}
                        onClick={() => handleSelectDoc(child)}
                        className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-sm rounded-md text-left transition-colors ${
                          selectedDoc?.id === child.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate">{child.title}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No documents yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Content */}
        <Card className="flex-1 flex flex-col">
          {selectedDoc ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{selectedDoc.title}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    By {selectedDoc.author?.fullName || 'Unknown'} • Updated {formatRelativeDate(selectedDoc.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDoc.status}
                    onChange={(e) => updateDocument.mutate({ id: selectedDoc.id, data: { status: e.target.value } })}
                    className="select-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSave} isLoading={updateDocument.isPending}>
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setIsEditing(false); setEditContent(selectedDoc.content || ''); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="input min-h-[400px] font-mono resize-none"
                    placeholder="Write your document content here..."
                    autoFocus
                  />
                ) : (
                  <div className="prose max-w-none">
                    {selectedDoc.content ? (
                      <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">{selectedDoc.content}</pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Edit className="h-8 w-8 text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">No content yet</p>
                        <Button variant="link" onClick={() => setIsEditing(true)} className="mt-2">
                          Click to edit
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={BookOpen}
                title="Select a document"
                description="Choose a document from the sidebar to view or edit"
              />
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteDocument.mutate(selectedDoc?.id)}
        title="Delete Document"
        description={`Are you sure you want to delete "${selectedDoc?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isConfirming={deleteDocument.isPending}
      />

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Document"
        description="Add a new document to your wiki"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('title') as string;
            createDocument.mutate({
              title,
              slug: formData.get('slug') as string,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              name="title"
              className="input"
              placeholder="Document title"
              required
              autoFocus
              onChange={(e) => {
                const slugInput = (e.target.form as HTMLFormElement)?.slug as HTMLInputElement;
                if (slugInput) {
                  slugInput.value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
            <input name="slug" type="text" className="input font-mono" placeholder="document-slug" required />
            <p className="text-xs text-muted-foreground mt-1.5">URL-friendly identifier (auto-generated from title)</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createDocument.isPending}>
              Create Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
