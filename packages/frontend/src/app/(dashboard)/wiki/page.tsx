'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Plus, FileText, ChevronRight, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  author: {
    fullName: string;
    avatarUrl: string | null;
  };
  children: Document[];
}

export default function WikiPage() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiClient.get('/projects/demo-project-id/documents'),
  });

  const createDocument = useMutation({
    mutationFn: (data: { title: string; slug: string; content?: string; parentId?: string }) =>
      apiClient.post('/projects/demo-project-id/documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowCreateModal(false);
    },
  });

  const updateDocument = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; content?: string; status?: string } }) =>
      apiClient.patch(`/documents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsEditing(false);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDoc(null);
    },
  });

  const handleSelectDoc = (doc: Document) => {
    setSelectedDoc(doc);
    setEditContent(doc.content || '');
    setIsEditing(false);
  };

  const handleSave = () => {
    if (selectedDoc) {
      updateDocument.mutate({
        id: selectedDoc.id,
        data: { content: editContent },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar */}
      <div className="w-64 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Documents</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {documents?.data?.map((doc: Document) => (
            <div key={doc.id}>
              <button
                onClick={() => handleSelectDoc(doc)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left ${
                  selectedDoc?.id === doc.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{doc.title}</span>
              </button>

              {doc.children?.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleSelectDoc(child)}
                  className={`w-full flex items-center gap-2 pl-8 pr-3 py-2 text-sm rounded-md text-left ${
                    selectedDoc?.id === child.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{child.title}</span>
                </button>
              ))}
            </div>
          ))}

          {documents?.data?.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No documents yet
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col">
        {selectedDoc ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{selectedDoc.title}</h1>
                <p className="text-sm text-gray-500">
                  By {selectedDoc.author.fullName} • Updated{' '}
                  {new Date(selectedDoc.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(selectedDoc.content || '');
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteDocument.mutate(selectedDoc.id)}
                      className="p-1.5 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </>
                )}
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    selectedDoc.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : selectedDoc.status === 'archived'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {selectedDoc.status}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[400px] p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Write your document content here..."
                />
              ) : (
                <div className="prose max-w-none">
                  {selectedDoc.content ? (
                    <pre className="whitespace-pre-wrap font-sans text-gray-700">
                      {selectedDoc.content}
                    </pre>
                  ) : (
                    <p className="text-gray-400 italic">No content yet. Click edit to add content.</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>Select a document from the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDocumentModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createDocument.mutate(data)}
        />
      )}
    </div>
  );
}

function CreateDocumentModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { title: string; slug: string; content?: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, slug: slug.toLowerCase().replace(/\s+/g, '-') });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Document</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Document title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="document-slug"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
