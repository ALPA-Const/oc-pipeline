/**
 * GitHub AI Chat Repos Page
 *
 * Displays the top 10 most-starred open-source AI chat interface platforms
 * fetched live from the GitHub search API (with a curated fallback).
 */

import React, { useEffect, useState } from 'react';
import { ExternalLink, Star, GitFork, AlertCircle, RefreshCw, Github } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { githubSearchService, type GitHubRepo } from '@/services/github-search.service';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  'C++': 'bg-pink-500',
  Kotlin: 'bg-purple-500',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-500',
};

function formatNumber(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return String(n);
}

function RepoCard({ repo, rank }: { repo: GitHubRepo; rank: number }) {
  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] ?? 'bg-gray-400') : null;

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Rank badge */}
      <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-bold text-white shadow">
        #{rank}
      </div>

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-gray-900 hover:text-blue-600 hover:underline"
          >
            {repo.full_name}
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
          </a>
          {repo.archived && (
            <Badge variant="outline" className="ml-2 border-amber-400 text-amber-600 text-xs">
              Archived
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-2">
        {repo.description ?? 'No description provided.'}
      </p>

      {/* Topics */}
      {repo.topics.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 5).map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              {topic}
            </span>
          ))}
          {repo.topics.length > 5 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              +{repo.topics.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${langColor}`} />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="h-4 w-4 text-amber-400" />
          {formatNumber(repo.stargazers_count)}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-4 w-4 text-gray-400" />
          {formatNumber(repo.forks_count)}
        </span>
      </div>
    </div>
  );
}

function RepoCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <Skeleton className="mb-3 h-5 w-48" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-4 h-4 w-3/4" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export const GitHubAIChatRepos: React.FC = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [source, setSource] = useState<'api' | 'fallback' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await githubSearchService.getTopAIChatRepos();
      setRepos(result.repos);
      setSource(result.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl">
        {/* Page header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
                <Github className="h-8 w-8" />
                Top 10 AI Chat Interface Platforms
              </h1>
              <p className="text-white/90">
                The most-starred open-source AI chat interface repositories on GitHub, ranked by
                community popularity.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRepos}
              disabled={loading}
              className="shrink-0 border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Source indicator */}
        {source && !loading && (
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <span
              className={`inline-block h-2 w-2 rounded-full ${source === 'api' ? 'bg-green-500' : 'bg-amber-400'}`}
            />
            {source === 'api'
              ? 'Live data from GitHub API'
              : 'Showing curated data (GitHub API unavailable)'}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <RepoCardSkeleton key={i} />)
            : repos.map((repo, index) => (
                <RepoCard key={repo.id} repo={repo} rank={index + 1} />
              ))}
        </div>

        {/* Footer note */}
        {!loading && repos.length > 0 && (
          <p className="mt-8 text-center text-xs text-gray-400">
            Rankings are based on GitHub star counts. Data sourced from the GitHub public search
            API.
          </p>
        )}
      </div>
    </MainLayout>
  );
};
