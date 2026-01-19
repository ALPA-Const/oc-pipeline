# ProjectList.tsx, AnalyticsPanel.tsx, AlertsPanel.tsx

## ProjectList.tsx - Left Column

import React from 'react';  
import { ChevronRight, AlertTriangle } from 'lucide-react';  
  
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
  
interface ProjectListProps {  
projects: Project\[\];  
}  
  
export default function ProjectList({ projects }: ProjectListProps) {  
const statusColors = {  
planning: 'bg-blue-900/30 text-blue-400 border-blue-700',  
active: 'bg-green-900/30 text-green-400 border-green-700',  
completed: 'bg-gray-900/30 text-gray-400 border-gray-700',  
'on-hold': 'bg-yellow-900/30 text-yellow-400 border-yellow-700',  
};  
  
return (  
<div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">  
{/\* Header \*/}  
<div className="p-6 border-b border-slate-700">  
<h3 className="text-lg font-semibold text-white">My Projects</h3>  
<p className="text-xs text-slate-400 mt-1">{projects.length} active projects</p>  
</div>  
  
{/\* Project List \*/}  
<div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">  
{projects.slice(0, 5).map((project) => (  
<div  
key={project.id}  
className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer group"  
\>  
{/\* Project Header \*/}  
<div className="flex items-start justify-between mb-2">  
<div className="flex-1 min-w-0">  
<h4 className="font-semibold text-white text-sm truncate group-hover:text-blue-400 transition-colors">  
{project.name}  
</h4>  
<p className="text-xs text-slate-400 mt-1">{project.location}</p>  
</div>  
<ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />  
</div>  
  
{/\* Progress Bar \*/}  
<div className="mb-3">  
<div className="flex items-center justify-between mb-1">  
<span className="text-xs font-medium text-slate-300">${(project.value / 1000000).toFixed(1)}M</span>  
<span className="text-xs text-slate-400">{project.progress}%</span>  
</div>  
<div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">  
<div  
className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"  
style={{ width: \`${project.progress}%\` }}  
/>  
</div>  
</div>  
  
{/\* Status & Risks \*/}  
<div className="flex items-center justify-between gap-2">  
<span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColors\[project.status\]}\`}>  
{project.status.charAt(0).toUpperCase() + project.status.slice(1)}  
</span>  
{project.risks > 0 && (  
<div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-900/30 border border-red-700 text-red-400">  
<AlertTriangle className="w-3 h-3" />  
<span className="text-xs font-semibold">{project.risks}</span>  
</div>  
)}  
</div>  
</div>  
))}  
</div>  
  
{/\* Footer \*/}  
<div className="p-4 border-t border-slate-700 text-center">  
<button className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">  
View all {projects.length} projects →  
</button>  
</div>  
</div>  
);  
}

## AnalyticsPanel.tsx - Center Column

import React from 'react';  
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';  
  
interface AnalyticsPanelProps {  
metrics: any;  
}  
  
export default function AnalyticsPanel({ metrics }: AnalyticsPanelProps) {  
// Sample data - replace with real data from API  
const budgetTrendData = \[  
{ month: 'Jan', actual: 2400, forecast: 2400, budget: 2400 },  
{ month: 'Feb', actual: 2210, forecast: 2290, budget: 2400 },  
{ month: 'Mar', actual: 2290, forecast: 2000, budget: 2400 },  
{ month: 'Apr', actual: 2000, forecast: 2181, budget: 2400 },  
{ month: 'May', actual: 2181, forecast: 2500, budget: 2400 },  
{ month: 'Jun', actual: 2500, forecast: 2100, budget: 2400 },  
\];  
  
const scheduleData = \[  
{ phase: 'Design', completed: 100 },  
{ phase: 'Procurement', completed: 75 },  
{ phase: 'Construction', completed: 45 },  
{ phase: 'Testing', completed: 20 },  
{ phase: 'Closeout', completed: 0 },  
\];  
  
return (  
<div className="space-y-6">  
{/\* Budget Trend \*/}  
<div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">  
<h3 className="text-lg font-semibold text-white mb-4">Budget Trend</h3>  
<ResponsiveContainer width="100%" height={200}>  
<LineChart data={budgetTrendData}>  
<CartesianGrid strokeDasharray="3 3" stroke="#334155" />  
<XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />  
<YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />  
<Tooltip  
contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}  
labelStyle={{ color: '#e2e8f0' }}  
/>  
<Line type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={2} dot={false} />  
<Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={false} />  
<Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />  
</LineChart>  
</ResponsiveContainer>  
<div className="flex items-center justify-center gap-6 mt-4 text-xs">  
<div className="flex items-center gap-2">  
<div className="w-3 h-3 rounded-full bg-blue-500" />  
<span className="text-slate-300">Budget</span>  
</div>  
<div className="flex items-center gap-2">  
<div className="w-3 h-3 rounded-full bg-green-500" />  
<span className="text-slate-300">Actual</span>  
</div>  
<div className="flex items-center gap-2">  
<div className="w-3 h-3 rounded-full bg-amber-500" />  
<span className="text-slate-300">Forecast</span>  
</div>  
</div>  
</div>  
  
{/\* Schedule Health \*/}  
<div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">  
<h3 className="text-lg font-semibold text-white mb-4">Schedule Health</h3>  
<ResponsiveContainer width="100%" height={180}>  
<BarChart data={scheduleData}>  
<CartesianGrid strokeDasharray="3 3" stroke="#334155" />  
<XAxis dataKey="phase" stroke="#94a3b8" style={{ fontSize: '12px' }} />  
<YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />  
<Tooltip  
contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}  
labelStyle={{ color: '#e2e8f0' }}  
/>  
<Bar dataKey="completed" fill="#06b6d4" radius={\[8, 8, 0, 0\]} />  
</BarChart>  
</ResponsiveContainer>  
</div>  
</div>  
);  
}

## AlertsPanel.tsx - Right Column (Top)

import React from 'react';  
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';  
  
interface Alert {  
id: string;  
title: string;  
message: string;  
severity: 'critical' | 'warning' | 'info' | 'success';  
timestamp: string;  
read: boolean;  
actionUrl?: string;  
}  
  
interface AlertsPanelProps {  
alerts: Alert\[\];  
}  
  
export default function AlertsPanel({ alerts }: AlertsPanelProps) {  
const severityIcons = {  
critical: <AlertCircle className="w-5 h-5 text-red-400" />,  
warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,  
info: <Info className="w-5 h-5 text-blue-400" />,  
success: <CheckCircle className="w-5 h-5 text-green-400" />,  
};  
  
const severityColors = {  
critical: 'bg-red-900/20 border-red-700/50',  
warning: 'bg-yellow-900/20 border-yellow-700/50',  
info: 'bg-blue-900/20 border-blue-700/50',  
success: 'bg-green-900/20 border-green-700/50',  
};  
  
return (  
<div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">  
{/\* Header \*/}  
<div className="p-6 border-b border-slate-700">  
<h3 className="text-lg font-semibold text-white">Alerts & Notifications</h3>  
<p className="text-xs text-slate-400 mt-1">{alerts.filter(a => !a.read).length} unread</p>  
</div>  
  
{/\* Alerts List \*/}  
<div className="divide-y divide-slate-700 max-h-80 overflow-y-auto">  
{alerts.slice(0, 6).map((alert) => (  
<div  
key={alert.id}  
className={\`p-4 hover:bg-slate-700/30 transition-colors cursor-pointer border-l-4 ${  
severityColors\[alert.severity\]  
}\`}  
\>  
<div className="flex items-start gap-3">  
{severityIcons\[alert.severity\]}  
<div className="flex-1 min-w-0">  
<p className="font-semibold text-white text-sm">{alert.title}</p>  
<p className="text-xs text-slate-400 mt-1">{alert.message}</p>  
<p className="text-xs text-slate-500 mt-2">{alert.timestamp}</p>  
</div>  
{!alert.read && (  
<div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />  
)}  
</div>  
</div>  
))}  
</div>  
  
{/\* Footer \*/}  
<div className="p-4 border-t border-slate-700 text-center">  
<button className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">  
View all alerts →  
</button>  
</div>  
</div>  
);  
}