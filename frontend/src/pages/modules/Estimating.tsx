/* ============================================================
   Estimating.tsx — New Estimates Module Dashboard
   ------------------------------------------------------------
   Based on O'Neill Contractors Estimates page PDF design:
   - Header with breadcrumb, search, view toggles, company name
   - Top cards: Recent Client Responses, Estimates Pending Approval, Won & Lost circles
   - Estimates by Status progress bar
   - Estimates Out for Bid table
   - Bid Responses table
   - Main estimates table
   ============================================================ */

import React, { useState, useMemo } from "react";
import {
  Search,
  LayoutGrid,
  Filter,
  Video,
  HelpCircle,
  Settings,
  Plus,
  Home,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* =========================
   Types
   ========================= */

type EstimateStatus = "Estimating" | "Pending Approval" | "Approved" | "Out for Bid" | "Won" | "Lost";

type Estimate = {
  id: string;
  estNumber: string;
  title: string;
  customer: string;
  projectManager: string;
  cost: number;
  total: number;
  profit: number;
  markupPercent: number;
  type: string;
  status: EstimateStatus;
  createdAt: string;
};

type BidResponse = {
  id: string;
  estimateNumber: string;
  title: string;
  vendor: string;
  responseDate: string;
  amount: number;
  status: "Pending" | "Accepted" | "Rejected";
};

/* =========================
   Sample Data
   ========================= */

const SAMPLE_ESTIMATES: Estimate[] = [
  {
    id: "1",
    estNumber: "EST-5",
    title: "Irwtyq4",
    customer: "Federal Client",
    projectManager: "Bill Asmar",
    cost: 125000,
    total: 156250,
    profit: 31250,
    markupPercent: 25,
    type: "Infrastructure",
    status: "Estimating",
    createdAt: "2024-12-20",
  },
  {
    id: "2",
    estNumber: "EST-2",
    title: "tyrtyrt",
    customer: "VA Medical",
    projectManager: "Bill Asmar",
    cost: 89000,
    total: 111250,
    profit: 22250,
    markupPercent: 25,
    type: "Infrastructure",
    status: "Estimating",
    createdAt: "2024-12-18",
  },
  {
    id: "3",
    estNumber: "EST-1",
    title: "rexl",
    customer: "DoD",
    projectManager: "Bill Asmar",
    cost: 245000,
    total: 306250,
    profit: 61250,
    markupPercent: 25,
    type: "Infrastructure",
    status: "Estimating",
    createdAt: "2024-12-15",
  },
  {
    id: "4",
    estNumber: "EST-6",
    title: "HVAC Renovation",
    customer: "GSA",
    projectManager: "Bill Asmar",
    cost: 450000,
    total: 562500,
    profit: 112500,
    markupPercent: 25,
    type: "MEP",
    status: "Pending Approval",
    createdAt: "2024-12-10",
  },
  {
    id: "5",
    estNumber: "EST-7",
    title: "Security Upgrade",
    customer: "DHS",
    projectManager: "Bill Asmar",
    cost: 320000,
    total: 400000,
    profit: 80000,
    markupPercent: 25,
    type: "Security",
    status: "Out for Bid",
    createdAt: "2024-12-05",
  },
  {
    id: "6",
    estNumber: "EST-8",
    title: "Lobby Renovation",
    customer: "Private Corp",
    projectManager: "Bill Asmar",
    cost: 180000,
    total: 225000,
    profit: 45000,
    markupPercent: 25,
    type: "Interiors",
    status: "Won",
    createdAt: "2024-11-28",
  },
  {
    id: "7",
    estNumber: "EST-9",
    title: "Parking Structure",
    customer: "City of Chicago",
    projectManager: "Bill Asmar",
    cost: 890000,
    total: 1112500,
    profit: 222500,
    markupPercent: 25,
    type: "Infrastructure",
    status: "Lost",
    createdAt: "2024-11-20",
  },
];

const SAMPLE_BID_RESPONSES: BidResponse[] = [
  {
    id: "1",
    estimateNumber: "EST-7",
    title: "Security Upgrade",
    vendor: "ABC Contractors",
    responseDate: "2024-12-22",
    amount: 385000,
    status: "Pending",
  },
  {
    id: "2",
    estimateNumber: "EST-7",
    title: "Security Upgrade",
    vendor: "XYZ Builders",
    responseDate: "2024-12-21",
    amount: 410000,
    status: "Pending",
  },
];

/* =========================
   Utility Functions
   ========================= */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: EstimateStatus): string {
  const colors: Record<EstimateStatus, string> = {
    Estimating: "bg-blue-100 text-blue-800",
    "Pending Approval": "bg-yellow-100 text-yellow-800",
    Approved: "bg-green-100 text-green-800",
    "Out for Bid": "bg-purple-100 text-purple-800",
    Won: "bg-emerald-100 text-emerald-800",
    Lost: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

/* =========================
   Circle Chart Component
   ========================= */

function CircleChart({
  value,
  total,
  label,
  color,
  size = 80,
}: {
  value: number;
  total: number;
  label: string;
  color: string;
  size?: number;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 40 40)"
        />
        {/* Center text */}
        <text
          x="40"
          y="45"
          textAnchor="middle"
          className="text-lg font-bold"
          fill="#1f2937"
        >
          {value}
        </text>
      </svg>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}

/* =========================
   Status Progress Bar
   ========================= */

function StatusProgressBar({ estimates }: { estimates: Estimate[] }) {
  const statusCounts = useMemo(() => {
    const counts: Record<EstimateStatus, number> = {
      Estimating: 0,
      "Pending Approval": 0,
      Approved: 0,
      "Out for Bid": 0,
      Won: 0,
      Lost: 0,
    };
    estimates.forEach((e) => {
      counts[e.status]++;
    });
    return counts;
  }, [estimates]);

  const total = estimates.length;
  const statusColors: Record<EstimateStatus, string> = {
    Estimating: "#3b82f6",
    "Pending Approval": "#f59e0b",
    Approved: "#10b981",
    "Out for Bid": "#8b5cf6",
    Won: "#059669",
    Lost: "#ef4444",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          Estimates by Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 mb-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            if (count === 0) return null;
            const width = (count / total) * 100;
            return (
              <div
                key={status}
                style={{
                  width: `${width}%`,
                  backgroundColor: statusColors[status as EstimateStatus],
                }}
                title={`${status}: ${count}`}
              />
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusColors[status as EstimateStatus] }}
              />
              <span className="text-xs text-gray-600">
                {status}: {count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================
   Header Component
   ========================= */

function EstimatesHeader({
  searchTerm,
  onSearchChange,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Breadcrumb + Search */}
        <div className="flex items-center gap-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Home className="w-4 h-4 text-gray-400" />
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="font-semibold text-gray-900">Estimates</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search for Estimates"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-64 h-9"
            />
          </div>

          {/* View Toggle Icons */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <LayoutGrid className="w-4 h-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Filter className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Center: Company Name */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="text-sm font-bold text-[#00205B] uppercase tracking-wide">
            O'Neill Contractors
          </span>
        </div>

        {/* Right: Icons + New Button */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Video className="w-4 h-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <HelpCircle className="w-4 h-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="w-4 h-4 text-gray-500" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 h-9">
            <Plus className="w-4 h-4 mr-2" />
            Estimate
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Top Cards Component
   ========================= */

function TopCards({ estimates }: { estimates: Estimate[] }) {
  const stats = useMemo(() => {
    const wonThisMonth = estimates.filter(
      (e) => e.status === "Won" && new Date(e.createdAt).getMonth() === new Date().getMonth()
    ).length;
    const wonLastMonth = estimates.filter(
      (e) => e.status === "Won" && new Date(e.createdAt).getMonth() === new Date().getMonth() - 1
    ).length;
    const lostThisMonth = estimates.filter(
      (e) => e.status === "Lost" && new Date(e.createdAt).getMonth() === new Date().getMonth()
    ).length;
    const lostLastMonth = estimates.filter(
      (e) => e.status === "Lost" && new Date(e.createdAt).getMonth() === new Date().getMonth() - 1
    ).length;
    const pendingApproval = estimates.filter((e) => e.status === "Pending Approval").length;
    const recentResponses = 3; // Mock data

    return {
      wonThisMonth,
      wonLastMonth,
      lostThisMonth,
      lostLastMonth,
      pendingApproval,
      recentResponses,
    };
  }, [estimates]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Recent Client Responses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Recent Client Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.recentResponses}</p>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimates Pending Approval */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Estimates Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingApproval}</p>
              <p className="text-xs text-gray-500">Requires action</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Won & Lost Estimates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Won & Lost Estimates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <CircleChart
                value={stats.wonLastMonth}
                total={5}
                label="Last Month"
                color="#10b981"
              />
            </div>
            <div className="text-center">
              <CircleChart
                value={stats.wonThisMonth}
                total={5}
                label="This Month"
                color="#059669"
              />
            </div>
            <div className="border-l border-gray-200 pl-4 text-center">
              <CircleChart
                value={stats.lostLastMonth}
                total={5}
                label="Last Month"
                color="#f87171"
              />
            </div>
            <div className="text-center">
              <CircleChart
                value={stats.lostThisMonth}
                total={5}
                label="This Month"
                color="#ef4444"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   Main Component
   ========================= */

export default function Estimating() {
  const [searchTerm, setSearchTerm] = useState("");
  const [estimates] = useState<Estimate[]>(SAMPLE_ESTIMATES);
  const [bidResponses] = useState<BidResponse[]>(SAMPLE_BID_RESPONSES);

  // Filter estimates based on search
  const filteredEstimates = useMemo(() => {
    if (!searchTerm) return estimates;
    const term = searchTerm.toLowerCase();
    return estimates.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.estNumber.toLowerCase().includes(term) ||
        e.customer.toLowerCase().includes(term) ||
        e.projectManager.toLowerCase().includes(term)
    );
  }, [estimates, searchTerm]);

  // Get estimates out for bid
  const estimatesOutForBid = estimates.filter((e) => e.status === "Out for Bid");

  return (
    <div className="min-h-screen bg-gray-50 -m-6">
      {/* Header */}
      <EstimatesHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Main Content */}
      <div className="p-6">
        {/* Top Cards */}
        <TopCards estimates={estimates} />

        {/* Status Progress Bar */}
        <div className="mb-6">
          <StatusProgressBar estimates={estimates} />
        </div>

        {/* Two Column Layout: Out for Bid & Responses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Estimates Out for Bid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-600" />
                Estimates Out for Bid
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EST. #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimatesOutForBid.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-gray-400">
                        No estimates out for bid
                      </TableCell>
                    </TableRow>
                  ) : (
                    estimatesOutForBid.map((est) => (
                      <TableRow key={est.id}>
                        <TableCell className="font-medium">{est.estNumber}</TableCell>
                        <TableCell>{est.title}</TableCell>
                        <TableCell>{est.customer}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(est.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bid Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Bid Responses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EST. #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bidResponses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-400">
                        No bid responses
                      </TableCell>
                    </TableRow>
                  ) : (
                    bidResponses.map((resp) => (
                      <TableRow key={resp.id}>
                        <TableCell className="font-medium">{resp.estimateNumber}</TableCell>
                        <TableCell>{resp.vendor}</TableCell>
                        <TableCell>{formatDate(resp.responseDate)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(resp.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              resp.status === "Accepted"
                                ? "bg-green-100 text-green-800"
                                : resp.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {resp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Main Estimates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">All Estimates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EST. #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>PM</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">MU %</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-400">
                      {searchTerm ? "No estimates match your search" : "No estimates found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEstimates.map((est) => (
                    <TableRow key={est.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-blue-600">{est.estNumber}</TableCell>
                      <TableCell>{est.title}</TableCell>
                      <TableCell>{est.customer}</TableCell>
                      <TableCell>{est.projectManager}</TableCell>
                      <TableCell className="text-right">{formatCurrency(est.cost)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(est.total)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(est.profit)}
                      </TableCell>
                      <TableCell className="text-right">{est.markupPercent}%</TableCell>
                      <TableCell>
                        <Badge variant="outline">{est.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(est.status)}>{est.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
