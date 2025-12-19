'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ProjectDocument,
  DrawingSheet,
  AITakeoffElement,
  TakeoffAnnotation,
  InvisibleScopeItem,
  DocumentDiscrepancy,
  DocumentType,
  ElementType,
  AnnotationType,
  VerificationStatus,
  basisPointsToPercent,
} from '@/types/agentic-ai';
import {
  documentApi,
  sheetApi,
  takeoffElementApi,
  annotationApi,
  invisibleScopeApi,
  discrepancyApi,
  aiTakeoffAgent,
  scopeScoutAgent,
} from '@/api/drawing-viewer';

// =============================================================================
// TYPES
// =============================================================================

interface DrawingViewerProps {
  estimateId: string;
  onTakeoffComplete?: (elements: AITakeoffElement[]) => void;
}

interface SheetThumbnailProps {
  sheet: DrawingSheet;
  isSelected: boolean;
  onClick: () => void;
}

interface TakeoffElementRowProps {
  element: AITakeoffElement;
  isSelected: boolean;
  onSelect: () => void;
  onVerify: (status: VerificationStatus) => void;
}

interface AnnotationToolbarProps {
  activeType: AnnotationType | null;
  onTypeSelect: (type: AnnotationType | null) => void;
}

interface InvisibleScopeAlertProps {
  items: InvisibleScopeItem[];
  onInclude: (id: string) => void;
}

interface DiscrepancyAlertProps {
  discrepancies: DocumentDiscrepancy[];
  onResolve: (id: string, resolution: string) => void;
}

// =============================================================================
// SHEET THUMBNAIL
// =============================================================================

const SheetThumbnail: React.FC<SheetThumbnailProps> = ({ sheet, isSelected, onClick }) => {
  const confidencePercent = sheet.extraction_confidence_bp
    ? basisPointsToPercent(sheet.extraction_confidence_bp)
    : 0;
  
  return (
    <button
      onClick={onClick}
      className={`relative w-full aspect-[4/3] rounded-lg border-2 overflow-hidden transition-all ${
        isSelected
          ? 'border-blue-500 shadow-md'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {sheet.thumbnail_url ? (
        <img
          src={sheet.thumbnail_url}
          alt={sheet.sheet_name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )}
      
      {/* Sheet Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="text-white text-xs font-medium truncate">{sheet.sheet_number}</div>
        <div className="text-white/70 text-xs truncate">{sheet.sheet_name}</div>
      </div>
      
      {/* Discipline Badge */}
      <div className="absolute top-2 left-2">
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          sheet.discipline === 'A' ? 'bg-blue-500 text-white' :
          sheet.discipline === 'S' ? 'bg-red-500 text-white' :
          sheet.discipline === 'M' ? 'bg-green-500 text-white' :
          sheet.discipline === 'E' ? 'bg-yellow-500 text-white' :
          sheet.discipline === 'P' ? 'bg-purple-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {sheet.discipline}
        </span>
      </div>
      
      {/* AI Status */}
      {sheet.ai_processed && (
        <div className="absolute top-2 right-2">
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            confidencePercent >= 80 ? 'bg-green-100 text-green-700' :
            confidencePercent >= 60 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            AI {confidencePercent.toFixed(0)}%
          </span>
        </div>
      )}
    </button>
  );
};

// =============================================================================
// TAKEOFF ELEMENT ROW
// =============================================================================

const TakeoffElementRow: React.FC<TakeoffElementRowProps> = ({
  element,
  isSelected,
  onSelect,
  onVerify,
}) => {
  const confidencePercent = basisPointsToPercent(element.detection_confidence_bp);
  
  const formatQuantity = (qty: number, unit: string) => {
    return `${qty.toLocaleString()} ${unit}`;
  };
  
  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <ElementTypeIcon type={element.element_type} />
          <div>
            <div className="text-sm font-medium text-gray-900">{element.element_name}</div>
            <div className="text-xs text-gray-500">{element.csi_code || 'No CSI'}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-sm text-gray-900">
        {formatQuantity(element.quantity, element.unit)}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                confidencePercent >= 80 ? 'bg-green-500' :
                confidencePercent >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{confidencePercent.toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <VerificationStatusBadge status={element.verification_status} />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onVerify('verified'); }}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Verify"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onVerify('rejected'); }}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Reject"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onVerify('needs_review'); }}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
            title="Flag for Review"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

// =============================================================================
// ELEMENT TYPE ICON
// =============================================================================

const ElementTypeIcon: React.FC<{ type: ElementType }> = ({ type }) => {
  const iconMap: Record<ElementType, JSX.Element> = {
    wall: (
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    door: (
      <svg className="w-4 h-4 text-brown-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    window: (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    floor: (
      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    ceiling: (
      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roof: (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    beam: (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    column: (
      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    stair: (
      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    railing: (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    fixture: (
      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    equipment: (
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    pipe: (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    duct: (
      <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    ),
    conduit: (
      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    area: (
      <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    count: (
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
    other: (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  
  return iconMap[type] || iconMap.other;
};

// =============================================================================
// VERIFICATION STATUS BADGE
// =============================================================================

const VerificationStatusBadge: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  const colorMap: Record<VerificationStatus, string> = {
    pending: 'bg-gray-100 text-gray-700',
    verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    needs_review: 'bg-yellow-100 text-yellow-700',
    auto_verified: 'bg-blue-100 text-blue-700',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// =============================================================================
// ANNOTATION TOOLBAR
// =============================================================================

const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({ activeType, onTypeSelect }) => {
  const tools: { type: AnnotationType; icon: JSX.Element; label: string }[] = [
    {
      type: 'correction',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
      label: 'Correct',
    },
    {
      type: 'addition',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
      label: 'Add',
    },
    {
      type: 'deletion',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      label: 'Delete',
    },
    {
      type: 'note',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>,
      label: 'Note',
    },
    {
      type: 'highlight',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
      label: 'Highlight',
    },
  ];
  
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => onTypeSelect(activeType === tool.type ? null : tool.type)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
            activeType === tool.type
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          title={tool.label}
        >
          {tool.icon}
          <span className="hidden sm:inline">{tool.label}</span>
        </button>
      ))}
    </div>
  );
};

// =============================================================================
// INVISIBLE SCOPE ALERT
// =============================================================================

const InvisibleScopeAlert: React.FC<InvisibleScopeAlertProps> = ({ items, onInclude }) => {
  if (items.length === 0) return null;
  
  const totalCost = items.reduce((sum, item) => sum + item.estimated_cost_cents, 0);
  
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-purple-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
        <div className="flex-1">
          <h4 className="font-medium text-purple-800">
            {items.length} Invisible Scope Items Detected
          </h4>
          <p className="text-sm text-purple-600 mt-1">
            Estimated value: ${(totalCost / 100).toLocaleString()}
          </p>
          <div className="mt-3 space-y-2">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white/50 rounded p-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
                <button
                  onClick={() => onInclude(item.id)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  + Include
                </button>
              </div>
            ))}
            {items.length > 3 && (
              <div className="text-sm text-purple-600">
                +{items.length - 3} more items...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN DRAWING VIEWER
// =============================================================================

export const DrawingViewer: React.FC<DrawingViewerProps> = ({
  estimateId,
  onTakeoffComplete,
}) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);
  const [sheets, setSheets] = useState<DrawingSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<DrawingSheet | null>(null);
  const [elements, setElements] = useState<AITakeoffElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<AITakeoffElement | null>(null);
  const [invisibleScope, setInvisibleScope] = useState<InvisibleScopeItem[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DocumentDiscrepancy[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [splitRatio, setSplitRatio] = useState(50);
  const [activeAnnotation, setActiveAnnotation] = useState<AnnotationType | null>(null);
  const [zoom, setZoom] = useState(100);
  
  const viewerRef = useRef<HTMLDivElement>(null);

  // Fetch documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const docs = await documentApi.listByEstimate(estimateId);
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDoc(docs[0]);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [estimateId]);

  // Fetch sheets when document changes
  useEffect(() => {
    if (!selectedDoc) return;
    
    const fetchSheets = async () => {
      try {
        const sheetList = await sheetApi.listByDocument(selectedDoc.id);
        setSheets(sheetList);
        if (sheetList.length > 0) {
          setSelectedSheet(sheetList[0]);
        }
      } catch (err) {
        console.error('Error fetching sheets:', err);
      }
    };
    fetchSheets();
  }, [selectedDoc]);

  // Fetch elements when sheet changes
  useEffect(() => {
    if (!selectedSheet) return;
    
    const fetchElements = async () => {
      try {
        const elementList = await takeoffElementApi.list(selectedSheet.id);
        setElements(elementList);
        setSelectedElement(null);
      } catch (err) {
        console.error('Error fetching elements:', err);
      }
    };
    fetchElements();
  }, [selectedSheet]);

  // Fetch invisible scope items
  useEffect(() => {
    const fetchInvisibleScope = async () => {
      try {
        const items = await invisibleScopeApi.getUnincluded(estimateId);
        setInvisibleScope(items);
      } catch (err) {
        console.error('Error fetching invisible scope:', err);
      }
    };
    fetchInvisibleScope();
  }, [estimateId]);

  // Run AI Takeoff
  const handleRunTakeoff = async () => {
    if (!selectedSheet) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      const result = await aiTakeoffAgent.runTakeoff({
        sheet_id: selectedSheet.id,
        document_url: selectedDoc?.file_url || '',
        disciplines: [selectedSheet.discipline].filter(Boolean) as string[],
        auto_verify_threshold: 8500, // 85%
      });
      
      setElements(result.elements);
      
      // Update sheet status
      await sheetApi.updateExtractionStatus(selectedSheet.id, {
        ai_processed: true,
        extraction_confidence_bp: result.overall_confidence,
      });
      
      // Refresh invisible scope
      const scopeResult = await scopeScoutAgent.analyze({
        estimate_id: estimateId,
        document_ids: selectedDoc ? [selectedDoc.id] : [],
        detect_invisible_scope: true,
        detect_discrepancies: true,
      });
      
      setInvisibleScope(scopeResult.invisible_scope_items);
      setDiscrepancies(scopeResult.discrepancies);
      
      onTakeoffComplete?.(result.elements);
    } catch (err) {
      console.error('Error running takeoff:', err);
      setError('Failed to run AI takeoff');
    } finally {
      setProcessing(false);
    }
  };

  // Verify element
  const handleVerifyElement = async (elementId: string, status: VerificationStatus) => {
    try {
      const updated = await takeoffElementApi.verify(elementId, status);
      setElements(elements.map(e => e.id === elementId ? updated : e));
    } catch (err) {
      console.error('Error verifying element:', err);
    }
  };

  // Include invisible scope item
  const handleIncludeScope = async (itemId: string) => {
    try {
      await invisibleScopeApi.includeInEstimate(itemId, estimateId);
      setInvisibleScope(invisibleScope.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Error including scope item:', err);
    }
  };

  // Summary stats
  const verifiedCount = elements.filter(e => e.verification_status === 'verified').length;
  const pendingCount = elements.filter(e => e.verification_status === 'pending').length;
  const avgConfidence = elements.length > 0
    ? elements.reduce((sum, e) => sum + e.detection_confidence_bp, 0) / elements.length
    : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[800px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Drawing Viewer
          </h3>
          
          {/* Document Selector */}
          <select
            value={selectedDoc?.id || ''}
            onChange={(e) => {
              const doc = documents.find(d => d.id === e.target.value);
              setSelectedDoc(doc || null);
            }}
            className="text-sm border-gray-300 rounded-md"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.file_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              <span className="font-medium text-green-600">{verifiedCount}</span> verified
            </span>
            <span className="text-gray-500">
              <span className="font-medium text-yellow-600">{pendingCount}</span> pending
            </span>
            <span className="text-gray-500">
              Avg conf: <span className="font-medium">{basisPointsToPercent(avgConfidence).toFixed(0)}%</span>
            </span>
          </div>
          
          {/* Run Takeoff */}
          <button
            onClick={handleRunTakeoff}
            disabled={processing || !selectedSheet}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Run AI Takeoff
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sheet Thumbnails */}
        <div className="w-32 border-r border-gray-200 overflow-y-auto p-2 space-y-2">
          {sheets.map((sheet) => (
            <SheetThumbnail
              key={sheet.id}
              sheet={sheet}
              isSelected={selectedSheet?.id === sheet.id}
              onClick={() => setSelectedSheet(sheet)}
            />
          ))}
        </div>

        {/* Split View */}
        <div className="flex-1 flex">
          {/* Drawing Pane */}
          <div
            ref={viewerRef}
            className="bg-gray-100 overflow-auto"
            style={{ width: `${splitRatio}%` }}
          >
            {selectedSheet ? (
              <div className="relative min-h-full p-4">
                {/* Toolbar */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                  <AnnotationToolbar
                    activeType={activeAnnotation}
                    onTypeSelect={setActiveAnnotation}
                  />
                  <div className="flex items-center gap-2 bg-white rounded-lg shadow px-2 py-1">
                    <button
                      onClick={() => setZoom(Math.max(25, zoom - 25))}
                      className="p-1 text-gray-600 hover:text-gray-900"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-700 w-12 text-center">{zoom}%</span>
                    <button
                      onClick={() => setZoom(Math.min(200, zoom + 25))}
                      className="p-1 text-gray-600 hover:text-gray-900"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Drawing Image */}
                <div
                  className="bg-white shadow-lg mx-auto mt-12"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                >
                  {selectedSheet.image_url ? (
                    <img
                      src={selectedSheet.image_url}
                      alt={selectedSheet.sheet_name}
                      className="max-w-none"
                    />
                  ) : (
                    <div className="w-[800px] h-[600px] flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Drawing preview not available</p>
                        <p className="text-sm mt-2">{selectedSheet.sheet_number}: {selectedSheet.sheet_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Element Overlays */}
                  {elements.map((element) => (
                    element.bounding_box && (
                      <div
                        key={element.id}
                        className={`absolute border-2 cursor-pointer transition-all ${
                          selectedElement?.id === element.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : element.verification_status === 'verified'
                            ? 'border-green-500/50 hover:border-green-500'
                            : 'border-yellow-500/50 hover:border-yellow-500'
                        }`}
                        style={{
                          left: element.bounding_box.x,
                          top: element.bounding_box.y,
                          width: element.bounding_box.width,
                          height: element.bounding_box.height,
                        }}
                        onClick={() => setSelectedElement(element)}
                      />
                    )
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a sheet to view
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="w-1 bg-gray-200 cursor-col-resize hover:bg-blue-400 transition-colors"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startRatio = splitRatio;
              
              const handleMouseMove = (e: MouseEvent) => {
                const container = viewerRef.current?.parentElement;
                if (!container) return;
                const delta = e.clientX - startX;
                const containerWidth = container.clientWidth;
                const newRatio = startRatio + (delta / containerWidth) * 100;
                setSplitRatio(Math.max(30, Math.min(70, newRatio)));
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />

          {/* Data Pane */}
          <div
            className="overflow-auto"
            style={{ width: `${100 - splitRatio}%` }}
          >
            {/* Alerts */}
            <div className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {error}
                </div>
              )}
              
              <InvisibleScopeAlert items={invisibleScope} onInclude={handleIncludeScope} />
            </div>

            {/* Elements Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Element</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {elements.map((element) => (
                    <TakeoffElementRow
                      key={element.id}
                      element={element}
                      isSelected={selectedElement?.id === element.id}
                      onSelect={() => setSelectedElement(element)}
                      onVerify={(status) => handleVerifyElement(element.id, status)}
                    />
                  ))}
                </tbody>
              </table>
              
              {elements.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No elements extracted yet</p>
                  <p className="text-sm mt-2">Click "Run AI Takeoff" to analyze this sheet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingViewer;
