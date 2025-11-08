import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, BarChart3, Upload, FileText } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to MGX
          </h1>
          <p className="text-lg text-muted-foreground">
            Pipeline Administration & Project Management System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Data Module */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/project-data')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle>Project Data</CardTitle>
                  <CardDescription>View schema and manage project records</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Access project database schema, view records, and explore API endpoints for project data management.
              </p>
              <Button className="w-full">
                Open Project Data
              </Button>
            </CardContent>
          </Card>

          {/* Pipeline Administration */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/pipeline')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle>Pipeline Admin</CardTitle>
                  <CardDescription>Manage projects and pipeline data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View, filter, and manage pipeline projects. Create, edit, and bulk update project records.
              </p>
              <Button className="w-full">
                Open Pipeline Admin
              </Button>
            </CardContent>
          </Card>

          {/* Import Data */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/pipeline/import')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-purple-600" />
                <div>
                  <CardTitle>Import Projects</CardTitle>
                  <CardDescription>Bulk import from CSV/XLSX files</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Upload CSV or XLSX files to bulk import projects. Download templates and validate data before import.
              </p>
              <Button className="w-full">
                Import Data
              </Button>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/pipeline/analytics')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>View metrics and performance trends</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Explore pipeline analytics, win rates, profit margins, and project status breakdowns with interactive charts.
              </p>
              <Button className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Built with MGX Platform • Pipeline Administration Module v1.0</p>
        </div>
      </div>
    </div>
  );
}