const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const { table } = require('table');
const fs = require('fs-extra');
const path = require('path');

/**
 * Fetches repository information from GitHub API
 * @param {string} repo - Repository in format 'owner/repo'
 * @returns {Promise<Object>} - Repository information
 */
const fetchRepoInfo = async (repo) => {
  const spinner = ora('Fetching repository information').start();
  try {
    const [owner, repoName] = repo.split('/');
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repoName}`);
    spinner.succeed('Repository information fetched successfully');
    return response.data;
  } catch (error) {
    spinner.fail(`Failed to fetch repository information: ${error.message}`);
    throw error;
  }
};

/**
 * Fetches contributors from GitHub API
 * @param {string} repo - Repository in format 'owner/repo'
 * @returns {Promise<Array>} - Contributors data
 */
const fetchContributors = async (repo) => {
  const spinner = ora('Fetching contributors').start();
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
 * Fetches commit activity data from GitHub API
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {string} period - Time period (weekly/monthly)
 * @returns {Promise<Array>} - Commit activity data
 */
const fetchCommitActivity = async (repo, period) => {
  const spinner = ora('Fetching commit activity').start();
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
 * Calculates impact scores for contributors
 * @param {Array} contributors - Contributors data
 * @returns {Array} - Contributors with impact scores
 */
const calculateImpactScores = (contributors) => {
  const totalContributions = contributors.reduce((sum, contributor) => sum + contributor.contributions, 0);
  
  return contributors.map(contributor => ({
    ...contributor,
    impactScore: Math.round((contributor.contributions / totalContributions) * 100)
  }));
};

/**
 * Formats numbers with commas for better readability
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Formats file size in human readable format
 * @param {number} sizeInKB - Size in kilobytes
 * @returns {string} - Formatted size
 */
const formatFileSize = (sizeInKB) => {
  if (sizeInKB < 1024) return `${formatNumber(sizeInKB)} KB`;
  if (sizeInKB < 1048576) return `${(sizeInKB / 1024).toFixed(1)} MB`;
  return `${(sizeInKB / 1048576).toFixed(1)} GB`;
};

/**
 * Formats date in a more readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Creates table configuration for better styling
 * @param {Array} data - Table data
 * @param {Object} options - Styling options
 * @returns {string} - Formatted table
 */
const createStyledTable = (data, options = {}) => {
  const config = {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    },
    columnDefault: {
      paddingLeft: 1,
      paddingRight: 1,
    },
    ...options
  };
  
  return table(data, config);
};

/**
 * Generates detailed insights for a GitHub repository
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {Object} options - Options for insights generation
 * @returns {Promise<void>}
 */
const generateRepoInsights = async (repo, options = {}) => {
  // Set default options
  options = {
    output: './insights',
    period: 'weekly',
    ...options
  };

  // Ensure output directory exists
  await fs.ensureDir(options.output);

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
    
    // Display repository information with improved formatting
    console.log(chalk.green.bold('\n📌 Repository Overview'));
    console.log(chalk.gray('━'.repeat(60)));
    
    const repoData = [
      [chalk.bold('Property'), chalk.bold('Value')],
      ['Repository Name', chalk.cyan(repoInfo.name)],
      ['Full Name', chalk.cyan(repoInfo.full_name)],
      ['Description', repoInfo.description || chalk.gray('No description available')],
      ['Primary Language', repoInfo.language ? chalk.green(repoInfo.language) : chalk.gray('Not specified')],
      ['Stars', chalk.yellow(`⭐ ${formatNumber(repoInfo.stargazers_count)}`)],
      ['Forks', chalk.blue(`🍴 ${formatNumber(repoInfo.forks_count)}`)],
      ['Watchers', chalk.magenta(`👀 ${formatNumber(repoInfo.subscribers_count)}`)],
      ['Open Issues', repoInfo.open_issues_count > 0 ? chalk.red(`🐛 ${formatNumber(repoInfo.open_issues_count)}`) : chalk.green('✅ 0')],
      ['Repository Size', chalk.white(formatFileSize(repoInfo.size))],
      ['License', repoInfo.license ? chalk.blue(repoInfo.license.name) : chalk.gray('No license')],
      ['Default Branch', chalk.cyan(repoInfo.default_branch)],
      ['Created Date', chalk.white(formatDate(repoInfo.created_at))],
      ['Last Updated', chalk.white(formatDate(repoInfo.updated_at))],
      ['Last Pushed', chalk.white(formatDate(repoInfo.pushed_at))],
      ['Homepage', repoInfo.homepage ? chalk.underline.blue(repoInfo.homepage) : chalk.gray('None')],
      ['Clone URL', chalk.gray(repoInfo.clone_url)]
    ];

    // Create styled table with custom configuration
    const repoTableConfig = {
      columnDefault: {
        width: 25,
        wrapWord: true
      },
      columns: {
        0: { width: 20, alignment: 'right' },
        1: { width: 50, alignment: 'left' }
      }
    };
    
    console.log(createStyledTable(repoData, repoTableConfig));

    // Display repository statistics in a separate section
    console.log(chalk.green.bold('\n📈 Repository Statistics'));
    console.log(chalk.gray('━'.repeat(60)));
    
    const statsData = [
      [chalk.bold('Metric'), chalk.bold('Count'), chalk.bold('Percentage')],
      ['Total Stars', formatNumber(repoInfo.stargazers_count), '100%'],
      ['Total Forks', formatNumber(repoInfo.forks_count), `${((repoInfo.forks_count / repoInfo.stargazers_count) * 100).toFixed(1)}%`],
      ['Fork Ratio', `1:${Math.round(repoInfo.stargazers_count / repoInfo.forks_count) || 0}`, 'Stars per Fork'],
      ['Issue Ratio', `${((repoInfo.open_issues_count / repoInfo.stargazers_count) * 100).toFixed(2)}%`, 'Issues per Star']
    ];
    
    console.log(createStyledTable(statsData));

    // Display top contributors with improved formatting
    console.log(chalk.green.bold('\n👥 Top Contributors'));
    console.log(chalk.gray('━'.repeat(60)));
    
    const topContributors = contributorsWithImpact.slice(0, 10);
    const contributorData = [
      [chalk.bold('Rank'), chalk.bold('Username'), chalk.bold('Avatar'), chalk.bold('Contributions'), chalk.bold('Impact Score')],
      ...topContributors.map((contributor, index) => [
        chalk.yellow(`#${index + 1}`),
        chalk.cyan(contributor.login),
        chalk.blue('🔗 Profile'),
        chalk.white(formatNumber(contributor.contributions)),
        chalk.green(`${contributor.impactScore}%`)
      ])
    ];
    
    const contributorTableConfig = {
      columns: {
        0: { width: 6, alignment: 'center' },
        1: { width: 20, alignment: 'left' },
        2: { width: 12, alignment: 'center' },
        3: { width: 15, alignment: 'right' },
        4: { width: 12, alignment: 'center' }
      }
    };
    
    console.log(createStyledTable(contributorData, contributorTableConfig));

    // Display commit activity summary with improved formatting
    console.log(chalk.green.bold('\n📈 Commit Activity Summary'));
    console.log(chalk.gray('━'.repeat(60)));
    
    let activitySummary = [];
    
    if (options.period === 'weekly' && Array.isArray(commitActivity)) {
      const totalCommits = commitActivity.reduce((sum, week) => sum + week.total, 0);
      const avgCommitsPerWeek = Math.round(totalCommits / commitActivity.length);
      const lastWeekCommits = commitActivity[commitActivity.length - 1]?.total || 0;
      const mostActiveWeek = Math.max(...commitActivity.map(w => w.total));
      
      activitySummary = [
        [chalk.bold('Metric'), chalk.bold('Value')],
        ['Total Commits (52 weeks)', chalk.cyan(formatNumber(totalCommits))],
        ['Average per Week', chalk.yellow(formatNumber(avgCommitsPerWeek))],
        ['Last Week', chalk.white(formatNumber(lastWeekCommits))],
        ['Most Active Week', chalk.green(formatNumber(mostActiveWeek))],
        ['Activity Trend', totalCommits > 0 ? chalk.green('📈 Active') : chalk.red('📉 Inactive')]
      ];
    } else if (commitActivity.owner) {
      const recentCommits = commitActivity.owner.slice(-12);
      const totalRecentCommits = recentCommits.reduce((sum, week) => sum + week, 0);
      const avgCommitsPerWeek = Math.round(totalRecentCommits / 12);
      const mostActiveWeek = Math.max(...recentCommits);
      
      activitySummary = [
        [chalk.bold('Metric'), chalk.bold('Value')],
        ['Total Commits (12 weeks)', chalk.cyan(formatNumber(totalRecentCommits))],
        ['Average per Week', chalk.yellow(formatNumber(avgCommitsPerWeek))],
        ['Most Active Week', chalk.green(formatNumber(mostActiveWeek))],
        ['Activity Trend', totalRecentCommits > 0 ? chalk.green('📈 Active') : chalk.red('📉 Inactive')]
      ];
    }
    
    if (activitySummary.length > 0) {
      const activityTableConfig = {
        columns: {
          0: { width: 25, alignment: 'right' },
          1: { width: 30, alignment: 'left' }
        }
      };
      console.log(createStyledTable(activitySummary, activityTableConfig));
    }

    // Save detailed insights to JSON file
    const insightsPath = path.join(options.output, `${repo.replace('/', '-')}-insights.json`);
    await fs.writeFile(insightsPath, JSON.stringify({
      repository: repoInfo,
      contributors: contributorsWithImpact,
      commitActivity,
      generatedAt: new Date().toISOString()
    }, null, 2));
    
    console.log(chalk.blue.bold(`\n✅ Insights generated successfully!`));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.blue(`📄 Detailed insights saved to: ${chalk.underline(insightsPath)}`));
    console.log(chalk.blue(`📊 Repository: ${chalk.yellow(repo)}`));
    console.log(chalk.blue(`⏰ Generated at: ${chalk.white(new Date().toLocaleString())}`));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error generating insights: ${error.message}`));
    throw error;
  }
};

module.exports = {
  generateRepoInsights
};