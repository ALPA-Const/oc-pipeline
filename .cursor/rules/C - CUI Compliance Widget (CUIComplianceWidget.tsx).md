# CUIComplianceWidget.tsx - CMMC Level 2 Compliance

import React, { useState } from 'react';  
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';  
  
interface CUIStatus {  
totalDocuments: number;  
securedDocuments: number;  
pendingClassification: number;  
complianceScore: number;  
lastAudit: string;  
nextAudit: string;  
}  
  
interface CUIComplianceWidgetProps {  
status: CUIStatus;  
}  
  
export default function CUIComplianceWidget({ status }: CUIComplianceWidgetProps) {  
const \[expanded, setExpanded\] = useState(false);  
  
const securityPercentage = (status.securedDocuments / status.totalDocuments) \* 100;  
const isCompliant = status.complianceScore >= 90;  
  
return (  
<div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden hover:border-slate-600 transition-all duration-300">  
{/\* Header \*/}  
<div className="p-6 cursor-pointer hover:bg-slate-700/30 transition-colors" onClick={() => setExpanded(!expanded)}>  
<div className="flex items-start justify-between mb-4">  
<div className="flex items-center gap-3">  
<div className="text-3xl">🔒</div>  
<div>  
<h3 className="font-semibold text-white">CMMC Level 2 Status</h3>  
<p className="text-xs text-slate-400 mt-1">Controlled Unclassified Information</p>  
</div>  
</div>  
<div className={\`flex items-center gap-2 px-3 py-1 rounded-full ${  
isCompliant  
? 'bg-green-900/30 border border-green-700'  
: 'bg-yellow-900/30 border border-yellow-700'  
}\`}>  
{isCompliant ? (  
<>  
<CheckCircle className="w-4 h-4 text-green-400" />  
<span className="text-xs font-semibold text-green-400">Compliant</span>  
</>  
) : (  
<>  
<AlertCircle className="w-4 h-4 text-yellow-400" />  
<span className="text-xs font-semibold text-yellow-400">Review Needed</span>  
</>  
)}  
</div>  
</div>  
  
{/\* Compliance Score \*/}  
<div className="mb-4">  
<div className="flex items-center justify-between mb-2">  
<span className="text-sm font-medium text-slate-300">Compliance Score</span>  
<span className="text-lg font-bold text-white">{status.complianceScore}%</span>  
</div>  
<div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">  
<div  
className={\`h-full transition-all duration-500 ${  
status.complianceScore >= 90  
? 'bg-gradient-to-r from-green-600 to-green-400'  
: status.complianceScore >= 70  
? 'bg-gradient-to-r from-yellow-600 to-yellow-400'  
: 'bg-gradient-to-r from-red-600 to-red-400'  
}\`}  
style={{ width: \`${status.complianceScore}%\` }}  
/>  
</div>  
</div>  
  
{/\* Quick Stats \*/}  
<div className="grid grid-cols-3 gap-3">  
<StatBox  
label="Secured"  
value={status.securedDocuments}  
total={status.totalDocuments}  
color="green"  
/>  
<StatBox  
label="Pending"  
value={status.pendingClassification}  
total={status.totalDocuments}  
color="yellow"  
/>  
<StatBox  
label="Total"  
value={status.totalDocuments}  
total={status.totalDocuments}  
color="blue"  
/>  
</div>  
</div>  
  
{/\* Expanded Content \*/}  
{expanded && (  
<div className="border-t border-slate-700 p-6 space-y-4 bg-slate-900/50">  
{/\* CUI Detection Rules \*/}  
<div>  
<h4 className="text-sm font-semibold text-white mb-3">CUI Detection Rules</h4>  
<div className="space-y-2">  
<CUIRule  
marker="FOUO"  
description="For Official Use Only"  
status="active"  
/>  
<CUIRule  
marker="Distribution D"  
description="DoD/Contractors only"  
status="active"  
/>  
<CUIRule  
marker="DoDI 5200.48"  
description="Dissemination restricted"  
status="active"  
/>  
<CUIRule  
marker="DFARS 252.204-7012"  
description="Safeguarding covered defense info"  
status="active"  
/>  
<CUIRule  
marker="Do Not Post Publicly"  
description="Restricted distribution"  
status="active"  
/>  
<CUIRule  
marker="DoD SAFE"  
description="Transit via approved channels only"  
status="active"  
/>  
</div>  
</div>  
  
{/\* Storage Requirements \*/}  
<div className="pt-4 border-t border-slate-700">  
<h4 className="text-sm font-semibold text-white mb-3">Storage Requirements</h4>  
<div className="space-y-2 text-xs text-slate-300">  
<RequirementItem  
icon="✅"  
text="Store on company Google Drive only"  
/>  
<RequirementItem  
icon="✅"  
text="Use 'Classified Information Only' folder"  
/>  
<RequirementItem  
icon="✅"  
text="No personal desktop storage"  
/>  
<RequirementItem  
icon="✅"  
text="No public posting (BuildersConnect, PlanHub, ISqFt)"  
/>  
<RequirementItem  
icon="✅"  
text="Watermark all CUI documents"  
/>  
<RequirementItem  
icon="✅"  
text="Restrict external sharing"  
/>  
</div>  
</div>  
  
{/\* Audit Information \*/}  
<div className="pt-4 border-t border-slate-700">  
<h4 className="text-sm font-semibold text-white mb-3">Audit Schedule</h4>  
<div className="space-y-2">  
<AuditInfo  
label="Last Audit"  
date={status.lastAudit}  
icon="✅"  
/>  
<AuditInfo  
label="Next Audit"  
date={status.nextAudit}  
icon="📅"  
/>  
</div>  
</div>  
  
{/\* Action Buttons \*/}  
<div className="pt-4 border-t border-slate-700 flex gap-2">  
<button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">  
View Full Report  
</button>  
<button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors">  
Download Audit  
</button>  
</div>  
</div>  
)}  
</div>  
);  
}  
  
function StatBox({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {  
const percentage = (value / total) \* 100;  
  
const colorClasses = {  
green: 'bg-green-900/30 border-green-700 text-green-400',  
yellow: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',  
blue: 'bg-blue-900/30 border-blue-700 text-blue-400',  
};  
  
return (  
<div className={\`p-3 rounded border ${colorClasses\[color as keyof typeof colorClasses\]}\`}>  
<p className="text-xs font-medium text-slate-300">{label}</p>  
<p className="text-lg font-bold mt-1">{value}</p>  
<p className="text-xs text-slate-400 mt-1">{percentage.toFixed(0)}% of total</p>  
</div>  
);  
}  
  
function CUIRule({ marker, description, status }: { marker: string; description: string; status: string }) {  
return (  
<div className="flex items-start gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">  
<div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />  
<div className="flex-1 min-w-0">  
<p className="text-xs font-semibold text-white">{marker}</p>  
<p className="text-xs text-slate-400">{description}</p>  
</div>  
</div>  
);  
}  
  
function RequirementItem({ icon, text }: { icon: string; text: string }) {  
return (  
<div className="flex items-start gap-2">  
<span className="flex-shrink-0">{icon}</span>  
<span>{text}</span>  
</div>  
);  
}  
  
function AuditInfo({ label, date, icon }: { label: string; date: string; icon: string }) {  
return (  
<div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700/50">  
<div className="flex items-center gap-2">  
<span>{icon}</span>  
<div>  
<p className="text-xs font-medium text-slate-300">{label}</p>  
<p className="text-xs text-slate-400">{date}</p>  
</div>  
</div>  
</div>  
);  
}

## CUI Detection Service (Backend)

// services/cui-detector.ts  
export interface CUIDetectionResult {  
isCUI: boolean;  
markers: string\[\];  
confidence: number;  
recommendations: string\[\];  
}  
  
const CUI\_MARKERS = {  
explicit: \[  
'FOUO',  
'For Official Use Only',  
'CUI',  
'Controlled Unclassified Information',  
'Distribution D',  
'DoD/Contractors only',  
'DoDI 5200.48',  
'DoD SAFE',  
'Do Not Post Publicly',  
'DFARS 252.204-7012',  
'NIST 800-171',  
\],  
implicit: \[  
'building layout',  
'facility drawing',  
'security system',  
'classified',  
'restricted',  
'confidential',  
'sensitive',  
\],  
};  
  
export async function detectCUI(documentText: string): Promise<CUIDetectionResult> {  
const text = documentText.toLowerCase();  
const foundMarkers: string\[\] = \[\];  
let confidence = 0;  
  
// Check explicit markers  
for (const marker of CUI\_MARKERS.explicit) {  
if (text.includes(marker.toLowerCase())) {  
foundMarkers.push(marker);  
confidence += 0.3;  
}  
}  
  
// Check implicit markers  
for (const marker of CUI\_MARKERS.implicit) {  
if (text.includes(marker.toLowerCase())) {  
foundMarkers.push(marker);  
confidence += 0.15;  
}  
}  
  
const isCUI = confidence > 0.3;  
  
return {  
isCUI,  
markers: foundMarkers,  
confidence: Math.min(confidence, 1),  
recommendations: isCUI ? \[  
'Store in "Classified Information Only" folder',  
'Restrict external sharing',  
'Add CUI watermark',  
'Log all access attempts',  
\] : \[\],  
};  
}  
  
export async function validateCUIStorage(document: any): Promise<boolean> {  
// Validate that CUI documents are stored correctly  
return (  
document.folder\_path?.includes('Classified Information Only') &&  
document.external\_sharing === false &&  
document.watermarked === true  
);  
}