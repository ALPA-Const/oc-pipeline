import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { Project } from '../types';

interface UseProjectsOptions {
  limit?: number;
  offset?: number;
  status?: string;
  autoFetch?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { limit = 10, offset = 0, status, autoFetch = true } = options;
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getProjects({ limit, offset, status });
      setProjects(response.projects);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchProjects();
    }
  }, [limit, offset, status, autoFetch]);

  return {
    projects,
    total,
    loading,
    error,
    refetch: fetchProjects,
  };
}
