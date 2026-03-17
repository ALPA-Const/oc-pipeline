import { useState, useMemo, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Flag,
  BarChart2,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Plus,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  CheckCircle2,
  Circle,
  Diamond,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = 'not-started' | 'in-progress' | 'complete' | 'delayed';
type TaskType = 'task' | 'milestone' | 'summary';

interface ScheduleTask {
  id: string;
  wbs: string;
  name: string;
  type: TaskType;
  start: Date;
  finish: Date;
  duration: number; // work days
  percentComplete: number;
  predecessors: string[]; // task ids
  isCritical: boolean;
  status: TaskStatus;
  responsible: string;
  notes?: string;
  parentId?: string;
  children?: string[];
  collapsed?: boolean;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

const INITIAL_TASKS: ScheduleTask[] = [
  // Summary – Site Work
  { id: '1', wbs: '1', name: 'SITE WORK', type: 'summary', start: d(2025,3,3), finish: d(2025,5,16), duration: 55, percentComplete: 85, predecessors: [], isCritical: true, status: 'in-progress', responsible: 'PM', children: ['1.1','1.2','1.3'] },
  { id: '1.1', wbs: '1.1', name: 'Mobilization & Temp Facilities', type: 'task', start: d(2025,3,3), finish: d(2025,3,14), duration: 10, percentComplete: 100, predecessors: [], isCritical: true, status: 'complete', responsible: 'Supt', parentId: '1' },
  { id: '1.2', wbs: '1.2', name: 'Site Clearing & Demolition', type: 'task', start: d(2025,3,17), finish: d(2025,3,28), duration: 10, percentComplete: 100, predecessors: ['1.1'], isCritical: true, status: 'complete', responsible: 'Civil Sub', parentId: '1' },
  { id: '1.3', wbs: '1.3', name: 'Earthwork & Grading', type: 'task', start: d(2025,4,1), finish: d(2025,5,16), duration: 35, percentComplete: 60, predecessors: ['1.2'], isCritical: true, status: 'in-progress', responsible: 'Civil Sub', parentId: '1' },

  // Summary – Foundation
  { id: '2', wbs: '2', name: 'FOUNDATION', type: 'summary', start: d(2025,5,1), finish: d(2025,7,11), duration: 50, percentComplete: 30, predecessors: ['1.3'], isCritical: true, status: 'in-progress', responsible: 'PM', children: ['2.1','2.2','2.3','2.4'] },
  { id: '2.1', wbs: '2.1', name: 'Excavation for Footings', type: 'task', start: d(2025,5,1), finish: d(2025,5,16), duration: 12, percentComplete: 80, predecessors: ['1.3'], isCritical: true, status: 'in-progress', responsible: 'Civil Sub', parentId: '2' },
  { id: '2.2', wbs: '2.2', name: 'Footing Formwork & Rebar', type: 'task', start: d(2025,5,19), finish: d(2025,6,6), duration: 15, percentComplete: 0, predecessors: ['2.1'], isCritical: true, status: 'not-started', responsible: 'Concrete Sub', parentId: '2' },
  { id: '2.3', wbs: '2.3', name: 'Concrete Footings Pour', type: 'task', start: d(2025,6,9), finish: d(2025,6,13), duration: 5, percentComplete: 0, predecessors: ['2.2'], isCritical: true, status: 'not-started', responsible: 'Concrete Sub', parentId: '2' },
  { id: '2.4', wbs: '2.4', name: 'Foundation Walls & Waterproofing', type: 'task', start: d(2025,6,16), finish: d(2025,7,11), duration: 20, percentComplete: 0, predecessors: ['2.3'], isCritical: true, status: 'not-started', responsible: 'Concrete Sub', parentId: '2' },

  // Summary – Structural Steel
  { id: '3', wbs: '3', name: 'STRUCTURAL STEEL', type: 'summary', start: d(2025,7,14), finish: d(2025,9,26), duration: 55, percentComplete: 0, predecessors: ['2.4'], isCritical: true, status: 'not-started', responsible: 'PM', children: ['3.1','3.2','3.3'] },
  { id: '3.1', wbs: '3.1', name: 'Steel Fabrication (off-site)', type: 'task', start: d(2025,7,14), finish: d(2025,8,15), duration: 25, percentComplete: 0, predecessors: ['2.4'], isCritical: false, status: 'not-started', responsible: 'Steel Sub', parentId: '3' },
  { id: '3.2', wbs: '3.2', name: 'Steel Erection', type: 'task', start: d(2025,8,18), finish: d(2025,9,12), duration: 20, percentComplete: 0, predecessors: ['3.1'], isCritical: true, status: 'not-started', responsible: 'Steel Sub', parentId: '3' },
  { id: '3.3', wbs: '3.3', name: 'Metal Decking & Shear Studs', type: 'task', start: d(2025,9,15), finish: d(2025,9,26), duration: 10, percentComplete: 0, predecessors: ['3.2'], isCritical: true, status: 'not-started', responsible: 'Steel Sub', parentId: '3' },

  // Summary – Envelope
  { id: '4', wbs: '4', name: 'BUILDING ENVELOPE', type: 'summary', start: d(2025,9,29), finish: d(2026,1,16), duration: 75, percentComplete: 0, predecessors: ['3.3'], isCritical: false, status: 'not-started', responsible: 'PM', children: ['4.1','4.2','4.3'] },
  { id: '4.1', wbs: '4.1', name: 'Exterior Wall Framing', type: 'task', start: d(2025,9,29), finish: d(2025,10,31), duration: 25, percentComplete: 0, predecessors: ['3.3'], isCritical: false, status: 'not-started', responsible: 'Framing Sub', parentId: '4' },
  { id: '4.2', wbs: '4.2', name: 'Roofing System', type: 'task', start: d(2025,11,3), finish: d(2025,12,5), duration: 25, percentComplete: 0, predecessors: ['4.1'], isCritical: false, status: 'not-started', responsible: 'Roofing Sub', parentId: '4' },
  { id: '4.3', wbs: '4.3', name: 'Exterior Cladding & Glazing', type: 'task', start: d(2025,12,8), finish: d(2026,1,16), duration: 30, percentComplete: 0, predecessors: ['4.2'], isCritical: false, status: 'not-started', responsible: 'Glazing Sub', parentId: '4' },

  // Summary – MEP Rough-in
  { id: '5', wbs: '5', name: 'MEP ROUGH-IN', type: 'summary', start: d(2025,10,13), finish: d(2026,2,13), duration: 90, percentComplete: 0, predecessors: ['3.2'], isCritical: true, status: 'not-started', responsible: 'PM', children: ['5.1','5.2','5.3'] },
  { id: '5.1', wbs: '5.1', name: 'Plumbing Rough-in', type: 'task', start: d(2025,10,13), finish: d(2025,12,12), duration: 45, percentComplete: 0, predecessors: ['3.2'], isCritical: false, status: 'not-started', responsible: 'Plumbing Sub', parentId: '5' },
  { id: '5.2', wbs: '5.2', name: 'Mechanical (HVAC) Rough-in', type: 'task', start: d(2025,10,13), finish: d(2026,1,9), duration: 60, percentComplete: 0, predecessors: ['3.2'], isCritical: true, status: 'not-started', responsible: 'Mech Sub', parentId: '5' },
  { id: '5.3', wbs: '5.3', name: 'Electrical Rough-in', type: 'task', start: d(2025,11,3), finish: d(2026,2,13), duration: 70, percentComplete: 0, predecessors: ['5.1'], isCritical: true, status: 'not-started', responsible: 'Elec Sub', parentId: '5' },

  // Summary – Interiors
  { id: '6', wbs: '6', name: 'INTERIOR CONSTRUCTION', type: 'summary', start: d(2026,1,19), finish: d(2026,5,1), duration: 75, percentComplete: 0, predecessors: ['5.3'], isCritical: true, status: 'not-started', responsible: 'PM', children: ['6.1','6.2','6.3','6.4'] },
  { id: '6.1', wbs: '6.1', name: 'Interior Framing & Drywall', type: 'task', start: d(2026,1,19), finish: d(2026,3,6), duration: 35, percentComplete: 0, predecessors: ['5.3'], isCritical: true, status: 'not-started', responsible: 'Framing Sub', parentId: '6' },
  { id: '6.2', wbs: '6.2', name: 'Flooring', type: 'task', start: d(2026,3,9), finish: d(2026,3,27), duration: 15, percentComplete: 0, predecessors: ['6.1'], isCritical: false, status: 'not-started', responsible: 'Flooring Sub', parentId: '6' },
  { id: '6.3', wbs: '6.3', name: 'Painting & Finishes', type: 'task', start: d(2026,3,9), finish: d(2026,4,3), duration: 20, percentComplete: 0, predecessors: ['6.1'], isCritical: true, status: 'not-started', responsible: 'Painting Sub', parentId: '6' },
  { id: '6.4', wbs: '6.4', name: 'Casework & Millwork', type: 'task', start: d(2026,4,6), finish: d(2026,5,1), duration: 20, percentComplete: 0, predecessors: ['6.3'], isCritical: true, status: 'not-started', responsible: 'Millwork Sub', parentId: '6' },

  // Summary – Commissioning
  { id: '7', wbs: '7', name: 'COMMISSIONING & CLOSEOUT', type: 'summary', start: d(2026,5,4), finish: d(2026,6,26), duration: 40, percentComplete: 0, predecessors: ['6.4'], isCritical: true, status: 'not-started', responsible: 'PM', children: ['7.1','7.2','7.3','M1'] },
  { id: '7.1', wbs: '7.1', name: 'MEP Commissioning & Testing', type: 'task', start: d(2026,5,4), finish: d(2026,5,22), duration: 15, percentComplete: 0, predecessors: ['6.4'], isCritical: true, status: 'not-started', responsible: 'CxA', parentId: '7' },
  { id: '7.2', wbs: '7.2', name: 'Punch List & Inspections', type: 'task', start: d(2026,5,25), finish: d(2026,6,12), duration: 15, percentComplete: 0, predecessors: ['7.1'], isCritical: true, status: 'not-started', responsible: 'Supt', parentId: '7' },
  { id: '7.3', wbs: '7.3', name: 'Final Cleaning', type: 'task', start: d(2026,6,15), finish: d(2026,6,19), duration: 5, percentComplete: 0, predecessors: ['7.2'], isCritical: true, status: 'not-started', responsible: 'GC', parentId: '7' },
  { id: 'M1', wbs: '7.4', name: '🔷 Substantial Completion', type: 'milestone', start: d(2026,6,26), finish: d(2026,6,26), duration: 0, percentComplete: 0, predecessors: ['7.3'], isCritical: true, status: 'not-started', responsible: 'PM', parentId: '7' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86400000;

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * MS_PER_DAY);
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShort(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  'not-started': 'bg-gray-400',
  'in-progress': 'bg-blue-500',
  'complete': 'bg-green-500',
  'delayed': 'bg-red-500',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'complete': 'Complete',
  'delayed': 'Delayed',
};

// ─── Zoom levels: pixels per day ──────────────────────────────────────────────
const ZOOM_LEVELS = [2, 4, 8, 14, 20];
const ZOOM_LABELS = ['Quarter', 'Month', '2-Week', 'Week', 'Day'];

// ─── GanttBar ─────────────────────────────────────────────────────────────────

interface GanttBarProps {
  task: ScheduleTask;
  projectStart: Date;
  pxPerDay: number;
  rowHeight: number;
  onClick: () => void;
}

function GanttBar({ task, projectStart, pxPerDay, rowHeight, onClick }: GanttBarProps) {
  const left = daysBetween(projectStart, task.start) * pxPerDay;
  const width = Math.max((task.type === 'milestone' ? 0 : task.duration) * pxPerDay, task.type === 'milestone' ? 12 : 4);
  const top = (rowHeight - (task.type === 'summary' ? 12 : 18)) / 2;

  if (task.type === 'milestone') {
    return (
      <div
        className="absolute cursor-pointer"
        style={{ left: left - 6, top: top + 3, width: 12, height: 12 }}
        onClick={onClick}
        title={task.name}
      >
        <div className="w-3 h-3 rotate-45 bg-purple-600 border border-purple-800" />
      </div>
    );
  }

  if (task.type === 'summary') {
    return (
      <div
        className="absolute cursor-pointer"
        style={{ left, top, height: 12, width }}
        onClick={onClick}
        title={task.name}
      >
        <div className="w-full h-full bg-gray-700 rounded-sm opacity-80" />
        {/* Left cap */}
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-gray-700" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />
        {/* Right cap */}
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-gray-700" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
      </div>
    );
  }

  const barColor = task.isCritical ? 'bg-red-500' : (task.status === 'complete' ? 'bg-green-500' : 'bg-blue-500');
  const progressWidth = (task.percentComplete / 100) * width;

  return (
    <div
      className="absolute cursor-pointer rounded"
      style={{ left, top, height: 18, width: Math.max(width, 4) }}
      onClick={onClick}
      title={`${task.name} (${task.percentComplete}%)`}
    >
      <div className={`w-full h-full rounded border border-opacity-40 ${barColor} border-current opacity-80`} />
      {task.percentComplete > 0 && (
        <div
          className="absolute top-0 left-0 h-full rounded bg-opacity-100 bg-white/30"
          style={{ width: progressWidth }}
        />
      )}
      {/* % label */}
      {width > 30 && (
        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold leading-none">
          {task.percentComplete}%
        </span>
      )}
    </div>
  );
}

// ─── Timeline Header ──────────────────────────────────────────────────────────

interface TimelineHeaderProps {
  projectStart: Date;
  totalDays: number;
  pxPerDay: number;
}

function TimelineHeader({ projectStart, totalDays, pxPerDay }: TimelineHeaderProps) {
  // Generate month markers
  const months: { label: string; left: number; width: number }[] = [];
  let cur = new Date(projectStart.getFullYear(), projectStart.getMonth(), 1);
  while (cur <= addDays(projectStart, totalDays)) {
    const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const startDay = Math.max(0, daysBetween(projectStart, cur));
    const endDay = Math.min(totalDays, daysBetween(projectStart, nextMonth));
    const w = (endDay - startDay) * pxPerDay;
    if (w > 0) {
      months.push({
        label: cur.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        left: startDay * pxPerDay,
        width: w,
      });
    }
    cur = nextMonth;
  }

  // Week markers
  const weeks: { left: number }[] = [];
  if (pxPerDay >= 4) {
    for (let day = 0; day < totalDays; day += 7) {
      weeks.push({ left: day * pxPerDay });
    }
  }

  return (
    <div className="relative bg-gray-100 border-b border-gray-300" style={{ height: 48 }}>
      {/* Month labels */}
      <div className="absolute top-0 left-0 right-0 h-6 border-b border-gray-300">
        {months.map((m, i) => (
          <div
            key={i}
            className="absolute top-0 h-full border-l border-gray-300 flex items-center px-1"
            style={{ left: m.left, width: m.width }}
          >
            <span className="text-xs font-semibold text-gray-600 truncate">{m.label}</span>
          </div>
        ))}
      </div>
      {/* Week markers */}
      <div className="absolute bottom-0 left-0 right-0 h-6">
        {weeks.map((w, i) => {
          const wDate = addDays(projectStart, i * 7);
          return (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-gray-200 flex items-center px-0.5"
              style={{ left: w.left, width: 7 * pxPerDay }}
            >
              <span className="text-xs text-gray-400">{formatShort(wDate)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Today Line ───────────────────────────────────────────────────────────────

function TodayLine({ projectStart, totalDays, pxPerDay, rowCount, rowHeight }: {
  projectStart: Date; totalDays: number; pxPerDay: number; rowCount: number; rowHeight: number;
}) {
  const today = new Date();
  const offset = daysBetween(projectStart, today);
  if (offset < 0 || offset > totalDays) return null;
  const left = offset * pxPerDay;
  return (
    <div
      className="absolute top-0 bottom-0 border-l-2 border-red-400 z-10 pointer-events-none"
      style={{ left, height: rowCount * rowHeight }}
    >
      <div className="bg-red-400 text-white text-xs px-1 rounded-sm -ml-4 -mt-0.5 whitespace-nowrap">
        Today
      </div>
    </div>
  );
}

// ─── Task Detail Panel ────────────────────────────────────────────────────────

function TaskDetailPanel({ task, onClose }: { task: ScheduleTask; onClose: () => void }) {
  return (
    <div className="w-72 bg-white border-l border-gray-200 shadow-lg flex flex-col overflow-y-auto flex-shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">Task Details</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wide">WBS</span>
          <p className="font-mono font-semibold text-gray-800">{task.wbs}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wide">Task Name</span>
          <p className="font-semibold text-gray-900">{task.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">Start</span>
            <p className="text-gray-800">{formatDate(task.start)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">Finish</span>
            <p className="text-gray-800">{formatDate(task.finish)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">Duration</span>
            <p className="text-gray-800">{task.duration}d</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">% Complete</span>
            <p className="text-gray-800">{task.percentComplete}%</p>
          </div>
        </div>
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wide">Status</span>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLORS[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wide">Responsible</span>
          <p className="text-gray-800">{task.responsible}</p>
        </div>
        {task.predecessors.length > 0 && (
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">Predecessors</span>
            <p className="font-mono text-gray-800">{task.predecessors.join(', ')}</p>
          </div>
        )}
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wide">Critical Path</span>
          <p className={task.isCritical ? 'text-red-600 font-semibold' : 'text-gray-500'}>
            {task.isCritical ? 'Yes – On Critical Path' : 'No'}
          </p>
        </div>
        {/* Progress bar */}
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wide">Progress</span>
          <div className="mt-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${task.percentComplete}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gantt View ───────────────────────────────────────────────────────────────

const ROW_HEIGHT = 32;
const TASK_COL_WIDTH = 580;

function GanttView() {
  const [tasks, setTasks] = useState<ScheduleTask[]>(INITIAL_TASKS);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(1); // index into ZOOM_LEVELS
  const [selectedTask, setSelectedTask] = useState<ScheduleTask | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const pxPerDay = ZOOM_LEVELS[zoomLevel];

  // Project date range
  const projectStart = useMemo(() => {
    const dates = tasks.map((t) => t.start);
    return new Date(Math.min(...dates.map((d) => d.getTime())));
  }, [tasks]);

  const projectEnd = useMemo(() => {
    const dates = tasks.map((t) => t.finish);
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }, [tasks]);

  const totalDays = daysBetween(projectStart, projectEnd) + 14;

  // Flat visible task list (respecting collapse)
  const visibleTasks = useMemo(() => {
    const result: ScheduleTask[] = [];
    const topLevel = tasks.filter((t) => !t.parentId);

    function walk(task: ScheduleTask) {
      const matchSearch = searchTerm
        ? task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.wbs.includes(searchTerm)
        : true;
      if (matchSearch || task.children?.some((cId) => tasks.find((t) => t.id === cId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))) {
        result.push(task);
      }
      if (!collapsed.has(task.id) && task.children) {
        task.children.forEach((cId) => {
          const child = tasks.find((t) => t.id === cId);
          if (child) walk(child);
        });
      }
    }
    topLevel.forEach(walk);
    return result;
  }, [tasks, collapsed, searchTerm]);

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const criticalCount = tasks.filter((t) => t.isCritical && t.type === 'task').length;
  const delayedCount = tasks.filter((t) => t.status === 'delayed').length;
  const completeCount = tasks.filter((t) => t.status === 'complete' && t.type === 'task').length;
  const totalTaskCount = tasks.filter((t) => t.type === 'task').length;
  const overallProgress = Math.round(
    tasks.filter((t) => t.type === 'task').reduce((s, t) => s + t.percentComplete, 0) / totalTaskCount
  );

  return (
    <div className="flex flex-col h-full">
      {/* KPI Bar */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Overall Progress', value: `${overallProgress}%`, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Total Tasks', value: totalTaskCount, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
          { label: 'Complete', value: completeCount, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { label: 'Critical Path', value: criticalCount, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Delayed', value: delayedCount || '0', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-lg border p-3 ${kpi.bg}`}>
            <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-40 max-w-64">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search tasks…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 border border-gray-200 rounded-md overflow-hidden">
          <button
            className="px-2 py-1.5 hover:bg-gray-100 disabled:opacity-40"
            disabled={zoomLevel === 0}
            onClick={() => setZoomLevel((z) => Math.max(0, z - 1))}
          >
            <ZoomOut className="h-4 w-4 text-gray-600" />
          </button>
          <span className="px-2 text-xs font-medium text-gray-600 border-x border-gray-200">
            {ZOOM_LABELS[zoomLevel]}
          </span>
          <button
            className="px-2 py-1.5 hover:bg-gray-100 disabled:opacity-40"
            disabled={zoomLevel === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomLevel((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))}
          >
            <ZoomIn className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <button
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50"
          onClick={() => setCollapsed(new Set())}
        >
          Expand All
        </button>
        <button
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50"
          onClick={() => {
            const summaryIds = new Set(tasks.filter((t) => t.type === 'summary').map((t) => t.id));
            setCollapsed(summaryIds);
          }}
        >
          Collapse All
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50">
            <Upload className="h-3.5 w-3.5" /> Import XER/MPP
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50">
            <Download className="h-3.5 w-3.5" /> Export XER
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Task
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-4 h-3 bg-red-500 rounded inline-block" /> Critical Path</span>
        <span className="flex items-center gap-1"><span className="w-4 h-3 bg-blue-500 rounded inline-block" /> In Progress</span>
        <span className="flex items-center gap-1"><span className="w-4 h-3 bg-green-500 rounded inline-block" /> Complete</span>
        <span className="flex items-center gap-1"><span className="w-4 h-3 bg-gray-700 rounded inline-block" /> Summary</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rotate-45 bg-purple-600 inline-block" /> Milestone</span>
        <span className="flex items-center gap-1 ml-auto"><span className="w-3 h-3 border-l-2 border-red-400 inline-block" /> Today</span>
      </div>

      {/* Main Gantt area */}
      <div className="flex flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white min-h-0">
        {/* Left: task list */}
        <div className="flex flex-col border-r border-gray-300 overflow-hidden" style={{ width: TASK_COL_WIDTH, minWidth: TASK_COL_WIDTH }}>
          {/* Header row */}
          <div className="flex items-center bg-gray-100 border-b border-gray-300 text-xs font-semibold text-gray-600 uppercase tracking-wide" style={{ height: 48 }}>
            <div className="w-12 flex-shrink-0 text-center border-r border-gray-300 px-1 py-1">WBS</div>
            <div className="flex-1 px-2 border-r border-gray-300 truncate">Task Name</div>
            <div className="w-20 px-2 border-r border-gray-300 text-center">Start</div>
            <div className="w-20 px-2 border-r border-gray-300 text-center">Finish</div>
            <div className="w-10 text-center">Dur.</div>
          </div>

          {/* Task rows */}
          <div className="flex-1 overflow-y-auto">
            {visibleTasks.map((task) => {
              const indent = task.parentId ? 16 : 0;
              const isCollapsed = collapsed.has(task.id);
              const hasChildren = task.children && task.children.length > 0;
              const isSelected = selectedTask?.id === task.id;

              return (
                <div
                  key={task.id}
                  className={`flex items-center border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-100' : task.type === 'summary' ? 'bg-gray-50' : ''}`}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="w-12 flex-shrink-0 text-center text-xs font-mono text-gray-500 border-r border-gray-100 truncate px-0.5">{task.wbs}</div>
                  <div className="flex-1 flex items-center gap-1 px-1 border-r border-gray-100 min-w-0" style={{ paddingLeft: indent + 4 }}>
                    {hasChildren && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCollapse(task.id); }}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-700"
                      >
                        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                    {!hasChildren && <span className="w-3 flex-shrink-0" />}
                    {task.type === 'milestone' ? (
                      <Diamond className="h-3 w-3 flex-shrink-0 text-purple-600" />
                    ) : task.type === 'summary' ? (
                      <BarChart2 className="h-3 w-3 flex-shrink-0 text-gray-600" />
                    ) : task.isCritical ? (
                      <AlertTriangle className="h-3 w-3 flex-shrink-0 text-red-500" />
                    ) : (
                      <div className="w-3 flex-shrink-0" />
                    )}
                    <span className={`text-xs truncate ${task.type === 'summary' ? 'font-bold text-gray-800' : task.type === 'milestone' ? 'font-semibold text-purple-700' : 'text-gray-700'}`}>
                      {task.name}
                    </span>
                  </div>
                  <div className="w-20 text-xs text-gray-500 text-center border-r border-gray-100 truncate px-0.5">{formatShort(task.start)}</div>
                  <div className="w-20 text-xs text-gray-500 text-center border-r border-gray-100 truncate px-0.5">{formatShort(task.finish)}</div>
                  <div className="w-10 text-xs text-gray-500 text-center">{task.duration > 0 ? `${task.duration}d` : '—'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Gantt chart */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Timeline header (scrolls horizontally with chart) */}
          <div className="overflow-x-auto overflow-y-hidden flex-shrink-0" style={{ height: 48 }}>
            <div style={{ width: totalDays * pxPerDay, height: 48 }}>
              <TimelineHeader projectStart={projectStart} totalDays={totalDays} pxPerDay={pxPerDay} />
            </div>
          </div>

          {/* Chart rows */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto"
          >
            <div style={{ width: totalDays * pxPerDay, position: 'relative' }}>
              {/* Background stripes */}
              {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, wi) => (
                <div
                  key={wi}
                  className={`absolute top-0 bottom-0 ${wi % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ left: wi * 7 * pxPerDay, width: 7 * pxPerDay, height: visibleTasks.length * ROW_HEIGHT }}
                />
              ))}

              {/* Today line */}
              <TodayLine
                projectStart={projectStart}
                totalDays={totalDays}
                pxPerDay={pxPerDay}
                rowCount={visibleTasks.length}
                rowHeight={ROW_HEIGHT}
              />

              {/* Task rows */}
              {visibleTasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`relative border-b border-gray-100 ${selectedTask?.id === task.id ? 'bg-blue-50/50' : task.type === 'summary' ? 'bg-gray-50/30' : ''}`}
                  style={{ height: ROW_HEIGHT }}
                >
                  <GanttBar
                    task={task}
                    projectStart={projectStart}
                    pxPerDay={pxPerDay}
                    rowHeight={ROW_HEIGHT}
                    onClick={() => setSelectedTask(task)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Detail panel */}
        {selectedTask && (
          <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
      </div>
    </div>
  );
}

// ─── Milestones View ──────────────────────────────────────────────────────────

function MilestonesView() {
  const milestones = INITIAL_TASKS.filter((t) => t.type === 'milestone');
  const allKeyDates = [
    ...INITIAL_TASKS.filter((t) => t.type === 'summary').map((t) => ({
      id: t.id,
      name: t.name,
      date: t.finish,
      type: 'Phase End',
      status: t.status,
      responsible: t.responsible,
      percentComplete: t.percentComplete,
    })),
    ...milestones.map((t) => ({
      id: t.id,
      name: t.name,
      date: t.finish,
      type: 'Milestone',
      status: t.status,
      responsible: t.responsible,
      percentComplete: t.percentComplete,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-800">Key Dates & Milestones</h2>
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-3.5 w-3.5" /> Add Milestone
        </button>
      </div>

      {/* Timeline visual */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
        <div className="flex items-center gap-3 min-w-max">
          {allKeyDates.map((m, i) => {
            const isPast = m.date < today;
            const isToday = formatDate(m.date) === formatDate(today);
            return (
              <div key={m.id} className="flex flex-col items-center">
                <div className={`w-px h-8 ${isPast ? 'bg-green-400' : 'bg-gray-300'}`} />
                <div className={`w-4 h-4 rotate-45 border-2 ${isPast ? 'bg-green-500 border-green-600' : isToday ? 'bg-yellow-500 border-yellow-600' : 'bg-white border-gray-400'}`} />
                <div className="w-px h-4 bg-gray-300" />
                <span className="text-xs text-gray-500 whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 60 }}>{formatShort(m.date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Responsible</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Progress</th>
            </tr>
          </thead>
          <tbody>
            {allKeyDates.map((m, i) => {
              const isPast = m.date < today;
              return (
                <tr key={m.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.type === 'Milestone' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(m.date)}</td>
                  <td className="px-4 py-3 text-gray-600">{m.responsible}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLORS[m.status]}`}>
                      {STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.percentComplete}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{m.percentComplete}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Look-Ahead View ──────────────────────────────────────────────────────────

function LookAheadView() {
  const today = new Date();
  const windowDays = 21;
  const windowEnd = addDays(today, windowDays);

  const activeTasks = INITIAL_TASKS.filter((t) => {
    if (t.type === 'summary') return false;
    return t.start <= windowEnd && t.finish >= today;
  }).sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-semibold text-gray-800">3-Week Look-Ahead Schedule</h2>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(today)} → {formatDate(windowEnd)}</p>
        </div>
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </button>
      </div>

      {activeTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No tasks scheduled in the next 3 weeks.</div>
      ) : (
        <div className="space-y-2">
          {activeTasks.map((task) => {
            const daysUntilStart = daysBetween(today, task.start);
            const daysRemaining = daysBetween(today, task.finish);
            const urgency = daysRemaining <= 3 ? 'bg-red-50 border-red-200' : daysRemaining <= 7 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200';

            return (
              <div key={task.id} className={`rounded-lg border p-4 ${urgency}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{task.wbs}</span>
                      {task.isCritical && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">CRITICAL</span>}
                      {task.type === 'milestone' && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">MILESTONE</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-0.5">{task.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(task.start)} – {formatDate(task.finish)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.duration}d duration</span>
                      <span className="flex items-center gap-1"><Flag className="h-3 w-3" /> {task.responsible}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLORS[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.percentComplete}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{task.percentComplete}%</span>
                    </div>
                    {daysRemaining >= 0 && daysRemaining <= 7 && (
                      <span className="text-xs text-orange-600 font-semibold">
                        {daysRemaining === 0 ? 'Due Today!' : `${daysRemaining}d remaining`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'gantt' | 'milestones' | 'look-ahead';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'gantt', label: 'Gantt View', icon: BarChart2 },
  { id: 'milestones', label: 'Milestones', icon: Flag },
  { id: 'look-ahead', label: '3-Week Look-Ahead', icon: Clock },
];

export function ProjectManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('gantt');

  return (
    <AppLayout>
      <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 128px)' }}>
        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Construction Schedule</h1>
              <p className="text-sm text-gray-500">Federal Medical Office Building — Contract No. W912DQ-25-C-0047</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">Active Project</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">CPM Schedule</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'gantt' && <GanttView />}
          {activeTab === 'milestones' && <MilestonesView />}
          {activeTab === 'look-ahead' && <LookAheadView />}
        </div>
      </div>
    </AppLayout>
  );
}
