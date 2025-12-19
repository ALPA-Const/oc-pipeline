/**
 * OC Pipeline - Drawing Viewer & AI Takeoff API
 * 
 * Document management, AI-powered quantity extraction,
 * split-screen viewer with drawing-to-data linking
 */

import { supabase } from '../lib/supabase';
import type {
  ProjectDocument,
  DrawingSheet,
  AITakeoffElement,
  TakeoffAnnotation,
  InvisibleScopeItem,
  DocumentDiscrepancy,
  GeneratedRFI,
  AITakeoffInput,
  AITakeoffOutput,
  ScopeScoutOutput,
  DocumentType,
  DocumentCategory,
  ElementType,
  AnnotationType,
  ProcessDocumentRequest,
  TakeoffFilters,
} from '../types/agentic-ai';

// =====================================================
// PROJECT DOCUMENTS
// =====================================================

export const documentApi = {
  /**
   * List documents for an estimate
   */
  async listByEstimate(estimateId: string): Promise<ProjectDocument[]> {
    const { data, error } = await supabase
      .from('project_documents')
      .select(`
        *,
        sheets:drawing_sheets(*)
      `)
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single document with sheets
   */
  async get(documentId: string): Promise<ProjectDocument | null> {
    const { data, error } = await supabase
      .from('project_documents')
      .select(`
        *,
        sheets:drawing_sheets(*)
      `)
      .eq('id', documentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new document record
   */
  async create(document: Omit<ProjectDocument, 'id' | 'created_at' | 'updated_at' | 'sheets'>): Promise<ProjectDocument> {
    const { data, error } = await supabase
      .from('project_documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update document status
   */
  async updateStatus(
    documentId: string,
    status: {
      upload_status?: string;
      ocr_status?: string;
      ai_processed?: boolean;
    }
  ): Promise<ProjectDocument> {
    const { data, error } = await supabase
      .from('project_documents')
      .update({
        ...status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a document and all related data
   */
  async delete(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },
};

// =====================================================
// DRAWING SHEETS
// =====================================================

export const sheetApi = {
  /**
   * List sheets for a document
   */
  async listByDocument(documentId: string): Promise<DrawingSheet[]> {
    const { data, error } = await supabase
      .from('drawing_sheets')
      .select(`
        *,
        takeoff_elements:ai_takeoff_elements(*),
        annotations:takeoff_annotations(*)
      `)
      .eq('document_id', documentId)
      .order('page_index', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single sheet with elements
   */
  async get(sheetId: string): Promise<DrawingSheet | null> {
    const { data, error } = await supabase
      .from('drawing_sheets')
      .select(`
        *,
        takeoff_elements:ai_takeoff_elements(*),
        annotations:takeoff_annotations(*)
      `)
      .eq('id', sheetId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create sheets for a document (bulk)
   */
  async createBulk(sheets: Omit<DrawingSheet, 'id' | 'created_at' | 'updated_at' | 'takeoff_elements' | 'annotations'>[]): Promise<DrawingSheet[]> {
    const { data, error } = await supabase
      .from('drawing_sheets')
      .insert(sheets)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Update sheet extraction status
   */
  async updateExtractionStatus(
    sheetId: string,
    status: string,
    confidence?: number
  ): Promise<DrawingSheet> {
    const { data, error } = await supabase
      .from('drawing_sheets')
      .update({
        ai_extraction_status: status,
        extraction_confidence: confidence,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sheetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// =====================================================
// AI TAKEOFF ELEMENTS
// =====================================================

export const takeoffElementApi = {
  /**
   * List takeoff elements with filters
   */
  async list(filters: TakeoffFilters): Promise<AITakeoffElement[]> {
    let query = supabase
      .from('ai_takeoff_elements')
      .select('*');

    if (filters.sheet_id) {
      query = query.eq('sheet_id', filters.sheet_id);
    }
    if (filters.estimate_id) {
      query = query.eq('estimate_id', filters.estimate_id);
    }
    if (filters.element_type) {
      query = query.eq('element_type', filters.element_type);
    }
    if (filters.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }
    if (filters.min_confidence !== undefined) {
      query = query.gte('detection_confidence', filters.min_confidence);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single takeoff element
   */
  async get(elementId: string): Promise<AITakeoffElement | null> {
    const { data, error } = await supabase
      .from('ai_takeoff_elements')
      .select('*')
      .eq('id', elementId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create takeoff elements (bulk from AI)
   */
  async createBulk(elements: Omit<AITakeoffElement, 'id' | 'created_at' | 'updated_at'>[]): Promise<AITakeoffElement[]> {
    const { data, error } = await supabase
      .from('ai_takeoff_elements')
      .insert(elements)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Verify a takeoff element
   */
  async verify(elementId: string, userId: string): Promise<AITakeoffElement> {
    const { data, error } = await supabase
      .from('ai_takeoff_elements')
      .update({
        verified: true,
        verified_by: userId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', elementId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Link takeoff element to line item
   */
  async linkToLineItem(elementId: string, lineItemId: string): Promise<AITakeoffElement> {
    const { data, error } = await supabase
      .from('ai_takeoff_elements')
      .update({
        linked_line_item_id: lineItemId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', elementId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update element quantity (correction)
   */
  async updateQuantity(elementId: string, newQuantity: number, notes?: string): Promise<AITakeoffElement> {
    const { data, error } = await supabase
      .from('ai_takeoff_elements')
      .update({
        quantity: newQuantity,
        extraction_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', elementId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get summary by element type
   */
  async getSummaryByType(sheetId: string): Promise<Record<ElementType, { count: number; totalQuantity: number }>> {
    const elements = await this.list({ sheet_id: sheetId });

    const summary: Record<string, { count: number; totalQuantity: number }> = {};

    for (const element of elements) {
      if (!summary[element.element_type]) {
        summary[element.element_type] = { count: 0, totalQuantity: 0 };
      }
      summary[element.element_type].count++;
      summary[element.element_type].totalQuantity += element.quantity;
    }

    return summary as Record<ElementType, { count: number; totalQuantity: number }>;
  },
};

// =====================================================
// TAKEOFF ANNOTATIONS
// =====================================================

export const annotationApi = {
  /**
   * List annotations for a sheet
   */
  async listBySheet(sheetId: string): Promise<TakeoffAnnotation[]> {
    const { data, error } = await supabase
      .from('takeoff_annotations')
      .select('*')
      .eq('sheet_id', sheetId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create an annotation
   */
  async create(annotation: Omit<TakeoffAnnotation, 'id' | 'created_at' | 'updated_at'>): Promise<TakeoffAnnotation> {
    const { data, error } = await supabase
      .from('takeoff_annotations')
      .insert(annotation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an annotation
   */
  async update(annotationId: string, updates: Partial<TakeoffAnnotation>): Promise<TakeoffAnnotation> {
    const { data, error } = await supabase
      .from('takeoff_annotations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', annotationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete an annotation
   */
  async delete(annotationId: string): Promise<void> {
    const { error } = await supabase
      .from('takeoff_annotations')
      .delete()
      .eq('id', annotationId);

    if (error) throw error;
  },
};

// =====================================================
// INVISIBLE SCOPE ITEMS
// =====================================================

export const invisibleScopeApi = {
  /**
   * List invisible scope items for an estimate
   */
  async listByEstimate(estimateId: string): Promise<InvisibleScopeItem[]> {
    const { data, error } = await supabase
      .from('invisible_scope_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('scope_type', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create invisible scope items (from AI detection)
   */
  async createBulk(items: Omit<InvisibleScopeItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<InvisibleScopeItem[]> {
    const { data, error } = await supabase
      .from('invisible_scope_items')
      .insert(items)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Include item in estimate
   */
  async includeInEstimate(itemId: string, lineItemId: string): Promise<InvisibleScopeItem> {
    const { data, error } = await supabase
      .from('invisible_scope_items')
      .update({
        included_in_estimate: true,
        linked_line_item_id: lineItemId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get unincluded items (scope gaps)
   */
  async getUnincluded(estimateId: string): Promise<InvisibleScopeItem[]> {
    const { data, error } = await supabase
      .from('invisible_scope_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .eq('included_in_estimate', false);

    if (error) throw error;
    return data || [];
  },
};

// =====================================================
// DOCUMENT DISCREPANCIES
// =====================================================

export const discrepancyApi = {
  /**
   * List discrepancies for an estimate
   */
  async listByEstimate(estimateId: string): Promise<DocumentDiscrepancy[]> {
    const { data, error } = await supabase
      .from('document_discrepancies')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('severity', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a discrepancy
   */
  async create(discrepancy: Omit<DocumentDiscrepancy, 'id' | 'created_at' | 'updated_at'>): Promise<DocumentDiscrepancy> {
    const { data, error } = await supabase
      .from('document_discrepancies')
      .insert(discrepancy)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Resolve a discrepancy
   */
  async resolve(discrepancyId: string, userId: string, notes: string): Promise<DocumentDiscrepancy> {
    const { data, error } = await supabase
      .from('document_discrepancies')
      .update({
        resolution_status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', discrepancyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get unresolved discrepancies
   */
  async getUnresolved(estimateId: string): Promise<DocumentDiscrepancy[]> {
    const { data, error } = await supabase
      .from('document_discrepancies')
      .select('*')
      .eq('estimate_id', estimateId)
      .eq('resolution_status', 'open');

    if (error) throw error;
    return data || [];
  },
};

// =====================================================
// RFI GENERATOR
// =====================================================

export const rfiApi = {
  /**
   * List RFIs for an estimate
   */
  async listByEstimate(estimateId: string): Promise<GeneratedRFI[]> {
    const { data, error } = await supabase
      .from('generated_rfis')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create an RFI
   */
  async create(rfi: Omit<GeneratedRFI, 'id' | 'created_at' | 'updated_at'>): Promise<GeneratedRFI> {
    const { data, error } = await supabase
      .from('generated_rfis')
      .insert(rfi)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update RFI status
   */
  async updateStatus(rfiId: string, status: string, response?: string): Promise<GeneratedRFI> {
    const { data, error } = await supabase
      .from('generated_rfis')
      .update({
        status,
        response_text: response,
        response_received_date: response ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rfiId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Generate next RFI number
   */
  async generateRfiNumber(estimateId: string): Promise<string> {
    const { data: estimate } = await supabase
      .from('estimates')
      .select('estimate_number')
      .eq('id', estimateId)
      .single();

    const { count } = await supabase
      .from('generated_rfis')
      .select('*', { count: 'exact', head: true })
      .eq('estimate_id', estimateId);

    const nextNumber = (count || 0) + 1;
    return `${estimate?.estimate_number || 'EST'}-RFI-${String(nextNumber).padStart(3, '0')}`;
  },
};

// =====================================================
// AI TAKEOFF AGENT
// =====================================================

export const aiTakeoffAgent = {
  /**
   * Run AI takeoff on document/sheets
   * NOTE: This is a simulation - in production, this would call
   * a computer vision API (like Togal.ai or similar)
   */
  async runTakeoff(input: AITakeoffInput): Promise<AITakeoffOutput> {
    const startTime = Date.now();

    // Get document and sheets
    const document = await documentApi.get(input.document_id);
    if (!document) throw new Error('Document not found');

    const sheets = input.sheet_ids
      ? await Promise.all(input.sheet_ids.map(id => sheetApi.get(id)))
      : document.sheets || [];

    const validSheets = sheets.filter((s): s is DrawingSheet => s !== null);

    // Update document status
    await documentApi.updateStatus(input.document_id, {
      ai_processed: false,
      upload_status: 'processing',
    });

    const allElements: AITakeoffElement[] = [];

    // Process each sheet
    for (const sheet of validSheets) {
      await sheetApi.updateExtractionStatus(sheet.id, 'processing');

      // SIMULATED AI EXTRACTION
      // In production, this would call a CV API
      const simulatedElements = this.simulateTakeoffExtraction(sheet, input);

      // Create elements in database
      const createdElements = await takeoffElementApi.createBulk(simulatedElements);
      allElements.push(...createdElements);

      // Update sheet status
      const avgConfidence = createdElements.length > 0
        ? Math.round(createdElements.reduce((s, e) => s + e.detection_confidence, 0) / createdElements.length)
        : 0;

      await sheetApi.updateExtractionStatus(sheet.id, 'processed', avgConfidence);
    }

    // Update document status
    await documentApi.updateStatus(input.document_id, {
      ai_processed: true,
      upload_status: 'processed',
    });

    // Build summary
    const byType: Record<ElementType, number> = {} as Record<ElementType, number>;
    const byCsi: Record<string, number> = {};

    for (const element of allElements) {
      byType[element.element_type] = (byType[element.element_type] || 0) + 1;
      if (element.csi_code) {
        byCsi[element.csi_code] = (byCsi[element.csi_code] || 0) + 1;
      }
    }

    const avgConfidence = allElements.length > 0
      ? Math.round(allElements.reduce((s, e) => s + e.detection_confidence, 0) / allElements.length)
      : 0;

    const lowConfidenceCount = allElements.filter(e => e.detection_confidence < 6000).length;

    return {
      takeoff_elements: allElements,
      extraction_summary: {
        total_elements: allElements.length,
        by_type: byType,
        by_csi: byCsi,
        average_confidence: avgConfidence,
        low_confidence_count: lowConfidenceCount,
      },
      processing_time_ms: Date.now() - startTime,
      model_version: 'oc-pipeline-takeoff-v1.0-simulated',
    };
  },

  /**
   * Simulate takeoff extraction (placeholder for real CV)
   */
  simulateTakeoffExtraction(
    sheet: DrawingSheet,
    input: AITakeoffInput
  ): Omit<AITakeoffElement, 'id' | 'created_at' | 'updated_at'>[] {
    const elements: Omit<AITakeoffElement, 'id' | 'created_at' | 'updated_at'>[] = [];

    // Generate simulated elements based on sheet type
    const elementTypes: ElementType[] = input.target_elements || ['wall', 'door', 'window', 'area'];

    for (const type of elementTypes) {
      // Generate 3-10 elements per type per sheet (simulation)
      const count = Math.floor(Math.random() * 8) + 3;

      for (let i = 0; i < count; i++) {
        const quantity = type === 'area'
          ? Math.round(Math.random() * 5000 + 100)
          : type === 'linear' || type === 'wall'
          ? Math.round(Math.random() * 500 + 10)
          : Math.round(Math.random() * 20 + 1);

        const unit = type === 'area' ? 'SF' : type === 'linear' || type === 'wall' ? 'LF' : 'EA';

        elements.push({
          sheet_id: sheet.id,
          estimate_id: null,
          element_type: type,
          element_subtype: `${type}-${i + 1}`,
          csi_code: this.getCsiCodeForType(type),
          material_description: this.getDescriptionForType(type),
          quantity: quantity,
          unit_of_measure: unit,
          calculation_method: type === 'area' ? 'area' : type === 'count' ? 'count' : 'linear',
          raw_measurement: {
            type: type === 'area' ? 'area' : type === 'count' ? 'count' : 'length',
            value: quantity,
            unit: unit,
          },
          coordinates: {
            x: Math.round(Math.random() * 800 + 100),
            y: Math.round(Math.random() * 600 + 100),
            width: Math.round(Math.random() * 200 + 50),
            height: Math.round(Math.random() * 150 + 30),
          },
          grid_reference: `${String.fromCharCode(65 + Math.floor(Math.random() * 8))}-${Math.floor(Math.random() * 10) + 1}`,
          layer_name: sheet.discipline ? `${sheet.discipline}-${type.toUpperCase()}` : null,
          detection_confidence: Math.round(Math.random() * 2500 + 6500), // 65-90%
          verified: false,
          verified_by: null,
          verified_at: null,
          linked_line_item_id: null,
          ai_model_version: 'oc-pipeline-takeoff-v1.0-simulated',
          extraction_notes: 'Simulated extraction - replace with actual CV API',
        });
      }
    }

    return elements;
  },

  /**
   * Get CSI code for element type
   */
  getCsiCodeForType(type: ElementType): string {
    const csiMap: Record<ElementType, string> = {
      wall: '09 29 00',
      door: '08 11 00',
      window: '08 51 00',
      fixture: '22 40 00',
      area: '09 30 00',
      linear: '09 29 00',
      count: '00 00 00',
      volume: '03 30 00',
    };
    return csiMap[type] || '00 00 00';
  },

  /**
   * Get description for element type
   */
  getDescriptionForType(type: ElementType): string {
    const descMap: Record<ElementType, string> = {
      wall: 'Interior partition wall - GWB on metal studs',
      door: 'Interior door with frame and hardware',
      window: 'Window assembly with frame',
      fixture: 'Plumbing or electrical fixture',
      area: 'Floor/ceiling area',
      linear: 'Linear element (baseboard, trim, etc.)',
      count: 'Counted item',
      volume: 'Concrete or fill volume',
    };
    return descMap[type] || 'Extracted element';
  },
};

// =====================================================
// SCOPE SCOUT AGENT
// =====================================================

export const scopeScoutAgent = {
  /**
   * Run scope analysis to detect invisible scope and discrepancies
   */
  async analyze(estimateId: string): Promise<ScopeScoutOutput> {
    // Get line items
    const { data: lineItems } = await supabase
      .from('line_items')
      .select(`
        *,
        csi_code:csi_codes(code, name)
      `)
      .eq('estimate_id', estimateId);

    if (!lineItems || lineItems.length === 0) {
      return {
        invisible_scope_items: [],
        document_discrepancies: [],
        generated_rfis: [],
        scope_coverage_score: 0,
        recommendations: ['No line items found in estimate'],
      };
    }

    // Detect invisible scope items
    const invisibleItems = await this.detectInvisibleScope(estimateId, lineItems);

    // Detect document discrepancies
    const discrepancies = await this.detectDiscrepancies(estimateId);

    // Generate RFIs for critical discrepancies
    const rfis = await this.generateRfisForDiscrepancies(estimateId, discrepancies);

    // Calculate scope coverage score
    const totalPossibleScope = lineItems.length + invisibleItems.length;
    const coveredScope = lineItems.length + invisibleItems.filter(i => i.included_in_estimate).length;
    const scopeCoverageScore = Math.round((coveredScope / totalPossibleScope) * 10000);

    // Generate recommendations
    const recommendations: string[] = [];
    if (invisibleItems.filter(i => !i.included_in_estimate).length > 0) {
      recommendations.push(`Include ${invisibleItems.filter(i => !i.included_in_estimate).length} identified invisible scope items`);
    }
    if (discrepancies.filter(d => d.resolution_status === 'open').length > 0) {
      recommendations.push(`Resolve ${discrepancies.filter(d => d.resolution_status === 'open').length} document discrepancies`);
    }
    if (rfis.filter(r => r.status === 'draft').length > 0) {
      recommendations.push(`Submit ${rfis.filter(r => r.status === 'draft').length} RFIs to clarify ambiguities`);
    }

    return {
      invisible_scope_items: invisibleItems,
      document_discrepancies: discrepancies,
      generated_rfis: rfis,
      scope_coverage_score: scopeCoverageScore,
      recommendations,
    };
  },

  /**
   * Detect invisible scope items based on line items
   */
  async detectInvisibleScope(estimateId: string, lineItems: any[]): Promise<InvisibleScopeItem[]> {
    const invisibleItems: Omit<InvisibleScopeItem, 'id' | 'created_at' | 'updated_at'>[] = [];

    // Rules for invisible scope detection
    const scopeRules: Array<{
      trigger: (item: any) => boolean;
      items: Array<{
        scope_type: InvisibleScopeItem['scope_type'];
        description: string;
        costMultiplier: number;
      }>;
    }> = [
      {
        // Drywall triggers
        trigger: (item) => item.csi_code?.code?.startsWith('09 29'),
        items: [
          { scope_type: 'fastener', description: 'Drywall screws and fasteners', costMultiplier: 0.02 },
          { scope_type: 'prep', description: 'Joint compound and tape', costMultiplier: 0.05 },
          { scope_type: 'accessory', description: 'Corner bead and trim', costMultiplier: 0.03 },
        ],
      },
      {
        // Concrete triggers
        trigger: (item) => item.csi_code?.code?.startsWith('03'),
        items: [
          { scope_type: 'prep', description: 'Formwork and shoring', costMultiplier: 0.15 },
          { scope_type: 'accessory', description: 'Rebar and reinforcement', costMultiplier: 0.10 },
          { scope_type: 'misc', description: 'Curing compound and protection', costMultiplier: 0.02 },
        ],
      },
      {
        // Door triggers
        trigger: (item) => item.csi_code?.code?.startsWith('08 11'),
        items: [
          { scope_type: 'accessory', description: 'Door hardware (hinges, closers, stops)', costMultiplier: 0.20 },
          { scope_type: 'prep', description: 'Frame grouting and anchoring', costMultiplier: 0.05 },
        ],
      },
      {
        // Painting triggers
        trigger: (item) => item.csi_code?.code?.startsWith('09 91'),
        items: [
          { scope_type: 'prep', description: 'Surface preparation and priming', costMultiplier: 0.15 },
          { scope_type: 'tool', description: 'Masking and protection', costMultiplier: 0.05 },
        ],
      },
    ];

    for (const item of lineItems) {
      for (const rule of scopeRules) {
        if (rule.trigger(item)) {
          for (const scopeItem of rule.items) {
            // Check if already exists
            const { data: existing } = await supabase
              .from('invisible_scope_items')
              .select('id')
              .eq('estimate_id', estimateId)
              .eq('parent_line_item_id', item.id)
              .eq('item_description', scopeItem.description)
              .single();

            if (!existing) {
              const estimatedCost = Math.round(item.total_cost * scopeItem.costMultiplier);
              invisibleItems.push({
                estimate_id: estimateId,
                parent_line_item_id: item.id,
                scope_type: scopeItem.scope_type,
                item_description: scopeItem.description,
                csi_code: item.csi_code?.code || null,
                estimated_quantity: null,
                unit_of_measure: null,
                estimated_unit_cost: null,
                estimated_total_cost: estimatedCost,
                calculation_basis: `${(scopeItem.costMultiplier * 100).toFixed(0)}% of parent item cost`,
                detection_source: 'rule_based',
                confidence_score: 7500,
                included_in_estimate: false,
                linked_line_item_id: null,
              });
            }
          }
        }
      }
    }

    // Create in database
    if (invisibleItems.length > 0) {
      const created = await invisibleScopeApi.createBulk(invisibleItems);
      return created;
    }

    // Return existing items
    return invisibleScopeApi.listByEstimate(estimateId);
  },

  /**
   * Detect document discrepancies
   */
  async detectDiscrepancies(estimateId: string): Promise<DocumentDiscrepancy[]> {
    // In production, this would compare drawings vs specs
    // For now, return existing discrepancies
    return discrepancyApi.listByEstimate(estimateId);
  },

  /**
   * Generate RFIs for critical discrepancies
   */
  async generateRfisForDiscrepancies(
    estimateId: string,
    discrepancies: DocumentDiscrepancy[]
  ): Promise<GeneratedRFI[]> {
    const rfis: GeneratedRFI[] = [];

    const criticalDiscrepancies = discrepancies.filter(
      d => d.severity === 'critical' && d.resolution_status === 'open' && !d.rfi_number
    );

    for (const discrepancy of criticalDiscrepancies) {
      const rfiNumber = await rfiApi.generateRfiNumber(estimateId);

      const rfi = await rfiApi.create({
        estimate_id: estimateId,
        discrepancy_id: discrepancy.id,
        rfi_number: rfiNumber,
        subject: `Clarification Required: ${discrepancy.description.substring(0, 100)}`,
        question: `Please clarify the following discrepancy identified between documents:\n\n${discrepancy.description}\n\nDrawing shows: ${discrepancy.drawing_states || 'N/A'}\nSpecification states: ${discrepancy.spec_states || 'N/A'}`,
        background_context: `This discrepancy was identified during AI-assisted scope review of the estimate. The conflict affects pricing and scope accuracy.`,
        referenced_documents: [],
        suggested_resolution: discrepancy.recommended_action || null,
        priority: 'high',
        status: 'draft',
        submitted_date: null,
        response_due_date: null,
        response_received_date: null,
        response_text: null,
        cost_impact: 0,
        schedule_impact_days: 0,
        created_by: null,
      });

      rfis.push(rfi);

      // Update discrepancy with RFI number
      await supabase
        .from('document_discrepancies')
        .update({
          rfi_number: rfiNumber,
          resolution_status: 'rfi_generated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', discrepancy.id);
    }

    // Return all RFIs
    return rfiApi.listByEstimate(estimateId);
  },
};

export default {
  document: documentApi,
  sheet: sheetApi,
  takeoffElement: takeoffElementApi,
  annotation: annotationApi,
  invisibleScope: invisibleScopeApi,
  discrepancy: discrepancyApi,
  rfi: rfiApi,
  aiTakeoff: aiTakeoffAgent,
  scopeScout: scopeScoutAgent,
};
