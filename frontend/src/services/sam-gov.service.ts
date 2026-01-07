// ============================================================
// SAM.GOV AUTO-SYNC SERVICE
// Automatically syncs opportunities - no manual import needed
// ============================================================

import { supabase } from '@/lib/supabase';

const SAM_API_KEY = 'SAM-40bae69c-4ef1-41b8-b6a3-c27fed7b2341';
const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2';

export interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string;
  fullParentPathName: string;
  postedDate: string;
  typeOfSetAsideDescription: string;
  typeOfSetAside: string;
  responseDeadLine: string;
  naicsCode: string;
  description: string;
  uiLink: string;
  office: string;
  agency: string;
}

export interface SamSearchResponse {
  totalRecords: number;
  limit: number;
  offset: number;
  opportunitiesData: SamOpportunity[];
}

export const SET_ASIDE_TYPES = [
  { code: 'SBA', label: 'Total Small Business' },
  { code: '8A', label: '8(a)' },
  { code: 'SDVOSBC', label: 'SDVOSB' },
  { code: 'WOSB', label: 'WOSB' },
  { code: 'EDWOSB', label: 'EDWOSB' },
  { code: 'HZC', label: 'HUBZone' },
  { code: 'VSB', label: 'VOSB' },
];

function formatDateForSam(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function getDefaultDateRange() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    postedFrom: formatDateForSam(thirtyDaysAgo),
    postedTo: formatDateForSam(today),
  };
}

export async function searchSamOpportunities(params?: {
  keyword?: string;
  naicsCode?: string;
  state?: string;
  limit?: number;
}): Promise<SamSearchResponse> {
  const dates = getDefaultDateRange();
  
  const queryParams = new URLSearchParams({
    api_key: SAM_API_KEY,
    postedFrom: dates.postedFrom,
    postedTo: dates.postedTo,
    limit: String(params?.limit || 50),
  });

  if (params?.keyword) queryParams.append('title', params.keyword);
  if (params?.naicsCode) queryParams.append('ncode', params.naicsCode);
  if (params?.state) queryParams.append('state', params.state);

  const url = `${SAM_BASE_URL}/search?${queryParams.toString()}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`SAM.gov API error: ${response.status}`);
  
  const data = await response.json();
  return {
    totalRecords: data.totalRecords || 0,
    limit: data.limit || 50,
    offset: data.offset || 0,
    opportunitiesData: data.opportunitiesData || [],
  };
}

export async function importSamOpportunities(
  opportunities: SamOpportunity[]
): Promise<{ imported: number; updated: number; errors: number }> {
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const opp of opportunities) {
    try {
      const solNum = opp.solicitationNumber || opp.noticeId;
      
      const { data: existing } = await supabase
        .from('pursuits')
        .select('id')
        .eq('solicitation_number', solNum)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('pursuits')
          .update({ name: opp.title, agency: opp.agency })
          .eq('id', existing.id);
        if (error) errors++; else updated++;
      } else {
        const { error } = await supabase
          .from('pursuits')
          .insert({
            name: opp.title,
            solicitation_number: solNum,
            agency: opp.agency,
            naics_code: opp.naicsCode,
          });
        if (error) { console.error(error); errors++; } else imported++;
      }
    } catch (e) {
      errors++;
    }
  }

  return { imported, updated, errors };
}

// Auto-sync state
let syncInterval: ReturnType<typeof setInterval> | null = null;
let lastSyncTime: Date | null = null;
const syncCallbacks: ((result: { newCount: number }) => void)[] = [];

export function onSyncComplete(cb: (result: { newCount: number }) => void) {
  syncCallbacks.push(cb);
  return () => syncCallbacks.splice(syncCallbacks.indexOf(cb), 1);
}

export async function autoSync(): Promise<{ imported: number; updated: number; errors: number }> {
  console.log('🔄 Auto-syncing from SAM.gov...');
  const response = await searchSamOpportunities({ limit: 100 });
  const result = await importSamOpportunities(response.opportunitiesData || []);
  lastSyncTime = new Date();
  
  if (result.imported > 0) {
    syncCallbacks.forEach(cb => cb({ newCount: result.imported }));
  }
  
  console.log(`✅ Sync complete: ${result.imported} new, ${result.updated} updated`);
  return result;
}

export function startAutoSync(minutes: number = 30) {
  if (syncInterval) clearInterval(syncInterval);
  console.log(`📡 Auto-sync started (every ${minutes} min)`);
  autoSync().catch(console.error);
  syncInterval = setInterval(() => autoSync().catch(console.error), minutes * 60 * 1000);
}

export function stopAutoSync() {
  if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
}

export function getLastSyncTime() { return lastSyncTime; }

export const samGovService = {
  search: searchSamOpportunities,
  searchOneill: searchSamOpportunities,
  bulkImport: importSamOpportunities,
  sync: autoSync,
  autoSync,
  startAutoSync,
  stopAutoSync,
  getLastSyncTime,
  onSyncComplete,
};

export class SamGovService {
  search = searchSamOpportunities;
  searchOneill = searchSamOpportunities;
  bulkImport = importSamOpportunities;
  sync = autoSync;
  autoSync = autoSync;
  startAutoSync = startAutoSync;
  stopAutoSync = stopAutoSync;
  getLastSyncTime = getLastSyncTime;
  onSyncComplete = onSyncComplete;
}