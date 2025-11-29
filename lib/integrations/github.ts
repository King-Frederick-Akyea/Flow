export const githubService = {
  async execute(config: any): Promise<any> {
    const { repository, action = 'get_repo', token } = config;
    
    const GITHUB_TOKEN = token || process.env.NEXT_PUBLIC_GITHUB_TOKEN;

    if (!GITHUB_TOKEN) {
      return {
        success: false,
        error: 'GitHub token is not configured. Please add NEXT_PUBLIC_GITHUB_TOKEN to your environment variables or provide a token in the node configuration.'
      };
    }

    if (!repository) {
      return {
        success: false,
        error: 'Repository name is required (format: owner/repo)'
      };
    }

    try {
      let url: string;
      let method = 'GET';

      switch (action) {
        case 'get_repo':
          url = `https://api.github.com/repos/${repository}`;
          break;
        case 'get_issues':
          url = `https://api.github.com/repos/${repository}/issues?state=open&per_page=10`;
          break;
        case 'get_pulls':
          url = `https://api.github.com/repos/${repository}/pulls?state=open&per_page=10`;
          break;
        case 'get_commits':
          url = `https://api.github.com/repos/${repository}/commits?per_page=10`;
          break;
        default:
          return {
            success: false,
            error: `Unknown GitHub action: ${action}`
          };
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Workflow-Automation'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: `Repository "${repository}" not found or access denied`
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: 'GitHub API rate limit exceeded or insufficient permissions'
          };
        } else {
          return {
            success: false,
            error: `GitHub API error: ${response.status} ${response.statusText}`
          };
        }
      }

      const data = await response.json();

      let resultData: any = {
        repository,
        action,
        timestamp: new Date().toISOString()
      };

      switch (action) {
        case 'get_repo':
          resultData = {
            ...resultData,
            name: data.name,
            full_name: data.full_name,
            description: data.description,
            stars: data.stargazers_count,
            forks: data.forks_count,
            watchers: data.watchers_count,
            open_issues: data.open_issues_count,
            language: data.language,
            created_at: data.created_at,
            updated_at: data.updated_at,
            url: data.html_url
          };
          break;
        case 'get_issues':
          resultData.issues = data.map((issue: any) => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            state: issue.state,
            user: issue.user.login,
            created_at: issue.created_at,
            url: issue.html_url
          }));
          break;
        case 'get_pulls':
          resultData.pull_requests = data.map((pr: any) => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state,
            user: pr.user.login,
            created_at: pr.created_at,
            url: pr.html_url
          }));
          break;
        case 'get_commits':
          resultData.commits = data.map((commit: any) => ({
            sha: commit.sha.substring(0, 7),
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            url: commit.html_url
          }));
          break;
      }

      return {
        success: true,
        data: resultData
      };

    } catch (error: any) {
      console.error('GitHub API error:', error);
      return {
        success: false,
        error: `Failed to fetch GitHub data: ${error.message}`
      };
    }
  }
};