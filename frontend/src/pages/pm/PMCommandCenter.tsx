import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gauge,
    Activity,
    FileText,
    AlertTriangle,
    ArrowRight,
    TrendingUp,
    Clock,
    DollarSign,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { FEATURE_FLAGS } from '@/config/featureFlags';

export default function PMCommandCenter() {
    const navigate = useNavigate();

    // Feature Flag Check
    if (!FEATURE_FLAGS.PM_COMMAND_CENTER) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold">Feature Disabled</h2>
                    <p className="text-gray-500">The PM Command Center is currently being maintained.</p>
                </div>
            </div>
        );
    }

    // Mock Active Project
    const activeProject = {
        name: "The Lakeside Commercial Towers",
        id: "P-2024-042",
        popDays: 730,
        status: "In Progress",
        progress: 35
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Project Context / Header Strip */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Gauge className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{activeProject.name}</h1>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="font-mono">ID: {activeProject.id}</span>
                            <span>•</span>
                            <span>POP: {activeProject.popDays} days</span>
                            <span>•</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {activeProject.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-8 pr-4">
                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Overall Progress</div>
                        <div className="text-lg font-bold text-purple-700">{activeProject.progress}%</div>
                    </div>
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-600 transition-all duration-1000"
                            style={{ width: `${activeProject.progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Project Health Card */}
                <Card className="overflow-hidden border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold">Project Health</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Schedule Variance</span>
                                <span className="text-green-600 font-medium">+2 Days</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Budget Performance (CPI)</span>
                                <span className="text-blue-600 font-medium">1.02</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Quality Index</span>
                                <span className="text-green-600 font-medium">94/100</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 flex flex-col items-stretch gap-2">
                        <Button variant="ghost" size="sm" className="justify-between text-xs w-full" onClick={() => navigate('/schedule')}>
                            View Detailed Schedule <ArrowRight className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-between text-xs w-full" onClick={() => navigate('/financials')}>
                            View Budget Analysis <ArrowRight className="h-3 w-3" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Obligations Card */}
                <Card className="overflow-hidden border-t-4 border-t-purple-500 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold">Critical Obligations</CardTitle>
                        <Clock className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Pending Submittals</span>
                                <span className="text-purple-600 font-bold">14</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Overdue RFIs</span>
                                <span className="text-red-600 font-bold">3</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Compliance Documents</span>
                                <span className="text-orange-600 font-medium">4 Expiring Soon</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 flex flex-col items-stretch gap-2">
                        <Button variant="ghost" size="sm" className="justify-between text-xs w-full" onClick={() => navigate('/contract-administration')}>
                            Open Document Control <ArrowRight className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-between text-xs w-full" onClick={() => navigate('/preconstruction')}>
                            View RFI Tracker <ArrowRight className="h-3 w-3" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Impacts Card */}
                <Card className="overflow-hidden border-t-4 border-t-orange-500 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold">Active Impacts</CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Change Order Exposure</span>
                                <span className="text-orange-600 font-bold">$245,600</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Critical Path Risks</span>
                                <span className="text-red-600 font-medium">2 High Priority</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Safety Incidents</span>
                                <span className="text-green-600 font-medium">0 Last 30 Days</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 flex flex-col items-stretch gap-2">
                        <Button variant="ghost" size="sm" className="justify-between text-xs w-full" onClick={() => navigate('/financials')}>
                            Open Change Management <ArrowRight className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-between text-xs w-full" onClick={() => navigate('/safety')}>
                            View Risk Register <ArrowRight className="h-3 w-3" />
                        </Button>
                    </CardFooter>
                </Card>

            </div>

            {/* Secondary Row / Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2 mb-4">
                        <DollarSign className="w-4 h-4" /> Financial Run Rate
                    </h3>
                    <div className="h-48 flex items-center justify-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-400">Financial Burn Graph Placeholder</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2 mb-4">
                        <ShieldCheck className="w-4 h-4" /> Safety & Compliance Status
                    </h3>
                    <div className="h-48 flex items-center justify-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-400">Compliance Snapshot Placeholder</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
