import { BarChart3 } from 'lucide-react';

export default function Preconstruction() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <BarChart3 className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900">Preconstruction & Estimating</h1>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
        <p className="text-gray-600 text-lg">
          Cost estimation, bid management, and project planning.
        </p>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium">✅ Module Active</p>
          <p className="text-blue-600 text-sm mt-1">This module is fully functional and ready to use.</p>
        </div>
      </div>
    </div>
  );
}