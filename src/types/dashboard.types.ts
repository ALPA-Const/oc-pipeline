export interface DashboardKPI {
  label: string;
  value: number;
  displayValue: string;
  change?: number;
  changeLabel?: string;
  icon?: string;
  color?: string;
}

export interface BiddingProject {
  id: string;
  agency: string;
  setAside: string;
  bidTitle: string;
  webLink: string;
  solicitationNumber: string;
  siteVisitDateTime: string;
  bidDueDateTime: string;
  rfiDueDateTime: string;
  magnitude: number;
  naicsCode: string;
  periodOfPerformance: string;
  projectCity: string;
  projectState: string;
  projectLatitude: number;
  projectLongitude: number;
  capacityPercentage: number;
  daysUntilDue: number;
  hoursUntilDue: number;
  urgencyLevel: 'urgent' | 'moderate' | 'plenty';
  urgencyColor: string;
}

export interface CountdownTimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  displayText: string;
  urgencyLevel: 'urgent' | 'moderate' | 'plenty';
  color: string;
}

export interface PipelineVelocity {
  averageDays: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  trendLabel: string;
}

export interface CapacityUtilization {
  currentUtilization: number;
  currentValue: number;
  totalCapacity: number;
  remainingCapacity: number;
  utilizationPercentage: number;
  potentialUtilization?: number;
  potentialValue?: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface GeographicLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  value: number;
  status: string;
  urgency?: 'urgent' | 'moderate' | 'plenty';
  color: string;
}

export interface AnnualTarget {
  year: number;
  targetAmount: number;
  awardedYTD: number;
  remainingToTarget: number;
  percentageComplete: number;
  projectedYearEnd: number;
  onTrackStatus: 'ahead' | 'on_track' | 'behind';
  projectsNeeded: number;
  currentRunRate: number;
}

export interface BiddingAnalytics {
  totalProjects: number;
  totalValue: number;
  averagePipelineVelocity: number;
  capacityIfAllWon: number;
  capacityPercentage: number;
}