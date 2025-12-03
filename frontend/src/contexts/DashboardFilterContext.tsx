/**
 * Dashboard Filter Context
 * Unified context for dashboard filtering with support for both simple and advanced filtering
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// Simple filters interface (for basic dashboard)
export interface DashboardFilters {
  dateRange: string;
  agency: string;
  setAside: string;
  projectManager: string;
  state?: string;
  stage?: string;
  set_aside?: string;
  status?: string;
}

// Filter chip for advanced filtering
export interface FilterChip {
  id: string;
  type: 'state' | 'stage' | 'set_aside' | 'status';
  label: string;
  value: string;
}

// Context type with all methods
interface DashboardFilterContextType {
  filters: DashboardFilters;
  filterChips: FilterChip[];
  updateFilter: (key: keyof DashboardFilters, value: string) => void;
  resetFilters: () => void;
  addFilter: (type: FilterChip['type'], value: string, label: string) => void;
  removeFilter: (id: string) => void;
  clearAllFilters: () => void;
  applyKPIFilter: (stage: string) => void;
  trackEvent: (event: string, data?: Record<string, string | number | boolean>) => void;
}

const defaultFilters: DashboardFilters = {
  dateRange: 'all',
  agency: 'all',
  setAside: 'all',
  projectManager: 'all',
};

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

export function DashboardFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [filterChips, setFilterChips] = useState<FilterChip[]>([]);

  /**
   * Track telemetry events
   */
  const trackEvent = useCallback((event: string, data?: Record<string, string | number | boolean>) => {
    console.log(`📊 Event: ${event}`, data);
    
    // Send to analytics if available
    if (typeof window !== 'undefined') {
      const win = window as Window & { gtag?: (...args: unknown[]) => void };
      if (win.gtag) {
        win.gtag('event', event, data);
      }
    }
    
    // Store in local audit log
    const auditEntry = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    
    const auditLog = JSON.parse(localStorage.getItem('dashboard_audit_log') || '[]') as unknown[];
    auditLog.push(auditEntry);
    
    // Keep only last 100 events
    if (auditLog.length > 100) {
      auditLog.shift();
    }
    
    localStorage.setItem('dashboard_audit_log', JSON.stringify(auditLog));
  }, []);

  /**
   * Update a single filter (simple mode)
   */
  const updateFilter = useCallback((key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    trackEvent('filter_change', { filter_type: key, filter_value: value });
  }, [trackEvent]);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setFilterChips([]);
    trackEvent('filters_reset');
  }, [trackEvent]);

  /**
   * Add filter chip (advanced mode)
   */
  const addFilter = useCallback((type: FilterChip['type'], value: string, label: string) => {
    const chipId = `${type}-${value}`;
    
    // Remove existing chip of same type
    setFilterChips(prev => prev.filter(chip => chip.type !== type));
    
    // Add new chip
    const newChip: FilterChip = {
      id: chipId,
      type,
      label,
      value,
    };
    
    setFilterChips(prev => [...prev, newChip]);
    
    // Update filters
    setFilters(prev => ({
      ...prev,
      [type]: value,
    }));

    trackEvent('filter_applied', { type, value, label });
  }, [trackEvent]);

  /**
   * Remove filter chip
   */
  const removeFilter = useCallback((id: string) => {
    const chip = filterChips.find(c => c.id === id);
    if (!chip) return;

    setFilterChips(prev => prev.filter(c => c.id !== id));
    
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[chip.type as keyof DashboardFilters];
      return newFilters;
    });

    trackEvent('filter_removed', { type: chip.type, value: chip.value });
  }, [filterChips, trackEvent]);

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setFilterChips([]);
    setFilters(defaultFilters);
    trackEvent('filters_cleared');
  }, [trackEvent]);

  /**
   * Apply KPI filter (when clicking KPI card)
   */
  const applyKPIFilter = useCallback((stage: string) => {
    const stageLabels: Record<string, string> = {
      opp_proposal: 'Currently Bidding',
      opp_negotiation: 'Bids Submitted',
      opp_award: 'Projects Awarded',
      opp_lost: 'Projects Lost',
      opp_lead_gen: 'Pre-Solicitation',
    };

    const label = stageLabels[stage] || stage;
    addFilter('stage', stage, label);
    trackEvent('kpi_clicked', { stage, label });
  }, [addFilter, trackEvent]);

  return (
    <DashboardFilterContext.Provider
      value={{
        filters,
        filterChips,
        updateFilter,
        resetFilters,
        addFilter,
        removeFilter,
        clearAllFilters,
        applyKPIFilter,
        trackEvent,
      }}
    >
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
}

// Alias for compatibility
export const useDashboardFilter = useDashboardFilters;