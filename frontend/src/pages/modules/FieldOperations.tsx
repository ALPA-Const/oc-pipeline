import { HardHat } from 'lucide-react';

export default function FieldOperations() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <HardHat className="w-8 h-8 text-orange-600" />
        <h1 className="text-3xl font-bold text-gray-900">Field Operations</h1>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
        <p className="text-gray-600 text-lg mb-6">
          On-site management, daily logs, and field reporting.
        </p>
        <div className="p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">🚧 Under Construction</h2>
          <p className="text-yellow-700">
            This module is currently being developed and will be available in a future release.
          </p>
        </div>
      </div>
    </div>
  );
}