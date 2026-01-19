import { supabase } from '@/lib/supabase';
import type { DashboardKPI, BiddingProject, CountdownTimer, PipelineVelocity, CapacityUtilization, AnnualTarget, BiddingAnalytics } from '@/types/dashboard.types';

export class DashboardService {
  // Calculate countdown timer
  calculateCountdown(bidDueDateTime: string): CountdownTimer {
    const now = new Date();
    const dueDate = new Date(bidDueDateTime);
    const diffMs = dueDate.getTime() - now.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    let displayText = '';
    let urgencyLevel: 'urgent' | 'moderate' | 'plenty' = 'plenty';
    let color = '#10B981'; // green

    if (days < 0) {
      displayText = 'OVERDUE';
      urgencyLevel = 'urgent';
      color = '#EF4444'; // red
    } else if (days === 0 && hours < 24) {
      displayText = `${hours}h ${minutes}m`;
      urgencyLevel = 'urgent';
      color = '#EF4444'; // red
    } else if (days < 7) {
      displayText = `${days}d ${hours}h`;
      urgencyLevel = 'urgent';
      color = '#EF4444'; // red
    } else if (days < 14) {
      displayText = `${days}d ${hours}h`;
      urgencyLevel = 'moderate';
      color = '#F59E0B'; // yellow
    } else {
      displayText = `${days} days`;
      urgencyLevel = 'plenty';
      color = '#10B981'; // green
    }

    return {
      days,
      hours,
      minutes,
      seconds,
      displayText,
      urgencyLevel,
      color,
    };
  }

  // Fetch KPI metrics
  async fetchKPIMetrics(): Promise<DashboardKPI[]> {
    try {
      console.log('🔍 Fetching KPI metrics...');

      // Fetch all opportunity projects
      const { data: projects, error } = await supabase
        .from('pipeline_projects')
        .select('*')
        .eq('pipeline_type', 'opportunity');

      if (error) throw error;

      console.log('✅ Fetched projects for KPIs:', projects.length);

      // Calculate KPIs
      const biddingProjects = projects.filter(p => p.stage_id === 'opp_proposal');
      const submittedProjects = projects.filter(p => p.stage_id === 'opp_negotiation');
      const awardedProjects = projects.filter(p => p.stage_id === 'opp_award');
      const lostProjects = projects.filter(p => p.stage_id === 'opp_lost');
      const preSolicitationProjects = projects.filter(p => p.is_presolicitation === true);
      const jointVentureProjects = projects.filter(p => p.is_joint_venture === true);

      const biddingValue = biddingProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      const submittedValue = submittedProjects.reduce((sum, p) => sum + (p.submitted_amount || p.value || 0), 0);
      const awardedValue = awardedProjects.reduce((sum, p) => sum + (p.awarded_amount || p.value || 0), 0);
      const lostValue = lostProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      const preSolicitationValue = preSolicitationProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      const jointVentureValue = jointVentureProjects.reduce((sum, p) => sum + (p.value || 0), 0);

      // Calculate variance for lost projects
      const lostVariance = lostProjects.reduce((sum, p) => {
        const submitted = p.submitted_amount || 0;
        const winning = p.winning_bid_amount || 0;
        return sum + (submitted - winning);
      }, 0);

      // Fetch annual target
      const { data: targetData } = await supabase
        .from('annual_targets')
        .select('*')
        .eq('year', 2026)
        .single();

      const annualTarget = targetData?.target_amount || 30000000;
      const remainingToTarget = annualTarget - awardedValue;

      // Calculate win rate
      const totalDecided = awardedProjects.length + lostProjects.length;
      const winRate = totalDecided > 0 ? (awardedProjects.length / totalDecided) * 100 : 0;

      const kpis: DashboardKPI[] = [
        {
          label: 'Projects Currently Bidding',
          value: biddingProjects.length,
          displayValue: `${biddingProjects.length} ($${(biddingValue / 1000000).toFixed(1)}M)`,
          color: '#3B82F6',
        },
        {
          label: 'Bids Submitted',
          value: submittedProjects.length,
          displayValue: `${submittedProjects.length} ($${(submittedValue / 1000000).toFixed(1)}M)`,
          color: '#8B5CF6',
        },
        {
          label: 'Projects Awarded',
          value: awardedProjects.length,
          displayValue: `${awardedProjects.length} ($${(awardedValue / 1000000).toFixed(1)}M)`,
          color: '#10B981',
        },
        {
          label: 'Projects Lost',
          value: lostProjects.length,
          displayValue: `${lostProjects.length} ($${(lostValue / 1000000).toFixed(1)}M)`,
          change: lostVariance,
          changeLabel: `Avg variance: $${(lostVariance / (lostProjects.length || 1) / 1000).toFixed(0)}K`,
          color: '#EF4444',
        },
        {
          label: 'Annual Target 2026',
          value: annualTarget,
          displayValue: `$${(annualTarget / 1000000).toFixed(1)}M`,
          color: '#06B6D4',
        },
        {
          label: 'Amount Awarded YTD',
          value: awardedValue,
          displayValue: `$${(awardedValue / 1000000).toFixed(1)}M`,
          change: (awardedValue / annualTarget) * 100,
          changeLabel: `${((awardedValue / annualTarget) * 100).toFixed(1)}% of target`,
          color: '#10B981',
        },
        {
          label: 'Remaining to Target',
          value: remainingToTarget,
          displayValue: `$${(remainingToTarget / 1000000).toFixed(1)}M`,
          change: (remainingToTarget / annualTarget) * 100,
          changeLabel: `${((remainingToTarget / annualTarget) * 100).toFixed(1)}% remaining`,
          color: '#F59E0B',
        },
        {
          label: 'Win Rate',
          value: winRate,
          displayValue: `${winRate.toFixed(1)}%`,
          changeLabel: `${awardedProjects.length} won, ${lostProjects.length} lost`,
          color: winRate >= 50 ? '#10B981' : '#F59E0B',
        },
        {
          label: 'Pre-Solicitation Projects',
          value: preSolicitationProjects.length,
          displayValue: `${preSolicitationProjects.length} ($${(preSolicitationValue / 1000000).toFixed(1)}M)`,
          color: '#94A3B8',
        },
        {
          label: 'Joint Venture Projects',
          value: jointVentureProjects.length,
          displayValue: `${jointVentureProjects.length} ($${(jointVentureValue / 1000000).toFixed(1)}M)`,
          color: '#EC4899',
        },
      ];

      return kpis;
    } catch (error) {
      console.error('❌ Error fetching KPI metrics:', error);
      throw error;
    }
  }

  // Fetch projects currently bidding
  async fetchBiddingProjects(): Promise<BiddingProject[]> {
    try {
      console.log('🔍 Fetching projects currently bidding...');

      const { data, error } = await supabase
        .from('pipeline_projects')
        .select('*')
        .eq('pipeline_type', 'opportunity')
        .eq('stage_id', 'opp_proposal')
        .order('bid_due_datetime', { ascending: true });

      if (error) throw error;

      console.log('✅ Fetched bidding projects:', data.length);

      const biddingProjects: BiddingProject[] = data.map(project => {
        const countdown = this.calculateCountdown(project.bid_due_datetime);
        
        return {
          id: project.id,
          agency: project.agency || '',
          setAside: project.set_aside || 'none',
          bidTitle: project.name,
          webLink: project.web_link || '',
          solicitationNumber: project.solicitation_number || '',
          siteVisitDateTime: project.site_visit_datetime || '',
          bidDueDateTime: project.bid_due_datetime || '',
          rfiDueDateTime: project.rfi_due_datetime || '',
          magnitude: project.value || 0,
          naicsCode: project.naics_code || '',
          periodOfPerformance: project.period_of_performance || '',
          projectCity: project.project_city || '',
          projectState: project.project_state || '',
          projectLatitude: project.project_latitude || 0,
          projectLongitude: project.project_longitude || 0,
          capacityPercentage: project.capacity_percentage || 0,
          daysUntilDue: countdown.days,
          hoursUntilDue: countdown.hours,
          urgencyLevel: countdown.urgencyLevel,
          urgencyColor: countdown.color,
        };
      });

      return biddingProjects;
    } catch (error) {
      console.error('❌ Error fetching bidding projects:', error);
      throw error;
    }
  }

  // Calculate pipeline velocity
  async calculatePipelineVelocity(): Promise<PipelineVelocity> {
    try {
      console.log('🔍 Calculating pipeline velocity...');

      const { data, error } = await supabase
        .from('pipeline_projects')
        .select('submission_date, award_date')
        .eq('pipeline_type', 'opportunity')
        .eq('stage_id', 'opp_award')
        .not('submission_date', 'is', null)
        .not('award_date', 'is', null);

      if (error) throw error;

      if (data.length === 0) {
        return {
          averageDays: 0,
          trend: 'stable',
          trendValue: 0,
          trendLabel: 'No data available',
        };
      }

      // Calculate average days from submission to award
      const durations = data.map(project => {
        const submissionDate = new Date(project.submission_date);
        const awardDate = new Date(project.award_date);
        const diffMs = awardDate.getTime() - submissionDate.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      });

      const averageDays = durations.reduce((sum, days) => sum + days, 0) / durations.length;

      console.log('✅ Pipeline velocity calculated:', averageDays, 'days');

      return {
        averageDays: Math.round(averageDays),
        trend: 'stable',
        trendValue: 0,
        trendLabel: 'Based on awarded projects',
      };
    } catch (error) {
      console.error('❌ Error calculating pipeline velocity:', error);
      throw error;
    }
  }

  // Calculate capacity utilization
  async calculateCapacityUtilization(): Promise<CapacityUtilization> {
    try {
      console.log('🔍 Calculating capacity utilization...');

      const totalCapacity = 30000000; // $30M

      // Get awarded projects value
      const { data: awardedProjects, error: awardedError } = await supabase
        .from('pipeline_projects')
        .select('awarded_amount, value')
        .eq('pipeline_type', 'opportunity')
        .eq('stage_id', 'opp_award');

      if (awardedError) throw awardedError;

      const currentValue = awardedProjects.reduce((sum, p) => sum + (p.awarded_amount || p.value || 0), 0);
      const currentUtilization = (currentValue / totalCapacity) * 100;

      // Get bidding projects value for potential utilization
      const { data: biddingProjects, error: biddingError } = await supabase
        .from('pipeline_projects')
        .select('value')
        .eq('pipeline_type', 'opportunity')
        .eq('stage_id', 'opp_proposal');

      if (biddingError) throw biddingError;

      const potentialValue = biddingProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      const potentialUtilization = ((currentValue + potentialValue) / totalCapacity) * 100;

      const remainingCapacity = totalCapacity - currentValue;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (currentUtilization >= 100) status = 'critical';
      else if (currentUtilization >= 80) status = 'warning';

      console.log('✅ Capacity utilization calculated:', currentUtilization.toFixed(1), '%');

      return {
        currentUtilization: Math.round(currentUtilization),
        currentValue,
        totalCapacity,
        remainingCapacity,
        utilizationPercentage: currentUtilization,
        potentialUtilization: Math.round(potentialUtilization),
        potentialValue: currentValue + potentialValue,
        status,
      };
    } catch (error) {
      console.error('❌ Error calculating capacity utilization:', error);
      throw error;
    }
  }

  // Fetch annual target data
  async fetchAnnualTarget(): Promise<AnnualTarget> {
    try {
      console.log('🔍 Fetching annual target data...');

      const { data: targetData, error: targetError } = await supabase
        .from('annual_targets')
        .select('*')
        .eq('year', 2026)
        .single();

      if (targetError) throw targetError;

      const targetAmount = targetData.target_amount;

      // Get awarded projects YTD
      const { data: awardedProjects, error: awardedError } = await supabase
        .from('pipeline_projects')
        .select('awarded_amount, value')
        .eq('pipeline_type', 'opportunity')
        .eq('stage_id', 'opp_award');

      if (awardedError) throw awardedError;

      const awardedYTD = awardedProjects.reduce((sum, p) => sum + (p.awarded_amount || p.value || 0), 0);
      const remainingToTarget = targetAmount - awardedYTD;
      const percentageComplete = (awardedYTD / targetAmount) * 100;

      // Calculate average project value
      const avgProjectValue = awardedProjects.length > 0 
        ? awardedYTD / awardedProjects.length 
        : 20000000; // default $20M

      const projectsNeeded = Math.ceil(remainingToTarget / avgProjectValue);

      // Calculate run rate (assuming current month)
      const currentMonth = new Date().getMonth() + 1;
      const currentRunRate = awardedYTD / currentMonth;
      const projectedYearEnd = currentRunRate * 12;

      let onTrackStatus: 'ahead' | 'on_track' | 'behind' = 'on_track';
      if (projectedYearEnd >= targetAmount * 1.1) onTrackStatus = 'ahead';
      else if (projectedYearEnd < targetAmount * 0.9) onTrackStatus = 'behind';

      console.log('✅ Annual target data fetched');

      return {
        year: 2026,
        targetAmount,
        awardedYTD,
        remainingToTarget,
        percentageComplete,
        projectedYearEnd,
        onTrackStatus,
        projectsNeeded,
        currentRunRate,
      };
    } catch (error) {
      console.error('❌ Error fetching annual target:', error);
      throw error;
    }
  }

  // Fetch bidding analytics
  async fetchBiddingAnalytics(): Promise<BiddingAnalytics> {
    try {
      console.log('🔍 Fetching bidding analytics...');

      const { data: biddingProjects, error } = await supabase
        .from('pipeline_projects')
        .select('value, capacity_percentage')
        .eq('pipeline_type', 'opportunity')
        .eq('stage_id', 'opp_proposal');

      if (error) throw error;

      const totalProjects = biddingProjects.length;
      const totalValue = biddingProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      const capacityIfAllWon = biddingProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      const capacityPercentage = (capacityIfAllWon / 30000000) * 100;

      const velocity = await this.calculatePipelineVelocity();

      console.log('✅ Bidding analytics fetched');

      return {
        totalProjects,
        totalValue,
        averagePipelineVelocity: velocity.averageDays,
        capacityIfAllWon,
        capacityPercentage,
      };
    } catch (error) {
      console.error('❌ Error fetching bidding analytics:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();