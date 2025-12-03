# React Query Caching Layer Implementation Guide

## 1. Core Configuration & Setup

### 1.1 QueryClient Configuration

    // src/config/queryClient.ts
    import { QueryClient } from '@tanstack/react-query';

    export const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
          retry: 1,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: false,
          refetchOnMount: 'stale',
          refetchOnReconnect: 'stale',
        },
        mutations: {
          retry: 1,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
      },
    });

### 1.2 Provider Setup

    // src/App.tsx
    import { QueryClientProvider } from '@tanstack/react-query';
    import { queryClient } from './config/queryClient';

    export function App() {
      return (
        <QueryClientProvider client={queryClient}>
          <YourAppRoutes />
        </QueryClientProvider>
      );
    }

## 2. Query Hooks by Module

### 2.1 Preconstruction Module

    // src/hooks/queries/usePreconstruction.ts
    import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
    import { api } from '@/lib/api';

    export const PRECON_KEYS = {
      all: ['preconstruction'] as const,
      pursuits: () => [...PRECON_KEYS.all, 'pursuits'] as const,
      pursuitDetail: (id: string) => [...PRECON_KEYS.pursuits(), id] as const,
      estimates: () => [...PRECON_KEYS.all, 'estimates'] as const,
      estimateDetail: (id: string) => [...PRECON_KEYS.estimates(), id] as const,
      projects: () => [...PRECON_KEYS.all, 'projects'] as const,
    };

    export function usePursuits(orgId: string) {
      return useQuery({
        queryKey: PRECON_KEYS.pursuits(),
        queryFn: () => api.get(`/api/v1/preconstruction/pursuits?org_id=${orgId}`),
        staleTime: 5 * 60 * 1000,
      });
    }

    export function usePursuitDetail(id: string) {
      return useQuery({
        queryKey: PRECON_KEYS.pursuitDetail(id),
        queryFn: () => api.get(`/api/v1/preconstruction/pursuits/${id}`),
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
      });
    }

    export function useCreatePursuit() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => api.post('/api/v1/preconstruction/pursuits', data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: PRECON_KEYS.pursuits() });
        },
      });
    }

    export function useUpdatePursuit(id: string) {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => api.patch(`/api/v1/preconstruction/pursuits/${id}`, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: PRECON_KEYS.pursuitDetail(id) });
          queryClient.invalidateQueries({ queryKey: PRECON_KEYS.pursuits() });
        },
      });
    }

### 2.2 Cost Management Module

    // src/hooks/queries/useCost.ts
    import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
    import { api } from '@/lib/api';

    export const COST_KEYS = {
      all: ['cost'] as const,
      budgets: () => [...COST_KEYS.all, 'budgets'] as const,
      budgetDetail: (id: string) => [...COST_KEYS.budgets(), id] as const,
      changeOrders: () => [...COST_KEYS.all, 'changeOrders'] as const,
      forecasts: () => [...COST_KEYS.all, 'forecasts'] as const,
    };

    export function useBudgets(projectId: string) {
      return useQuery({
        queryKey: COST_KEYS.budgets(),
        queryFn: () => api.get(`/api/v1/cost/budgets?project_id=${projectId}`),
        staleTime: 5 * 60 * 1000,
      });
    }

    export function useChangeOrders(projectId: string) {
      return useQuery({
        queryKey: COST_KEYS.changeOrders(),
        queryFn: () => api.get(`/api/v1/cost/change-orders?project_id=${projectId}`),
        staleTime: 3 * 60 * 1000,
      });
    }

    export function useCreateChangeOrder() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => api.post('/api/v1/cost/change-orders', data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: COST_KEYS.changeOrders() });
          queryClient.invalidateQueries({ queryKey: COST_KEYS.budgets() });
        },
      });
    }

### 2.3 Schedule Module

    // src/hooks/queries/useSchedule.ts
    import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
    import { api } from '@/lib/api';

    export const SCHEDULE_KEYS = {
      all: ['schedule'] as const,
      tasks: () => [...SCHEDULE_KEYS.all, 'tasks'] as const,
      taskDetail: (id: string) => [...SCHEDULE_KEYS.tasks(), id] as const,
      milestones: () => [...SCHEDULE_KEYS.all, 'milestones'] as const,
      gantt: (projectId: string) => [...SCHEDULE_KEYS.all, 'gantt', projectId] as const,
    };

    export function useScheduleTasks(projectId: string) {
      return useQuery({
        queryKey: SCHEDULE_KEYS.tasks(),
        queryFn: () => api.get(`/api/v1/schedule/tasks?project_id=${projectId}`),
        staleTime: 5 * 60 * 1000,
      });
    }

    export function useGanttData(projectId: string) {
      return useQuery({
        queryKey: SCHEDULE_KEYS.gantt(projectId),
        queryFn: () => api.get(`/api/v1/schedule/gantt?project_id=${projectId}`),
        staleTime: 10 * 60 * 1000,
      });
    }

    export function useUpdateTask(id: string) {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => api.patch(`/api/v1/schedule/tasks/${id}`, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.tasks() });
          queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.taskDetail(id) });
        },
      });
    }

## 3. Advanced Caching Patterns

### 3.1 Optimistic Updates

    export function useOptimisticUpdate(id: string) {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => api.patch(`/api/v1/resource/${id}`, data),
        onMutate: async (newData) => {
          await queryClient.cancelQueries({ queryKey: ['resource', id] });
          const previousData = queryClient.getQueryData(['resource', id]);
          queryClient.setQueryData(['resource', id], newData);
          return { previousData };
        },
        onError: (err, newData, context) => {
          if (context?.previousData) {
            queryClient.setQueryData(['resource', id], context.previousData);
          }
        },
      });
    }

### 3.2 Infinite Queries (Pagination)

    export function usePaginatedPursuits(orgId: string) {
      return useInfiniteQuery({
        queryKey: ['pursuits', 'paginated', orgId],
        queryFn: ({ pageParam = 0 }) =>
          api.get(`/api/v1/preconstruction/pursuits?page=${pageParam}&org_id=${orgId}`),
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 0,
      });
    }

### 3.3 Dependent Queries

    export function useProjectWithBudgets(projectId: string) {
      const projectQuery = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => api.get(`/api/v1/projects/${projectId}`),
      });

      const budgetsQuery = useQuery({
        queryKey: ['budgets', projectId],
        queryFn: () => api.get(`/api/v1/cost/budgets?project_id=${projectId}`),
        enabled: !!projectQuery.data,
      });

      return { projectQuery, budgetsQuery };
    }

## 4. Cache Invalidation Strategy

### 4.1 Selective Invalidation

    const queryClient = useQueryClient();

    // Invalidate specific query
    queryClient.invalidateQueries({ queryKey: ['pursuits'] });

    // Invalidate with filters
    queryClient.invalidateQueries({
      queryKey: ['cost'],
      exact: false,
    });

    // Invalidate multiple related queries
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    queryClient.invalidateQueries({ queryKey: ['budgets', projectId] });
    queryClient.invalidateQueries({ queryKey: ['schedule', projectId] });

### 4.2 Background Refetch

    export function useAutoRefresh(queryKey: any[], intervalMs: number = 30000) {
      const query = useQuery({
        queryKey,
        queryFn: async () => api.get(`/api/v1/data`),
        refetchInterval: intervalMs,
        refetchIntervalInBackground: true,
      });

      return query;
    }

## 5. Performance Monitoring

    // src/lib/queryMetrics.ts
    import { useQueryClient } from '@tanstack/react-query';

    export function useQueryMetrics() {
      const queryClient = useQueryClient();

      return {
        getCacheSize: () => {
          const cache = queryClient.getQueryCache();
          return cache.getAll().length;
        },
        getStaleQueries: () => {
          const cache = queryClient.getQueryCache();
          return cache.findAll({ stale: true }).length;
        },
        logMetrics: () => {
          console.log('Active Queries:', queryClient.getQueryCache().getAll().length);
          console.log('Stale Queries:', queryClient.getQueryCache().findAll({ stale: true }).length);
        },
      };
    }
