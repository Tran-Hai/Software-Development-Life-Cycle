'use client';

import { Bug } from 'lucide-react';

export default function BugsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bugs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage defects found during testing
        </p>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:p-6 text-center">
          <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Bug Tracking Module</h3>
          <p className="text-sm text-gray-500">
            Coming in Phase 3: Bug reporting, severity tracking, attachments, and linking to issues
          </p>
        </div>
      </div>
    </div>
  );
}
