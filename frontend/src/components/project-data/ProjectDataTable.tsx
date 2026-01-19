/**
 * Project Data Table Component
 * Displays project records with filtering and pagination
 */

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import type { ProjectDataRecord, AuthoritativeFieldName } from '@/types/project-data.types';
import { AUTHORITATIVE_FIELDS } from '@/types/project-data.types';

interface ProjectDataTableProps {
  data: ProjectDataRecord[];
  loading?: boolean;
  highlightId?: string;
}

export function ProjectDataTable({ data, loading, highlightId }: ProjectDataTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 25;

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(data.length / pageSize);

  const formatCellValue = (field: AuthoritativeFieldName, value: unknown): string => {
    if (value === null || value === undefined) return '—';
    
    if (field.includes('Date/Time') || field === 'DTA') {
      return new Date(value as string).toLocaleString();
    }
    
    if (typeof value === 'number') {
      if (field === 'Latitude' || field === 'Longitude') {
        return value.toFixed(4);
      }
      return value.toString();
    }
    
    return String(value);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {AUTHORITATIVE_FIELDS.map((field) => (
                  <TableHead key={field} className="whitespace-nowrap">
                    {field}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((record) => (
                <TableRow
                  key={record.id}
                  className={highlightId === record.id ? 'bg-blue-50' : ''}
                >
                  {AUTHORITATIVE_FIELDS.map((field) => {
                    const value = record[field];
                    const hasWarning = record._warnings?.some(w => w.includes(field));

                    return (
                      <TableCell key={field} className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{formatCellValue(field, value)}</span>
                          {hasWarning && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    {record._warnings?.filter(w => w.includes(field)).join(', ')}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.length)} of {data.length} records
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}