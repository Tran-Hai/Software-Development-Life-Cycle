'use client';

import { Users } from 'lucide-react';

export default function MembersPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage project members and their roles
        </p>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:p-6 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Members Management</h3>
          <p className="text-sm text-gray-500">
            Invite members, assign roles, and manage permissions
          </p>
        </div>
      </div>
    </div>
  );
}
