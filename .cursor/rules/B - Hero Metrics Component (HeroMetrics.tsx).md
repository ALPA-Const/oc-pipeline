# HeroMetrics.tsx - KPI Cards

import React from 'react';  
import { formatCurrency, formatPercent, getTrendIcon } from '@/lib/formatting';  
  
interface HeroMetricsProps {  
metrics: {  
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
};  
}  
  
export default function HeroMetrics({ metrics }: HeroMetricsProps) {  
const kpis = \[  
{  
label: 'Active Projects',  
value: metrics.activeProjects,  
trend: metrics.trends.activeProjects,  
icon: '📊',  
color: 'from-blue-600 to-blue-400',  
format: (v: number) => v.toString(),  
},  
{  
label: 'Pipeline Value',  
value: metrics.pipelineValue,  
trend: metrics.trends.pipelineValue,  
icon: '💰',  
color: 'from-green-600 to-green-400',  
format: (v: number) => formatCurrency(v),  
},  
{  
label: 'Budget at Risk',  
value: metrics.budgetAtRisk,  
trend: metrics.trends.budgetAtRisk,  
icon: '⚠️',  
color: 'from-red-600 to-red-400',  
format: (v: number) => formatCurrency(v),  
},  
{  
label: 'Win Rate',  
value: metrics.winRate,  
trend: metrics.trends.winRate,  
icon: '🎯',  
color: 'from-purple-600 to-purple-400',  
format: (v: number) => formatPercent(v),  
},  
{  
label: 'CUI Docs Secured',  
value: metrics.cuiDocumentsSecured,  
trend: 0,  
icon: '🔒',  
color: 'from-emerald-600 to-emerald-400',  
format: (v: number) => v.toString(),  
},  
\];  
  
return (  
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">  
{kpis.map((kpi, idx) => (  
<MetricCard key={idx} kpi={kpi} />  
))}  
</div>  
);  
}  
  
function MetricCard({ kpi }: { kpi: any }) {  
const isPositive = kpi.trend >= 0;  
const isRiskMetric = kpi.label.includes('Risk') || kpi.label.includes('at Risk');  
  
return (  
<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">  
{/\* Gradient Background \*/}  
<div className={\`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300\`} />  
  
{/\* Content \*/}  
<div className="relative p-6">  
{/\* Header \*/}  
<div className="flex items-start justify-between mb-4">  
<div className="text-3xl">{kpi.icon}</div>  
<TrendBadge trend={kpi.trend} isRiskMetric={isRiskMetric} />  
</div>  
  
{/\* Label \*/}  
<p className="text-sm font-medium text-slate-400 mb-2">{kpi.label}</p>  
  
{/\* Value \*/}  
<div className="flex items-baseline gap-2">  
<p className="text-2xl font-bold text-white">{kpi.format(kpi.value)}</p>  
</div>  
  
{/\* Trend Detail \*/}  
{kpi.trend !== 0 && (  
<div className="mt-3 pt-3 border-t border-slate-700">  
<p className={\`text-xs font-medium ${isPositive && !isRiskMetric ? 'text-green-400' : isPositive && isRiskMetric ? 'text-red-400' : 'text-red-400'}\`}>  
{isPositive ? '↑' : '↓'} {Math.abs(kpi.trend)}% from last month  
</p>  
</div>  
)}  
</div>  
  
{/\* Bottom Accent \*/}  
<div className={\`h-1 bg-gradient-to-r ${kpi.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300\`} />  
</div>  
);  
}  
  
function TrendBadge({ trend, isRiskMetric }: { trend: number; isRiskMetric: boolean }) {  
if (trend === 0) return null;  
  
const isPositive = trend >= 0;  
const shouldBeGood = !isRiskMetric;  
const isGood = isPositive === shouldBeGood;  
  
return (  
<div className={\`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${  
isGood  
? 'bg-green-900/30 text-green-400 border border-green-700/50'  
: 'bg-red-900/30 text-red-400 border border-red-700/50'  
}\`}>  
{isPositive ? '↑' : '↓'}  
<span>{Math.abs(trend)}%</span>  
</div>  
);  
}

## Supporting Utilities

// lib/formatting.ts  
export function formatCurrency(value: number): string {  
return new Intl.NumberFormat('en-US', {  
style: 'currency',  
currency: 'USD',  
minimumFractionDigits: 0,  
maximumFractionDigits: 0,  
}).format(value);  
}  
  
export function formatPercent(value: number): string {  
return \`${value.toFixed(1)}%\`;  
}  
  
export function formatNumber(value: number): string {  
return new Intl.NumberFormat('en-US').format(value);  
}  
  
export function getTrendIcon(trend: number): string {  
if (trend > 0) return '📈';  
if (trend < 0) return '📉';  
return '➡️';  
}