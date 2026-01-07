// ============================================================
// SAM.GOV OPPORTUNITY IMPORT COMPONENT
// Search and import federal opportunities into OC Pipeline
// ============================================================

import { useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  MapPin,
  Tag,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import {
  samGovService,
  type SamOpportunity,
  SET_ASIDE_TYPES,
} from '@/services/sam-gov.service';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatDate = (date: string | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getSetAsideBadgeColor = (type: string): string => {
  const colors: Record<string, string> = {
    SDVOSBC: 'bg-purple-100 text-purple-800',
    '8A': 'bg-blue-100 text-blue-800',
    SBA: 'bg-green-100 text-green-800',
    HZC: 'bg-orange-100 text-orange-800',
    WOSB: 'bg-pink-100 text-pink-800',
    EDWOSB: 'bg-pink-100 text-pink-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};


// ============================================================
// MAIN COMPONENT
// ============================================================

interface SamGovImportProps {
  onImportComplete?: () => void;
}

export function SamGovImport({ onImportComplete }: SamGovImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SamOpportunity[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importStatus, setImportStatus] = useState<{
    imported: number;
    updated: number;
    errors: number;
  } | null>(null);

  // Search filters
  const [keyword, setKeyword] = useState('');
  const [naicsCode, setNaicsCode] = useState('');
  const [setAsideType, setSetAsideType] = useState('all');
  const [state, setState] = useState('');

  const handleSearch = async () => {
    setSearching(true);
    setResults([]);
    setSelected(new Set());
    setImportStatus(null);

    try {
      const response = await samGovService.searchOneill({
        keyword: keyword || undefined,
        naicsCode: naicsCode || undefined,
        state: state || undefined,
        limit: 50,
      });
      setResults(response.opportunitiesData || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map(r => r.noticeId)));
    }
  };

  const handleToggleSelect = (noticeId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(noticeId)) {
      newSelected.delete(noticeId);
    } else {
      newSelected.add(noticeId);
    }
    setSelected(newSelected);
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    
    setLoading(true);
    setImportStatus(null);

    try {
      const toImport = results.filter(r => selected.has(r.noticeId));
      const status = await samGovService.bulkImport(toImport);
      setImportStatus(status);
      
      if (status.imported > 0 || status.updated > 0) {
        onImportComplete?.();
      }
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSync = async () => {
    setLoading(true);
    setImportStatus(null);

    try {
      const status = await samGovService.sync({ daysBack: 7 });
      setImportStatus(status);
      
      if (status.imported > 0 || status.updated > 0) {
        onImportComplete?.();
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* Import Button */}
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Download className="w-4 h-4 mr-2" />
        Import from SAM.gov
      </Button>

      {/* Import Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img 
                src="https://sam.gov/favicon.ico" 
                alt="SAM.gov" 
                className="w-5 h-5"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
              Import from SAM.gov
            </DialogTitle>
          </DialogHeader>

          {/* Search Filters */}
          <div className="grid grid-cols-4 gap-4 py-4">
            <div>
              <Label>Keyword</Label>
              <Input
                placeholder="Search opportunities..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div>
              <Label>NAICS Code</Label>
              <Input
                placeholder="e.g., 236220"
                value={naicsCode}
                onChange={(e) => setNaicsCode(e.target.value)}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                placeholder="e.g., IL"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2">Search</span>
              </Button>
              <Button variant="outline" onClick={handleQuickSync} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {results.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-500">
                {searching ? 'Searching SAM.gov...' : 'Search for opportunities to import'}
              </div>
            ) : (
              <div className="divide-y">
                {/* Select All Header */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 sticky top-0">
                  <Checkbox
                    checked={selected.size === results.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-600">
                    {selected.size} of {results.length} selected
                  </span>
                </div>

                {/* Opportunity List */}
                {results.map((opp) => (
                  <div
                    key={opp.noticeId}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selected.has(opp.noticeId) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleToggleSelect(opp.noticeId)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected.has(opp.noticeId)}
                        onCheckedChange={() => handleToggleSelect(opp.noticeId)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {opp.title}
                          </h4>
                          <a
                            href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {opp.agency}
                          </span>
                          {opp.responseDeadLine && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {formatDate(opp.responseDeadLine)}
                            </span>
                          )}
                          {opp.placeOfPerformance?.state?.code && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {opp.placeOfPerformance.state.code}
                            </span>
                          )}
                          {opp.naicsCode && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              NAICS: {opp.naicsCode}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          {opp.typeOfSetAside && (
                            <Badge className={getSetAsideBadgeColor(opp.typeOfSetAside)}>
                              {opp.typeOfSetAsideDescription || opp.typeOfSetAside}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {opp.solicitationNumber || opp.noticeId}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Import Status */}
          {importStatus && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              {importStatus.imported > 0 && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  {importStatus.imported} imported
                </span>
              )}
              {importStatus.updated > 0 && (
                <span className="flex items-center gap-1 text-blue-600 text-sm">
                  <RefreshCw className="w-4 h-4" />
                  {importStatus.updated} updated
                </span>
              )}
              {importStatus.errors > 0 && (
                <span className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {importStatus.errors} errors
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleImport}
              disabled={selected.size === 0 || loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Import {selected.size > 0 ? `(${selected.size})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SamGovImport;
