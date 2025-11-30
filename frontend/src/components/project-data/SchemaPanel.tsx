/**
 * Schema Panel Component
 * Displays authoritative field definitions in collapsible panel
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FieldSchema } from '@/types/project-data.types';

interface SchemaPanelProps {
  fields: FieldSchema[];
  loading?: boolean;
}

export function SchemaPanel({ fields, loading }: SchemaPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-64 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle>Required Fields (Dashboard Schema)</CardTitle>
            <Badge variant="secondary">{fields.length} fields</Badge>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold">#</th>
                  <th className="text-left py-2 px-3 font-semibold">Field Name</th>
                  <th className="text-left py-2 px-3 font-semibold">Type</th>
                  <th className="text-left py-2 px-3 font-semibold">Required</th>
                  <th className="text-left py-2 px-3 font-semibold">Allowed Values / Format</th>
                  <th className="text-left py-2 px-3 font-semibold">Example</th>
                  <th className="text-left py-2 px-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.name} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 text-muted-foreground">{index + 1}</td>
                    <td className="py-2 px-3 font-medium">{field.name}</td>
                    <td className="py-2 px-3">
                      <Badge variant="outline">{field.type}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      {field.required ? (
                        <Badge variant="destructive">Required</Badge>
                      ) : (
                        <Badge variant="secondary">Optional</Badge>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs">
                      {field.allowedValues ? (
                        <div className="max-w-xs">
                          {field.allowedValues.join(', ')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{field.validation || '—'}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs font-mono text-muted-foreground">
                      {field.example || '—'}
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">
                      {field.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}