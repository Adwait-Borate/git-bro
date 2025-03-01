const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const { table } = require('table');

/**
 * Fetches commits from a GitHub repository
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {Object} options - Options for filtering commits
 * @returns {Promise<Array>} - Commits data
 */
const fetchCommits = async (repo, options) => {
  const spinner = ora(`Fetching commits for ${repo}`).start();
  try {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error('Invalid repository format. Use owner/repo format.');
    }

    let url = `https://api.github.com/repos/${owner}/${repoName}/commits`;
    const params = {
      per_page: options.limit
    };
    
    if (options.author) {
      params.author = options.author;
    }
    
    const response = await axios.get(url, { params });
    spinner.succeed('Commits fetched successfully');
    
    // Fetch additional details for each commit if needed
    const commits = await Promise.all(response.data.map(async (commit) => {
      // If we need to filter by file or check for conflicts, fetch the commit details
      if (options.file || options.conflicts) {
        const detailsResponse = await axios.get(commit.url);
        return {
          ...commit,
          details: detailsResponse.data
        };
      }
      return commit;
    }));
    
    return commits;
  } catch (error) {
    spinner.fail(`Failed to fetch commits: ${error.message}`);
    throw error;
  }
};

/**
 * Filters commits based on options
 * @param {Array} commits - Commits data
 * @param {Object} options - Filter options
 * @returns {Array} - Filtered commits
 */
const filterCommits = (commits, options) => {
  let filteredCommits = commits;
  
  // Filter by file
  if (options.file) {
    filteredCommits = filteredCommits.filter(commit => {
      if (!commit.details || !commit.details.files) {
        return false;
      }
      return commit.details.files.some(file => 
        file.filename.includes(options.file)
      );
    });
  }
  
  // Filter by merge conflicts
  if (options.conflicts) {
    filteredCommits = filteredCommits.filter(commit => {
      if (!commit.details) {
        return false;
      }
      // Check if commit message mentions merge conflicts
      const message = commit.commit.message.toLowerCase();
      return message.includes('conflict') || message.includes('resolve') || message.includes('merge');
    });
  }
  
  return filteredCommits;
};

/**
 * Formats commit data for display
 * @param {Array} commits - Commits data
 * @returns {Array} - Formatted commit data
 */
const formatCommits = (commits) => {
  return commits.map(commit => {
    const date = new Date(commit.commit.author.date).toLocaleDateString();
    const message = commit.commit.message.split('\n')[0]; // Get first line of commit message
    const author = commit.author ? commit.author.login : commit.commit.author.name;
    
    return {
      sha: commit.sha.substring(0, 7),
      date,
      author,
      message
    };
  });
};

/**
 * Builds a tree representation of commits
 * @param {Array} commits - Formatted commit data
 * @returns {string} - Tree representation
 */
const buildCommitTree = (commits) => {
  let tree = '';
  
  commits.forEach((commit, index) => {
    const isLast = index === commits.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    const line = `${prefix}${chalk.yellow(commit.sha)} ${chalk.green(commit.date)} ${chalk.blue(commit.author)}: ${commit.message}`;
    tree += line + '\n';
  });
  
  return tree;
};

/**
 * Explores commit history of a GitHub repository
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {Object} options - Options for exploring commits
 * @returns {Promise<void>}
 */
const exploreCommitHistory = async (repo, options) => {
  console.log(chalk.blue.bold(`\n🔍 Exploring commit history for ${chalk.yellow(repo)}\n`));

  try {
    // Fetch commits
    const commits = await fetchCommits(repo, options);
    
    // Filter commits based on options
    const filteredCommits = filterCommits(commits, options);
    
    if (filteredCommits.length === 0) {
      console.log(chalk.yellow('No commits found matching the specified criteria.'));
      return;
    }
    
    // Format commits for display
    const formattedCommits = formatCommits(filteredCommits);
    
    // Display filters applied
    console.log(chalk.green.bold('Filters applied:'));
    const filters = [];
    if (options.author) filters.push(`Author: ${options.author}`);
    if (options.file) filters.push(`File: ${options.file}`);
    if (options.conflicts) filters.push('Only commits with merge conflicts');
    if (filters.length === 0) filters.push('None');
    console.log(filters.join(', '));
    
    // Display commit count
    console.log(chalk.green.bold(`\nFound ${formattedCommits.length} commits\n`));
    
    // Display commits in table format
    const tableData = [
      ['SHA', 'Date', 'Author', 'Message'],
      ...formattedCommits.map(c => [c.sha, c.date, c.author, c.message])
    ];
    console.log(table(tableData));
    
    // Display commit tree
    console.log(chalk.green.bold('\nCommit Tree:'));
    console.log(buildCommitTree(formattedCommits));
    
    console.log(chalk.blue.bold(`\n✅ Commit history exploration completed!`));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error exploring commit history: ${error.message}`));
    throw error;
  }
};

module.exports = {
  exploreCommitHistory
};