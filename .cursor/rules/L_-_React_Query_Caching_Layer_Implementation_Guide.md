# CUI Compliance Widget & Detection Service

## 1. CUI Detection Service

### 1.1 Core Detection Engine

    // src/services/cui/cuiDetectionService.ts
    import { z } from 'zod';

    export type CUICategory = 
      | 'FEDERAL_BUILDING_LAYOUT'
      | 'SECURITY_PROCEDURES'
      | 'CRITICAL_INFRASTRUCTURE'
      | 'PERSONNEL_DATA'
      | 'FINANCIAL_DATA'
      | 'CONTRACTOR_CREDENTIALS'
      | 'COMPLIANCE_DOCS'
      | 'FACILITY_OPERATIONS';

    export interface CUIDetectionResult {
      isCUI: boolean;
      category?: CUICategory;
      confidence: number; // 0-1
      detectedPatterns: string[];
      recommendations: string[];
      severity: 'low' | 'medium' | 'high' | 'critical';
    }

    export interface CUIMetadata {
      marking: string;
      category: CUICategory;
      disseminationControl?: string;
      handlingInstructions: string[];
      authorizedUsers: string[];
      retentionPeriod: number; // days
    }

    class CUIDetectionService {
      private patterns: Map<CUICategory, RegExp[]> = new Map();
      private keywordPatterns: Map<CUICategory, string[]> = new Map();

      constructor() {
        this.initializePatterns();
      }

      private initializePatterns(): void {
        // Federal Building Layout patterns
        this.patterns.set('FEDERAL_BUILDING_LAYOUT', [
          /floor\s+plan|layout\s+diagram|building\s+schematic/gi,
          /emergency\s+exit|evacuation\s+route|security\s+checkpoint/gi,
          /surveillance\s+camera|access\s+point|restricted\s+area/gi,
          /HVAC\s+system|utility\s+tunnel|mechanical\s+room/gi,
        ]);

        this.keywordPatterns.set('FEDERAL_BUILDING_LAYOUT', [
          'classified', 'sensitive', 'restricted', 'secure', 'vault', 'bunker',
          'command center', 'operations center', 'control room',
        ]);

        // Security Procedures patterns
        this.patterns.set('SECURITY_PROCEDURES', [
          /security\s+protocol|access\s+control|authentication/gi,
          /guard\s+post|patrol\s+route|response\s+procedure/gi,
          /threat\s+assessment|vulnerability|penetration/gi,
        ]);

        this.keywordPatterns.set('SECURITY_PROCEDURES', [
          'classified', 'secret', 'top secret', 'confidential', 'sensitive',
          'security clearance', 'background check', 'vetting',
        ]);

        // Critical Infrastructure patterns
        this.patterns.set('CRITICAL_INFRASTRUCTURE', [
          /power\s+grid|water\s+system|communication\s+network/gi,
          /SCADA|industrial\s+control|critical\s+system/gi,
          /infrastructure\s+asset|resilience|continuity/gi,
        ]);

        // Personnel Data patterns
        this.patterns.set('PERSONNEL_DATA', [
          /SSN|social\s+security|tax\s+id|EIN/gi,
          /security\s+clearance|background\s+check|vetting/gi,
          /employee\s+record|personnel\s+file|confidential\s+data/gi,
        ]);

        // Financial Data patterns
        this.patterns.set('FINANCIAL_DATA', [
          /budget|cost\s+estimate|financial\s+forecast/gi,
          /contract\s+value|payment\s+schedule|invoice/gi,
          /profit\s+margin|proprietary\s+pricing/gi,
        ]);

        // Contractor Credentials patterns
        this.patterns.set('CONTRACTOR_CREDENTIALS', [
          /contractor\s+rating|performance\s+history|past\s+performance/gi,
          /security\s+clearance|certification|accreditation/gi,
          /bonding\s+capacity|insurance\s+coverage/gi,
        ]);

        // Compliance Documentation patterns
        this.patterns.set('COMPLIANCE_DOCS', [
          /audit\s+report|compliance\s+assessment|inspection\s+report/gi,
          /violation|deficiency|non-conformance/gi,
          /corrective\s+action|remediation|enforcement/gi,
        ]);

        // Facility Operations patterns
        this.patterns.set('FACILITY_OPERATIONS', [
          /operational\s+schedule|staffing\s+plan|resource\s+allocation/gi,
          /maintenance\s+schedule|downtime|outage/gi,
          /emergency\s+procedures|disaster\s+recovery/gi,
        ]);
      }

      detectCUI(content: string, context?: { filename?: string; dataType?: string }): CUIDetectionResult {
        const detectedPatterns: string[] = [];
        const categoryScores: Map<CUICategory, number> = new Map();

        // Scan all categories
        for (const [category, regexes] of this.patterns.entries()) {
          let categoryScore = 0;

          for (const regex of regexes) {
            const matches = content.match(regex);
            if (matches) {
              categoryScore += matches.length * 0.3;
              detectedPatterns.push(`${category}: ${matches[0]}`);
            }
          }

          // Check keywords
          const keywords = this.keywordPatterns.get(category) || [];
          for (const keyword of keywords) {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
              categoryScore += 0.2;
            }
          }

          if (categoryScore > 0) {
            categoryScores.set(category, Math.min(categoryScore, 1));
          }
        }

        // Determine primary category and confidence
        let topCategory: CUICategory | undefined;
        let topScore = 0;

        for (const [category, score] of categoryScores.entries()) {
          if (score > topScore) {
            topScore = score;
            topCategory = category;
          }
        }

        const isCUI = topScore > 0.3;
        const confidence = topScore;
        const severity = this.calculateSeverity(topScore, topCategory);

        return {
          isCUI,
          category: topCategory,
          confidence,
          detectedPatterns,
          recommendations: this.generateRecommendations(topCategory, isCUI),
          severity,
        };
      }

      private calculateSeverity(
        confidence: number,
        category?: CUICategory
      ): 'low' | 'medium' | 'high' | 'critical' {
        if (!category) return 'low';

        const criticalCategories: CUICategory[] = [
          'FEDERAL_BUILDING_LAYOUT',
          'SECURITY_PROCEDURES',
          'CRITICAL_INFRASTRUCTURE',
        ];

        if (confidence > 0.8 && criticalCategories.includes(category)) {
          return 'critical';
        }
        if (confidence > 0.7) return 'high';
        if (confidence > 0.5) return 'medium';
        return 'low';
      }

      private generateRecommendations(category?: CUICategory, isCUI?: boolean): string[] {
        if (!isCUI) return [];

        const recommendations: Record<CUICategory, string[]> = {
          FEDERAL_BUILDING_LAYOUT: [
            'Restrict access to authorized personnel only',
            'Mark document with CUI//SP-FACILITY',
            'Limit distribution to federal agencies',
            'Require secure storage (locked cabinet)',
          ],
          SECURITY_PROCEDURES: [
            'Apply CUI//SP-SECURITY marking',
            'Limit to need-to-know basis',
            'Implement access logging',
            'Require signed NDA for access',
          ],
          CRITICAL_INFRASTRUCTURE: [
            'Apply CUI//SP-CRITICAL-INFRASTRUCTURE marking',
            'Coordinate with DHS/CISA',
            'Implement air-gap storage',
            'Restrict electronic transmission',
          ],
          PERSONNEL_DATA: [
            'Apply CUI//SP-PRIVACY marking',
            'Implement PII encryption',
            'Restrict to HR personnel',
            'Implement access audit logging',
          ],
          FINANCIAL_DATA: [
            'Apply CUI//SP-PROPRIETARY marking',
            'Restrict to authorized bidders',
            'Implement version control',
            'Track all access and modifications',
          ],
          CONTRACTOR_CREDENTIALS: [
            'Apply CUI//SP-PROPRIETARY marking',
            'Restrict to procurement personnel',
            'Implement secure transmission',
            'Maintain audit trail',
          ],
          COMPLIANCE_DOCS: [
            'Apply CUI//SP-COMPLIANCE marking',
            'Restrict to compliance personnel',
            'Implement version control',
            'Maintain audit trail',
          ],
          FACILITY_OPERATIONS: [
            'Apply CUI//SP-OPERATIONS marking',
            'Restrict to facility management',
            'Implement access controls',
            'Regular audit reviews',
          ],
        };

        return recommendations[category] || [];
      }

      generateCUIMarking(category: CUICategory, disseminationControl?: string): string {
        const baseMarking = 'CUI';
        const categoryMarking = this.getCategoryMarking(category);
        const dissemination = disseminationControl ? `//${disseminationControl}` : '';
        return `${baseMarking}${categoryMarking}${dissemination}`;
      }

      private getCategoryMarking(category: CUICategory): string {
        const markings: Record<CUICategory, string> = {
          FEDERAL_BUILDING_LAYOUT: '//SP-FACILITY',
          SECURITY_PROCEDURES: '//SP-SECURITY',
          CRITICAL_INFRASTRUCTURE: '//SP-CRITICAL-INFRASTRUCTURE',
          PERSONNEL_DATA: '//SP-PRIVACY',
          FINANCIAL_DATA: '//SP-PROPRIETARY',
          CONTRACTOR_CREDENTIALS: '//SP-PROPRIETARY',
          COMPLIANCE_DOCS: '//SP-COMPLIANCE',
          FACILITY_OPERATIONS: '//SP-OPERATIONS',
        };
        return markings[category] || '';
      }

      validateCUIMetadata(metadata: Partial<CUIMetadata>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!metadata.marking) errors.push('CUI marking is required');
        if (!metadata.category) errors.push('CUI category is required');
        if (!metadata.handlingInstructions || metadata.handlingInstructions.length === 0) {
          errors.push('Handling instructions are required');
        }
        if (!metadata.authorizedUsers || metadata.authorizedUsers.length === 0) {
          errors.push('Authorized users list is required');
        }
        if (!metadata.retentionPeriod || metadata.retentionPeriod <= 0) {
          errors.push('Valid retention period is required');
        }

        return {
          valid: errors.length === 0,
          errors,
        };
      }
    }

    export const cuiDetectionService = new CUIDetectionService();

### 1.2 CUI Detection Hooks

    // src/hooks/useCUIDetection.ts
    import { useState, useCallback } from 'react';
    import { cuiDetectionService, CUIDetectionResult } from '@/services/cui/cuiDetectionService';

    export function useCUIDetection() {
      const [result, setResult] = useState<CUIDetectionResult | null>(null);
      const [isDetecting, setIsDetecting] = useState(false);

      const detect = useCallback(async (content: string, context?: any) => {
        setIsDetecting(true);
        try {
          const detectionResult = cuiDetectionService.detectCUI(content, context);
          setResult(detectionResult);
          return detectionResult;
        } finally {
          setIsDetecting(false);
        }
      }, []);

      const clear = useCallback(() => {
        setResult(null);
      }, []);

      return { result, isDetecting, detect, clear };
    }

## 2. CUI Compliance Widget

### 2.1 Main Widget Component

    // src/components/CUIComplianceWidget.tsx
    import React, { useState } from 'react';
    import { AlertCircle, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
    import { useCUIDetection } from '@/hooks/useCUIDetection';
    import { CUIDetectionResult } from '@/services/cui/cuiDetectionService';

    interface CUIComplianceWidgetProps {
      content: string;
      onCUIDetected?: (result: CUIDetectionResult) => void;
      showRecommendations?: boolean;
    }

    export function CUIComplianceWidget({
      content,
      onCUIDetected,
      showRecommendations = true,
    }: CUIComplianceWidgetProps) {
      const { result, isDetecting, detect } = useCUIDetection();
      const [expanded, setExpanded] = useState(false);

      React.useEffect(() => {
        if (content) {
          detect(content);
        }
      }, [content, detect]);

      React.useEffect(() => {
        if (result?.isCUI && onCUIDetected) {
          onCUIDetected(result);
        }
      }, [result, onCUIDetected]);

      if (isDetecting) {
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin">⏳</div>
              <span className="text-sm text-blue-700">Scanning for CUI...</span>
            </div>
          </div>
        );
      }

      if (!result) return null;

      const severityColors = {
        low: 'bg-green-50 border-green-200 text-green-800',
        medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        high: 'bg-orange-50 border-orange-200 text-orange-800',
        critical: 'bg-red-50 border-red-200 text-red-800',
      };

      const severityIcons = {
        low: <CheckCircle className="w-5 h-5 text-green-600" />,
        medium: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        high: <AlertCircle className="w-5 h-5 text-orange-600" />,
        critical: <AlertCircle className="w-5 h-5 text-red-600" />,
      };

      return (
        <div className={`p-4 border rounded-lg ${severityColors[result.severity]}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {severityIcons[result.severity]}
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {result.isCUI ? '🔒 CUI Detected' : '✓ No CUI Detected'}
                </h3>
                {result.isCUI && (
                  <>
                    <p className="text-sm mb-2">
                      Category: <strong>{result.category}</strong> (Confidence: {(result.confidence * 100).toFixed(0)}%)
                    </p>
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="text-sm underline hover:no-underline"
                    >
                      {expanded ? 'Hide' : 'Show'} Details
                    </button>
                  </>
                )}
              </div>
            </div>
            <Lock className="w-5 h-5 opacity-50" />
          </div>

          {expanded && result.isCUI && (
            <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-4">
              {result.detectedPatterns.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Detected Patterns:</h4>
                  <ul className="text-sm space-y-1">
                    {result.detectedPatterns.slice(0, 5).map((pattern, idx) => (
                      <li key={idx} className="ml-4">• {pattern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {showRecommendations && result.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Handling Recommendations:</h4>
                  <ul className="text-sm space-y-1">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="ml-4">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

### 2.2 Document Upload Widget

    // src/components/CUIDocumentUploadWidget.tsx
    import React, { useState } from 'react';
    import { Upload, File, X } from 'lucide-react';
    import { CUIComplianceWidget } from './CUIComplianceWidget';
    import { CUIDetectionResult } from '@/services/cui/cuiDetectionService';

    interface CUIDocumentUploadWidgetProps {
      onUpload?: (file: File, cuiResult: CUIDetectionResult) => void;
    }

    export function CUIDocumentUploadWidget({ onUpload }: CUIDocumentUploadWidgetProps) {
      const [file, setFile] = useState<File | null>(null);
      const [content, setContent] = useState<string>('');
      const [cuiResult, setCuiResult] = useState<CUIDetectionResult | null>(null);

      const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);

        // Extract text from file
        const text = await extractTextFromFile(selectedFile);
        setContent(text);
      };

      const handleCUIDetected = (result: CUIDetectionResult) => {
        setCuiResult(result);
        if (file && result.isCUI && onUpload) {
          onUpload(file, result);
        }
      };

      const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
          handleFileSelect(droppedFile);
        }
      };

      return (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Drag and drop a file or click to select</p>
            <input
              type="file"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="text-sm text-blue-600 hover:underline">Browse files</span>
            </label>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setContent('');
                  setCuiResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {content && <CUIComplianceWidget content={content} onCUIDetected={handleCUIDetected} />}
        </div>
      );
    }

    async function extractTextFromFile(file: File): Promise<string> {
      if (file.type === 'application/pdf') {
        // Use PDF.js or similar library
        return 'PDF extraction implementation';
      }
      if (file.type.includes('word') || file.type.includes('document')) {
        // Use docx library
        return 'DOCX extraction implementation';
      }
      if (file.type === 'text/plain') {
        return await file.text();
      }
      return '';
    }

## 3. CUI Metadata Manager

    // src/components/CUIMetadataManager.tsx
    import React, { useState } from 'react';
    import { CUIMetadata, CUICategory } from '@/services/cui/cuiDetectionService';

    interface CUIMetadataManagerProps {
      onSave?: (metadata: CUIMetadata) => void;
      initialData?: Partial<CUIMetadata>;
    }

    export function CUIMetadataManager({ onSave, initialData }: CUIMetadataManagerProps) {
      const [metadata, setMetadata] = useState<Partial<CUIMetadata>>(initialData || {});

      const categories: CUICategory[] = [
        'FEDERAL_BUILDING_LAYOUT',
        'SECURITY_PROCEDURES',
        'CRITICAL_INFRASTRUCTURE',
        'PERSONNEL_DATA',
        'FINANCIAL_DATA',
        'CONTRACTOR_CREDENTIALS',
        'COMPLIANCE_DOCS',
        'FACILITY_OPERATIONS',
      ];

      const handleSave = () => {
        if (onSave && metadata.marking && metadata.category) {
          onSave(metadata as CUIMetadata);
        }
      };

      return (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">CUI Metadata</h3>

          <div>
            <label className="block text-sm font-medium mb-1">CUI Marking</label>
            <input
              type="text"
              value={metadata.marking || ''}
              onChange={(e) => setMetadata({ ...metadata, marking: e.target.value })}
              placeholder="e.g., CUI//SP-FACILITY"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={metadata.category || ''}
              onChange={(e) => setMetadata({ ...metadata, category: e.target.value as CUICategory })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Retention Period (days)</label>
            <input
              type="number"
              value={metadata.retentionPeriod || ''}
              onChange={(e) => setMetadata({ ...metadata, retentionPeriod: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Save Metadata
          </button>
        </div>
      );
    }
