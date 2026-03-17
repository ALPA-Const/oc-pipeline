/**
 * GitHub Search Service
 *
 * Fetches top AI chat interface repositories from the GitHub public search API.
 * Falls back to curated static data when the API is unavailable or rate-limited.
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  open_issues_count: number;
  archived: boolean;
}

/** Curated fallback list of top AI chat interface repos (sorted by stars, March 2026) */
const FALLBACK_REPOS: GitHubRepo[] = [
  {
    id: 701547123,
    name: 'open-webui',
    full_name: 'open-webui/open-webui',
    description: 'User-friendly AI Interface (Supports Ollama, OpenAI API, ...)',
    html_url: 'https://github.com/open-webui/open-webui',
    stargazers_count: 127569,
    forks_count: 18034,
    language: 'Python',
    topics: ['ai', 'llm', 'llm-ui', 'ollama', 'openai', 'rag', 'self-hosted', 'webui'],
    updated_at: '2026-03-17T18:31:18Z',
    open_issues_count: 295,
    archived: false,
  },
  {
    id: 619959033,
    name: 'gpt4all',
    full_name: 'nomic-ai/gpt4all',
    description: 'GPT4All: Run Local LLMs on Any Device. Open-source and available for commercial use.',
    html_url: 'https://github.com/nomic-ai/gpt4all',
    stargazers_count: 77226,
    forks_count: 8329,
    language: 'C++',
    topics: ['ai-chat', 'llm-inference'],
    updated_at: '2026-03-17T16:23:06Z',
    open_issues_count: 756,
    archived: false,
  },
  {
    id: 600596928,
    name: 'LibreChat',
    full_name: 'danny-avila/LibreChat',
    description:
      'Enhanced ChatGPT Clone: Features Agents, MCP, DeepSeek, Anthropic, AWS, OpenAI, Azure, Groq, o1, GPT-5, Mistral, OpenRouter, Gemini, Artifacts, AI model switching, Code Interpreter, Secure Multi-User Auth, open-source for self-hosting.',
    html_url: 'https://github.com/danny-avila/LibreChat',
    stargazers_count: 34714,
    forks_count: 7022,
    language: 'TypeScript',
    topics: ['ai', 'chatgpt', 'chatgpt-clone', 'claude', 'deepseek', 'gemini', 'mcp', 'openai', 'self-hosted'],
    updated_at: '2026-03-17T17:40:08Z',
    open_issues_count: 455,
    archived: false,
  },
  {
    id: 612640604,
    name: 'chatbot-ui',
    full_name: 'mckaywrigley/chatbot-ui',
    description: 'AI chat for any model.',
    html_url: 'https://github.com/mckaywrigley/chatbot-ui',
    stargazers_count: 33112,
    forks_count: 9467,
    language: 'TypeScript',
    topics: ['chatgpt', 'openai', 'nextjs', 'typescript'],
    updated_at: '2026-03-17T18:30:46Z',
    open_issues_count: 244,
    archived: false,
  },
  {
    id: 633262635,
    name: 'onyx',
    full_name: 'onyx-dot-app/onyx',
    description: 'Open Source AI Platform - AI Chat with advanced features that works with every LLM',
    html_url: 'https://github.com/onyx-dot-app/onyx',
    stargazers_count: 17920,
    forks_count: 2425,
    language: 'Python',
    topics: ['ai', 'ai-chat', 'chatgpt', 'llm', 'nextjs', 'rag', 'self-hosted'],
    updated_at: '2026-03-17T18:24:24Z',
    open_issues_count: 281,
    archived: false,
  },
  {
    id: 649154175,
    name: 'ChatAny',
    full_name: 'ChatAnyTeam/ChatAny',
    description:
      'One click access to your own ChatGPT and many AI web services',
    html_url: 'https://github.com/ChatAnyTeam/ChatAny',
    stargazers_count: 6529,
    forks_count: 1814,
    language: 'TypeScript',
    topics: ['chatgpt', 'chatgpt-next-web', 'chatgpt-web', 'openai'],
    updated_at: '2026-03-17T12:56:08Z',
    open_issues_count: 12,
    archived: false,
  },
  {
    id: 649154176,
    name: 'freegpt-webui',
    full_name: 'ramon-victor/freegpt-webui',
    description: 'GPT 3.5/4 with a Chat Web UI. No API key required.',
    html_url: 'https://github.com/ramon-victor/freegpt-webui',
    stargazers_count: 5662,
    forks_count: 1227,
    language: 'Python',
    topics: ['chatgpt', 'chatgpt-clone', 'freegpt', 'gpt-4'],
    updated_at: '2026-03-13T02:38:30Z',
    open_issues_count: 86,
    archived: true,
  },
  {
    id: 932490533,
    name: 'deepchat',
    full_name: 'ThinkInAIXYZ/deepchat',
    description: 'DeepChat - A smart assistant that connects powerful AI to your personal world',
    html_url: 'https://github.com/ThinkInAIXYZ/deepchat',
    stargazers_count: 5586,
    forks_count: 639,
    language: 'TypeScript',
    topics: ['ai', 'ai-assistant', 'ai-chat', 'chatbot', 'deepseek', 'electron', 'mcp'],
    updated_at: '2026-03-17T16:29:57Z',
    open_issues_count: 17,
    archived: false,
  },
  {
    id: 946702247,
    name: 'rikkahub',
    full_name: 'rikkahub/rikkahub',
    description: 'RikkaHub is an Android APP that supports multiple LLM providers.',
    html_url: 'https://github.com/rikkahub/rikkahub',
    stargazers_count: 3541,
    forks_count: 228,
    language: 'Kotlin',
    topics: ['android', 'chatgpt', 'deepseek', 'gemini', 'llm-ui', 'mcp', 'ollama-ui'],
    updated_at: '2026-03-17T17:27:25Z',
    open_issues_count: 122,
    archived: false,
  },
  {
    id: 629462321,
    name: 'chatgpt-clone',
    full_name: 'xtekky/chatgpt-clone',
    description: 'ChatGPT interface with better UI',
    html_url: 'https://github.com/xtekky/chatgpt-clone',
    stargazers_count: 3521,
    forks_count: 1031,
    language: 'Python',
    topics: ['chatgpt', 'chatgpt-clone', 'gpt-4', 'ui'],
    updated_at: '2026-03-17T11:42:44Z',
    open_issues_count: 62,
    archived: false,
  },
];

class GitHubSearchService {
  private readonly apiBase = 'https://api.github.com';

  /**
   * Fetch the top AI chat interface repositories from GitHub search API.
   * Returns up to 10 results sorted by star count.
   * Falls back to curated static data on API failure.
   */
  async getTopAIChatRepos(): Promise<{ repos: GitHubRepo[]; source: 'api' | 'fallback' }> {
    try {
      const queries = [
        'topic:llm-ui stars:>500',
        'topic:chatgpt-clone stars:>1000',
        'topic:ai-chat stars:>1000',
      ];

      const allRepos: GitHubRepo[] = [];
      const seenIds = new Set<number>();

      for (const q of queries) {
        const url = `${this.apiBase}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`;
        const response = await fetch(url, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const items: GitHubRepo[] = data.items ?? [];
        for (const item of items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allRepos.push(item);
          }
        }
      }

      // Sort by stars descending and take the top 10
      const sorted = allRepos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 10);

      // If API returned fewer than 5 results, supplement with fallback data
      if (sorted.length < 5) {
        return { repos: FALLBACK_REPOS, source: 'fallback' };
      }

      return { repos: sorted, source: 'api' };
    } catch (error) {
      console.error('GitHub search API error:', error);
      return { repos: FALLBACK_REPOS, source: 'fallback' };
    }
  }
}

export const githubSearchService = new GitHubSearchService();
export { FALLBACK_REPOS };
