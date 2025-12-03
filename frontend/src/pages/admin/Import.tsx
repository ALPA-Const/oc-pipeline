/**
 * Admin Import Page
 * Upload, preview, validate, and import CSV/XLSX files
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseImportFile, downloadTemplate } from '@/utils/import-parser';
import { importProjects } from '@/services/pipeline-admin.service';
import { ImportResult, ImportError } from '@/types/admin.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export default function AdminImport() {
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<ImportError[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStep('preview');

    // Parse file
    try {
      const result = await parseImportFile(selectedFile);
      setParsedData(result.data);
      setParseErrors(result.errors);

      if (result.errors.length > 0) {
        toast.warning(`Found ${result.errors.length} validation errors`);
      } else {
        toast.success(`Parsed ${result.data.length} projects successfully`);
      }
    } catch (error: any) {
      toast.error(`Failed to parse file: ${error.message}`);
      setStep('upload');
      setFile(null);
    }
  };

  // Import handler
  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setStep('importing');

    try {
      const result = await importProjects(parsedData);
      setImportResult(result);
      setStep('complete');

      if (result.failed === 0) {
        toast.success(
          `Successfully imported ${result.inserted + result.updated} projects`
        );
      } else {
        toast.warning(
          `Imported ${result.inserted + result.updated} projects with ${result.failed} failures`
        );
      }
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  // Reset handler
  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setParseErrors([]);
    setImportResult(null);
  };

  // Download template
  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    downloadTemplate(format);
    toast.success(`Template downloaded (${format.toUpperCase()})`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/pipeline')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Import Projects
              </h1>
              <p className="text-gray-600 mt-1">
                Upload CSV or XLSX files to bulk import projects
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {step === 'upload' ? '1' : <CheckCircle className="h-5 w-5" />}
                </div>
                <span className="font-medium">Upload File</span>
              </div>

              <div className="flex-1 h-0.5 bg-gray-300 mx-4" />

              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === 'preview' || step === 'importing'
                      ? 'bg-blue-600 text-white'
                      : step === 'complete'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step === 'complete' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    '2'
                  )}
                </div>
                <span className="font-medium">Preview & Validate</span>
              </div>

              <div className="flex-1 h-0.5 bg-gray-300 mx-4" />

              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === 'complete'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step === 'complete' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    '3'
                  )}
                </div>
                <span className="font-medium">Complete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <>
            {/* Template Download */}
            <Card>
              <CardHeader>
                <CardTitle>Download Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Download the import template to ensure your data matches the
                  required format. The template includes all 26 required fields
                  and validation rules.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate('xlsx')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download XLSX Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate('csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Supports CSV and XLSX files (max 10MB)
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span>Select File</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <>
            {/* File Info */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{file?.name}</p>
                      <p className="text-sm text-gray-600">
                        {parsedData.length} projects found
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleReset}>
                    Change File
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Validation Errors */}
            {parseErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Errors Found</AlertTitle>
                <AlertDescription>
                  {parseErrors.length} error(s) detected. Please fix these issues
                  before importing.
                </AlertDescription>
              </Alert>
            )}

            {/* Errors Table */}
            {parseErrors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Validation Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parseErrors.slice(0, 50).map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{error.field}</Badge>
                            </TableCell>
                            <TableCell className="text-red-600">
                              {error.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {parseErrors.length > 50 && (
                      <p className="text-sm text-gray-600 text-center py-4">
                        Showing first 50 of {parseErrors.length} errors
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview Table */}
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job #</TableHead>
                        <TableHead>Bid Title</TableHead>
                        <TableHead>Agency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Set Aside</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((project, index) => (
                        <TableRow key={index}>
                          <TableCell>{project.job_no || '-'}</TableCell>
                          <TableCell>{project.name || '-'}</TableCell>
                          <TableCell>{project.agency || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{project.status}</Badge>
                          </TableCell>
                          <TableCell>{project.set_aside || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.length > 10 && (
                    <p className="text-sm text-gray-600 text-center py-4">
                      Showing first 10 of {parsedData.length} projects
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={parseErrors.length > 0 || parsedData.length === 0}
              >
                Import {parsedData.length} Projects
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                <p className="text-lg font-medium">Importing projects...</p>
                <p className="text-sm text-gray-600">
                  Please wait while we process your data
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && importResult && (
          <>
            {/* Summary */}
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  {importResult.failed === 0 ? (
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                  ) : (
                    <AlertTriangle className="h-16 w-16 text-orange-600 mx-auto" />
                  )}
                  <h2 className="text-2xl font-bold">Import Complete</h2>
                  <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {importResult.inserted}
                      </p>
                      <p className="text-sm text-gray-600">Inserted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {importResult.updated}
                      </p>
                      <p className="text-sm text-gray-600">Updated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">
                        {importResult.failed}
                      </p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Import Errors */}
            {importResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Import Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{error.field}</Badge>
                            </TableCell>
                            <TableCell className="text-red-600">
                              {error.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
              <Button onClick={() => navigate('/admin/pipeline')}>
                View Projects
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}