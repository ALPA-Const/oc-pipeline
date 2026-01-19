import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../dashboard.service';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchKPIMetrics', () => {
    it('should fetch and calculate KPI metrics correctly', async () => {
      const mockProjects = [
        { stage_id: 'opp_proposal', value: 1000000 },
        { stage_id: 'opp_proposal', value: 2000000 },
        { stage_id: 'opp_negotiation', value: 3000000 },
        { stage_id: 'opp_award', value: 4000000 },
        { stage_id: 'opp_lost', value: 500000 },
        { stage_id: 'opp_lead_gen', value: 750000 },
        { stage_id: 'opp_proposal', value: 1500000, is_joint_venture: true },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockProjects,
          error: null,
        }),
      } as any);

      const kpis = await dashboardService.fetchKPIMetrics();

      expect(kpis).toHaveLength(6);
      expect(kpis[0]).toMatchObject({
        label: 'Projects Currently Bidding',
        value: 3,
        total: 4500000,
      });
      expect(kpis[1]).toMatchObject({
        label: 'Bids Submitted',
        value: 1,
        total: 3000000,
      });
    });

    it('should handle empty data', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      const kpis = await dashboardService.fetchKPIMetrics();

      expect(kpis).toHaveLength(6);
      expect(kpis[0].value).toBe(0);
      expect(kpis[0].total).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      } as any);

      await expect(dashboardService.fetchKPIMetrics()).rejects.toThrow('Database error');
    });
  });

  describe('fetchBiddingProjects', () => {
    it('should fetch bidding projects correctly', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project A',
          stage_id: 'opp_proposal',
          value: 1000000,
          agency: 'Agency A',
          set_aside: 'small_business',
          solicitation_number: 'SOL-001',
          bid_due_date: '2025-02-15',
          naics_code: '236220',
          project_city: 'Los Angeles',
          project_state: 'CA',
          capacity_percentage: 75,
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProjects,
            error: null,
          }),
        }),
      } as any);

      const projects = await dashboardService.fetchBiddingProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0].bidTitle).toBe('Project A');
      expect(projects[0].magnitude).toBe('$1.00M');
    });
  });

  describe('fetchBiddingAnalytics', () => {
    it('should calculate bidding analytics correctly', async () => {
      const mockProjects = [
        { stage_id: 'opp_proposal', value: 1000000, set_aside: 'small_business' },
        { stage_id: 'opp_proposal', value: 2000000, set_aside: 'veteran_owned' },
        { stage_id: 'opp_proposal', value: 3000000, set_aside: 'small_business' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProjects,
            error: null,
          }),
        }),
      } as any);

      const analytics = await dashboardService.fetchBiddingAnalytics();

      expect(analytics.totalBidding).toBe(3);
      expect(analytics.totalValue).toBe(6000000);
      expect(analytics.bySetAside).toHaveLength(2);
    });
  });

  describe('fetchAnnualTarget', () => {
    it('should calculate annual target metrics correctly', async () => {
      const mockProjects = [
        { stage_id: 'opp_award', value: 10000000 },
        { stage_id: 'opp_award', value: 5000000 },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProjects,
            error: null,
          }),
        }),
      } as any);

      const target = await dashboardService.fetchAnnualTarget();

      expect(target.achieved).toBe(15000000);
      expect(target.target).toBe(100000000);
      expect(target.percentage).toBe(15);
      expect(target.remaining).toBe(85000000);
    });
  });
});