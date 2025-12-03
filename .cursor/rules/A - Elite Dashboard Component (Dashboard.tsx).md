# OC Pipeline - Elite Dashboard Component

## Dashboard.tsx - Main Container

import React, { useEffect, useState } from 'react';  
import { useAuth } from '@/hooks/useAuth';  
import { useRealtime } from '@/hooks/useRealtime';  
import HeroMetrics from './components/HeroMetrics';  
import ProjectList from './components/ProjectList';  
import AnalyticsPanel from './components/AnalyticsPanel';  
import AlertsPanel from './components/AlertsPanel';  
import CUIComplianceWidget from './components/CUIComplianceWidget';  
import { cn } from '@/lib/utils';  
  
interface DashboardState {  
metrics: HeroMetrics;  
projects: Project\[\];  
alerts: Alert\[\];  
cuiStatus: CUIStatus;  
loading: boolean;  
error: string | null;  
}  
  
export default function Dashboard() {  
const { user } = useAuth();  
const { subscribe } = useRealtime();  
const \[state, setState\] = useState<DashboardState>({  
metrics: null,  
projects: \[\],  
alerts: \[\],  
cuiStatus: null,  
loading: true,  
error: null,  
});  
  
// Real-time subscriptions  
useEffect(() => {  
const unsubscribe = subscribe('dashboard\_metrics', (data) => {  
setState(prev => ({ ...prev, metrics: data }));  
});  
return unsubscribe;  
}, \[subscribe\]);  
  
// Load initial data  
useEffect(() => {  
const loadDashboard = async () => {  
try {  
const \[metrics, projects, alerts, cuiStatus\] = await Promise.all(\[  
fetch('/api/v1/dashboard/metrics').then(r => r.json()),  
fetch('/api/v1/dashboard/projects').then(r => r.json()),  
fetch('/api/v1/dashboard/alerts').then(r => r.json()),  
fetch('/api/v1/dashboard/cui-status').then(r => r.json()),  
\]);  
  
setState(prev => ({  
...prev,  
metrics,  
projects,  
alerts,  
cuiStatus,  
loading: false,  
}));  
} catch (error) {  
setState(prev => ({  
...prev,  
error: 'Failed to load dashboard',  
loading: false,  
}));  
}  
};  
  
loadDashboard();  
}, \[\]);  
  
if (state.loading) {  
return <DashboardSkeleton />;  
}  
  
return (  
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">  
{/\* Header \*/}  
<div className="sticky top-0 z-40 border-b border-slate-700 bg-slate-900/95 backdrop-blur supports-\[backdrop-filter\]:bg-slate-900/60">  
<div className="px-6 py-4 flex items-center justify-between">  
<div>  
<h1 className="text-2xl font-bold text-white">Dashboard</h1>  
<p className="text-sm text-slate-400">  
Welcome back, {user?.full\_name} • {user?.role}  
</p>  
</div>  
<div className="flex items-center gap-4">  
<AlertBell alerts={state.alerts} />  
<CMMCBadge status={state.cuiStatus} />  
<UserMenu user={user} />  
</div>  
</div>  
</div>  
  
{/\* Main Content \*/}  
<div className="p-6 space-y-6">  
{/\* Hero Metrics \*/}  
<HeroMetrics metrics={state.metrics} />  
  
{/\* 3-Column Layout \*/}  
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">  
{/\* Left Column: Projects \*/}  
<div className="lg:col-span-1">  
<ProjectList projects={state.projects} />  
</div>  
  
{/\* Center Column: Analytics \*/}  
<div className="lg:col-span-1">  
<AnalyticsPanel metrics={state.metrics} />  
</div>  
  
{/\* Right Column: Alerts & Compliance \*/}  
<div className="lg:col-span-1 space-y-6">  
<AlertsPanel alerts={state.alerts} />  
<CUIComplianceWidget status={state.cuiStatus} />  
</div>  
</div>  
</div>  
</div>  
);  
}  
  
function DashboardSkeleton() {  
return (  
<div className="min-h-screen bg-slate-900 animate-pulse">  
<div className="h-20 bg-slate-800 border-b border-slate-700" />  
<div className="p-6 space-y-6">  
<div className="grid grid-cols-5 gap-4">  
{\[...Array(5)\].map((\_, i) => (  
<div key={i} className="h-24 bg-slate-800 rounded-lg" />  
))}  
</div>  
<div className="grid grid-cols-3 gap-6">  
{\[...Array(3)\].map((\_, i) => (  
<div key={i} className="h-96 bg-slate-800 rounded-lg" />  
))}  
</div>  
</div>  
</div>  
);  
}  
  
function AlertBell({ alerts }: { alerts: Alert\[\] }) {  
const \[open, setOpen\] = useState(false);  
const unreadCount = alerts.filter(a => !a.read).length;  
  
return (  
<div className="relative">  
<button  
onClick={() => setOpen(!open)}  
className="relative p-2 text-slate-400 hover:text-white transition-colors"  
\>  
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">  
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />  
</svg>  
{unreadCount > 0 && (  
<span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">  
{unreadCount}  
</span>  
)}  
</button>  
  
{open && (  
<div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">  
<div className="p-4 border-b border-slate-700">  
<h3 className="font-semibold text-white">Alerts</h3>  
</div>  
<div className="max-h-96 overflow-y-auto">  
{alerts.slice(0, 5).map(alert => (  
<div key={alert.id} className="p-4 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors">  
<div className="flex items-start gap-3">  
<div className={\`w-2 h-2 rounded-full mt-1.5 ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}\`} />  
<div className="flex-1 min-w-0">  
<p className="text-sm font-medium text-white">{alert.title}</p>  
<p className="text-xs text-slate-400 mt-1">{alert.message}</p>  
<p className="text-xs text-slate-500 mt-2">{alert.timestamp}</p>  
</div>  
</div>  
</div>  
))}  
</div>  
</div>  
)}  
</div>  
);  
}  
  
function CMMCBadge({ status }: { status: CUIStatus }) {  
return (  
<div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700 rounded-full">  
<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />  
<span className="text-xs font-medium text-green-400">CMMC L2</span>  
</div>  
);  
}  
  
function UserMenu({ user }: { user: User }) {  
const \[open, setOpen\] = useState(false);  
  
return (  
<div className="relative">  
<button  
onClick={() => setOpen(!open)}  
className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg transition-colors"  
\>  
<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">  
<span className="text-xs font-bold text-white">  
{user?.full\_name?.split(' ').map(n => n\[0\]).join('')}  
</span>  
</div>  
<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">  
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />  
</svg>  
</button>  
  
{open && (  
<div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">  
<a href="/profile" className="block px-4 py-2 text-sm text-white hover:bg-slate-700">Profile</a>  
<a href="/settings" className="block px-4 py-2 text-sm text-white hover:bg-slate-700">Settings</a>  
<a href="/help" className="block px-4 py-2 text-sm text-white hover:bg-slate-700">Help</a>  
<button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700">Logout</button>  
</div>  
)}  
</div>  
);  
}

## Type Definitions

interface HeroMetrics {  
activeProjects: number;  
pipelineValue: number;  
budgetAtRisk: number;  
winRate: number;  
cuiDocumentsSecured: number;  
trends: {  
activeProjects: number;  
pipelineValue: number;  
budgetAtRisk: number;  
winRate: number;  
};  
}  
  
interface Project {  
id: string;  
name: string;  
location: string;  
value: number;  
progress: number;  
status: 'planning' | 'active' | 'completed' | 'on-hold';  
risks: number;  
lastUpdated: string;  
}  
  
interface Alert {  
id: string;  
title: string;  
message: string;  
severity: 'critical' | 'warning' | 'info';  
timestamp: string;  
read: boolean;  
actionUrl?: string;  
}  
  
interface CUIStatus {  
totalDocuments: number;  
securedDocuments: number;  
pendingClassification: number;  
complianceScore: number;  
lastAudit: string;  
nextAudit: string;  
}  
  
interface User {  
id: string;  
full\_name: string;  
email: string;  
role: string;  
avatar\_url?: string;  
}