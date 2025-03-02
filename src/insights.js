const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { table } = require('table');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

/**
 * Fetches repository information from GitHub API
 * @param {string} repo - Repository in format 'owner/repo'
 * @returns {Promise<Object>} - Repository information
 */
const fetchRepoInfo = async (repo) => {
  const spinner = ora(`Fetching repository information for ${repo}`).start();
  try {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error('Invalid repository format. Use owner/repo format.');
    }

    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repoName}`);
    spinner.succeed('Repository information fetched successfully');
    return repoResponse.data;
  } catch (error) {
    spinner.fail(`Failed to fetch repository information: ${error.message}`);
    throw error;
  }
};

/**
 * Fetches contributors information from GitHub API
 * @param {string} repo - Repository in format 'owner/repo'
 * @returns {Promise<Array>} - Contributors information
 */
const fetchContributors = async (repo) => {
  const spinner = ora(`Fetching contributors for ${repo}`).start();
  try {
    const [owner, repoName] = repo.split('/');
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/contributors`);
    spinner.succeed('Contributors fetched successfully');
    return response.data;
  } catch (error) {
    spinner.fail(`Failed to fetch contributors: ${error.message}`);
    throw error;
  }
};

/**
 * Fetches commit activity from GitHub API
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {string} period - Time period (weekly/monthly)
 * @returns {Promise<Array>} - Commit activity data
 */
const fetchCommitActivity = async (repo, period) => {
  const spinner = ora(`Fetching commit activity for ${repo}`).start();
  try {
    const [owner, repoName] = repo.split('/');
    const endpoint = period === 'weekly' 
      ? `https://api.github.com/repos/${owner}/${repoName}/stats/commit_activity`
      : `https://api.github.com/repos/${owner}/${repoName}/stats/participation`;
    
    const response = await axios.get(endpoint);
    spinner.succeed('Commit activity fetched successfully');
    return response.data;
  } catch (error) {
    spinner.fail(`Failed to fetch commit activity: ${error.message}`);
    throw error;
  }
};

/**
 * Generates a chart for commit activity
 * @param {Array} activityData - Commit activity data
 * @param {string} period - Time period (weekly/monthly)
 * @param {string} outputPath - Path to save the chart
 * @returns {Promise<void>}
 */
const generateActivityChart = async (activityData, period, outputPath) => {
  const spinner = ora('Generating activity chart').start();
  try {
    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    let labels, data;
    if (period === 'weekly') {
      // Format weekly data
      labels = activityData.map((week, index) => `Week ${index + 1}`);
      data = activityData.map(week => week.total);
    } else {
      // Format monthly data (last 12 weeks)
      labels = Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`);
      data = activityData.owner.slice(-12);
    }

    const configuration = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Commits',
          data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    fs.writeFileSync(outputPath, image);
    spinner.succeed(`Activity chart saved to ${outputPath}`);
  } catch (error) {
    spinner.fail(`Failed to generate activity chart: ${error.message}`);
    throw error;
  }
};

/**
 * Calculates impact score for contributors
 * @param {Array} contributors - Contributors data
 * @returns {Array} - Contributors with impact scores
 */
const calculateImpactScores = (contributors) => {
  return contributors.map(contributor => {
    // Simple impact score based on commits
    const impactScore = contributor.contributions * 10;
    return {
      username: contributor.login,
      avatarUrl: contributor.avatar_url,
      contributions: contributor.contributions,
      impactScore
    };
  }).sort((a, b) => b.impactScore - a.impactScore);
};

/**
 * Generates repository insights
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {Object} options - Options for insights generation
 * @returns {Promise<void>}
 */
const generateRepoInsights = async (repo, options) => {
  console.log(chalk.blue.bold(`\n📊 Generating insights for ${chalk.yellow(repo)}\n`));

  try {
    // Fetch repository information
    const repoInfo = await fetchRepoInfo(repo);
    
    // Fetch contributors
    const contributors = await fetchContributors(repo);
    
    // Fetch commit activity
    const commitActivity = await fetchCommitActivity(repo, options.period);
    
    // Calculate impact scores
    const contributorsWithImpact = calculateImpactScores(contributors);
    
    // Generate activity chart
    const chartPath = path.join(options.output, `${repo.replace('/', '-')}-activity.png`);
    await generateActivityChart(commitActivity, options.period, chartPath);
    
    // Display repository information
    console.log(chalk.green.bold('\n📌 Repository Overview'));
    const repoData = [
      ['Name', repoInfo.name],
      ['Description', repoInfo.description || 'No description'],
      ['Stars', repoInfo.stargazers_count],
      ['Forks', repoInfo.forks_count],
      ['Open Issues', repoInfo.open_issues_count],
      ['Watchers', repoInfo.subscribers_count],
      ['Created At', new Date(repoInfo.created_at).toLocaleDateString()],
      ['Last Updated', new Date(repoInfo.updated_at).toLocaleDateString()],
      ['Default Branch', repoInfo.default_branch],
      ['License', repoInfo.license ? repoInfo.license.name : 'No license']
    ];
    console.log(table(repoData));
    
    // Display top contributors
    console.log(chalk.green.bold('\n👥 Top Contributors'));
    const topContributors = contributorsWithImpact.slice(0, 5);
    const contributorsData = [
      ['Username', 'Contributions', 'Impact Score'],
      ...topContributors.map(c => [c.username, c.contributions, c.impactScore])
    ];
    console.log(table(contributorsData));
    
    // Save insights to file
    const insightsPath = path.join(options.output, `${repo.replace('/', '-')}-insights.json`);
    fs.writeFileSync(insightsPath, JSON.stringify({
      repository: repoInfo,
      topContributors: contributorsWithImpact.slice(0, 10),
      activityPeriod: options.period,
      generatedAt: new Date().toISOString()
    }, null, 2));
    
    console.log(chalk.blue.bold(`\n✅ Insights generated successfully!`));
    console.log(chalk.blue(`📊 Activity chart saved to: ${chartPath}`));
    console.log(chalk.blue(`📄 Detailed insights saved to: ${insightsPath}`));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error generating insights: ${error.message}`));
    throw error;
  }
};

module.exports = {
  generateRepoInsights
};