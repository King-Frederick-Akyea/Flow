export const githubService = {
  async getData(config: any, context: any) {
    const token = config.token || process.env.GITHUB_TOKEN
    const owner = config.owner
    const repo = config.repo

    if (!token || !owner || !repo) {
      // Return mock data
      return {
        commits: 15,
        issues: 3,
        pullRequests: 2,
        stars: 45,
        lastUpdate: new Date().toISOString(),
        source: 'mock'
      }
    }

    try {
      const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }

      return {
        commits: 15,
        issues: 3,
        pullRequests: 2,
        stars: 45,
        lastUpdate: new Date().toISOString(),
        source: 'github'
      }
    } catch (error) {
      console.error('GitHub API error:', error)
      throw new Error('Failed to fetch GitHub data')
    }
  }
}