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
      per_page: options.limit || 50
    };
    
    if (options.author) {
      params.author = options.author;
    }
    
    if (options.since) {
      params.since = options.since;
    }
    
    if (options.until) {
      params.until = options.until;
    }
    
    const response = await axios.get(url, { params });
    spinner.succeed(`${response.data.length} commits fetched successfully`);
    
    // Fetch additional details for each commit if needed
    const commits = await Promise.all(response.data.map(async (commit) => {
      // If we need to filter by file or check for conflicts, fetch the commit details
      if (options.file || options.conflicts || options.showStats) {
        const detailsSpinner = ora(`Fetching details for ${commit.sha.substring(0, 7)}`).start();
        try {
          const detailsResponse = await axios.get(commit.url);
          detailsSpinner.succeed();
          return {
            ...commit,
            details: detailsResponse.data
          };
        } catch (error) {
          detailsSpinner.fail(`Failed to fetch details for ${commit.sha.substring(0, 7)}`);
          return commit;
        }
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
        file.filename.toLowerCase().includes(options.file.toLowerCase())
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
      return message.includes('conflict') || 
             message.includes('resolve') || 
             message.includes('merge') ||
             message.includes('fix merge') ||
             message.includes('resolve conflict');
    });
  }
  
  // Filter by commit type (feat, fix, docs, etc.)
  if (options.type) {
    filteredCommits = filteredCommits.filter(commit => {
      const message = commit.commit.message.toLowerCase();
      return message.startsWith(options.type.toLowerCase());
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
    const date = new Date(commit.commit.author.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const message = commit.commit.message.split('\n')[0]; // Get first line of commit message
    const author = commit.author ? commit.author.login : commit.commit.author.name;
    const authorEmail = commit.commit.author.email;
    
    // Calculate commit stats if available
    let stats = null;
    if (commit.details && commit.details.stats) {
      stats = {
        additions: commit.details.stats.additions || 0,
        deletions: commit.details.stats.deletions || 0,
        total: commit.details.stats.total || 0,
        filesChanged: commit.details.files ? commit.details.files.length : 0
      };
    }
    
    // Determine commit type from message
    let commitType = 'other';
    const msg = message.toLowerCase();
    if (msg.startsWith('feat') || msg.includes('feature')) commitType = 'feature';
    else if (msg.startsWith('fix') || msg.includes('bug')) commitType = 'bugfix';
    else if (msg.startsWith('docs') || msg.includes('documentation')) commitType = 'docs';
    else if (msg.startsWith('refactor')) commitType = 'refactor';
    else if (msg.startsWith('test')) commitType = 'test';
    else if (msg.includes('merge')) commitType = 'merge';
    
    return {
      sha: commit.sha.substring(0, 7),
      fullSha: commit.sha,
      date: formattedDate,
      time,
      author,
      authorEmail,
      message: message.length > 80 ? message.substring(0, 80) + '...' : message,
      fullMessage: commit.commit.message,
      stats,
      commitType,
      url: commit.html_url
    };
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
 * Gets emoji for commit type
 * @param {string} type - Commit type
 * @returns {string} - Emoji representation
 */
const getCommitTypeEmoji = (type) => {
  const emojis = {
    feature: '✨',
    bugfix: '🐛',
    docs: '📚',
    refactor: '♻️',
    test: '🧪',
    merge: '🔀',
    other: '💬'
  };
  return emojis[type] || emojis.other;
};

/**
 * Formats number with appropriate color coding
 * @param {number} num - Number to format
 * @param {string} type - Type (additions/deletions)
 * @returns {string} - Formatted and colored number
 */
const formatStatNumber = (num, type) => {
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (type === 'additions') return chalk.green(`+${formatted}`);
  if (type === 'deletions') return chalk.red(`-${formatted}`);
  return chalk.white(formatted);
};

/**
 * Builds a tree representation of commits with enhanced styling
 * @param {Array} commits - Formatted commit data
 * @returns {string} - Tree representation
 */
const buildCommitTree = (commits) => {
  let tree = '';
  
  commits.forEach((commit, index) => {
    const isLast = index === commits.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    const emoji = getCommitTypeEmoji(commit.commitType);
    
    let line = `${chalk.gray(prefix)}${emoji} ${chalk.yellow(commit.sha)} `;
    line += `${chalk.cyan(commit.date)} ${chalk.gray(commit.time)} `;
    line += `${chalk.blue('@' + commit.author)} `;
    
    if (commit.stats) {
      line += `${chalk.gray('[')}${formatStatNumber(commit.stats.additions, 'additions')}${chalk.gray('/')}${formatStatNumber(commit.stats.deletions, 'deletions')}${chalk.gray(']')} `;
    }
    
    line += `${chalk.white(commit.message)}`;
    tree += line + '\n';
  });
  
  return tree;
};

/**
 * Generates commit statistics summary
 * @param {Array} commits - Formatted commit data
 * @returns {Object} - Statistics summary
 */
const generateCommitStats = (commits) => {
  const stats = {
    totalCommits: commits.length,
    authors: new Set(),
    commitTypes: {},
    totalAdditions: 0,
    totalDeletions: 0,
    totalFilesChanged: 0,
    dateRange: {
      earliest: null,
      latest: null
    }
  };
  
  commits.forEach(commit => {
    stats.authors.add(commit.author);
    
    if (!stats.commitTypes[commit.commitType]) {
      stats.commitTypes[commit.commitType] = 0;
    }
    stats.commitTypes[commit.commitType]++;
    
    if (commit.stats) {
      stats.totalAdditions += commit.stats.additions;
      stats.totalDeletions += commit.stats.deletions;
      stats.totalFilesChanged += commit.stats.filesChanged;
    }
    
    const commitDate = new Date(commit.date + ' ' + commit.time);
    if (!stats.dateRange.earliest || commitDate < stats.dateRange.earliest) {
      stats.dateRange.earliest = commitDate;
    }
    if (!stats.dateRange.latest || commitDate > stats.dateRange.latest) {
      stats.dateRange.latest = commitDate;
    }
  });
  
  stats.uniqueAuthors = stats.authors.size;
  return stats;
};

/**
 * Explores commit history of a GitHub repository
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {Object} options - Options for exploring commits
 * @returns {Promise<void>}
 */
const exploreCommitHistory = async (repo, options = {}) => {
  console.log(chalk.blue.bold(`\n🔍 Exploring commit history for ${chalk.yellow(repo)}\n`));
  console.log(chalk.gray('━'.repeat(80)));

  try {
    // Fetch commits
    const commits = await fetchCommits(repo, options);
    
    // Filter commits based on options
    const filteredCommits = filterCommits(commits, options);
    
    if (filteredCommits.length === 0) {
      console.log(chalk.yellow('\n⚠️  No commits found matching the specified criteria.'));
      return;
    }
    
    // Format commits for display
    const formattedCommits = formatCommits(filteredCommits);
    
    // Generate statistics
    const stats = generateCommitStats(formattedCommits);
    
    // Display applied filters
    console.log(chalk.green.bold('\n🔧 Filters Applied'));
    console.log(chalk.gray('━'.repeat(40)));
    
    const filtersData = [
      [chalk.bold('Filter'), chalk.bold('Value')],
      ['Repository', chalk.cyan(repo)],
      ['Limit', chalk.white(options.limit || 50)],
      ['Author', options.author ? chalk.blue(options.author) : chalk.gray('All authors')],
      ['File Filter', options.file ? chalk.yellow(options.file) : chalk.gray('All files')],
      ['Commit Type', options.type ? chalk.green(options.type) : chalk.gray('All types')],
      ['Merge Conflicts Only', options.conflicts ? chalk.red('Yes') : chalk.gray('No')],
      ['Date Range', options.since || options.until ? 
        `${options.since || 'Beginning'} - ${options.until || 'Latest'}` : 
        chalk.gray('All time')]
    ];
    
    const filterTableConfig = {
      columns: {
        0: { width: 20, alignment: 'right' },
        1: { width: 40, alignment: 'left' }
      }
    };
    console.log(createStyledTable(filtersData, filterTableConfig));
    
    // Display commit statistics
    console.log(chalk.green.bold('\n📊 Commit Statistics'));
    console.log(chalk.gray('━'.repeat(40)));
    
    const statsData = [
      [chalk.bold('Metric'), chalk.bold('Value')],
      ['Total Commits', chalk.cyan(stats.totalCommits.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','))],
      ['Unique Authors', chalk.blue(stats.uniqueAuthors)],
      ['Total Additions', formatStatNumber(stats.totalAdditions, 'additions')],
      ['Total Deletions', formatStatNumber(stats.totalDeletions, 'deletions')],
      ['Files Changed', chalk.white(stats.totalFilesChanged.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','))],
      ['Date Range', stats.dateRange.earliest && stats.dateRange.latest ? 
        `${stats.dateRange.earliest.toLocaleDateString()} - ${stats.dateRange.latest.toLocaleDateString()}` :
        chalk.gray('N/A')]
    ];
    
    console.log(createStyledTable(statsData, filterTableConfig));
    
    // Display commit type breakdown
    console.log(chalk.green.bold('\n📈 Commit Type Breakdown'));
    console.log(chalk.gray('━'.repeat(40)));
    
    const typeData = [
      [chalk.bold('Type'), chalk.bold('Count'), chalk.bold('Percentage')]
    ];
    
    Object.entries(stats.commitTypes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        const percentage = ((count / stats.totalCommits) * 100).toFixed(1);
        const emoji = getCommitTypeEmoji(type);
        typeData.push([
          `${emoji} ${chalk.cyan(type)}`,
          chalk.white(count),
          chalk.yellow(`${percentage}%`)
        ]);
      });
    
    const typeTableConfig = {
      columns: {
        0: { width: 15, alignment: 'left' },
        1: { width: 10, alignment: 'center' },
        2: { width: 15, alignment: 'center' }
      }
    };
    console.log(createStyledTable(typeData, typeTableConfig));
    
    // Display commits in detailed table format
    console.log(chalk.green.bold('\n📋 Commit Details'));
    console.log(chalk.gray('━'.repeat(80)));
    
    const tableData = [
      [
        chalk.bold('SHA'), 
        chalk.bold('Date'), 
        chalk.bold('Author'), 
        chalk.bold('Type'),
        chalk.bold('Changes'),
        chalk.bold('Message')
      ]
    ];
    
    formattedCommits.forEach(commit => {
      const emoji = getCommitTypeEmoji(commit.commitType);
      const changes = commit.stats ? 
        `${formatStatNumber(commit.stats.additions, 'additions')}/${formatStatNumber(commit.stats.deletions, 'deletions')}` :
        chalk.gray('N/A');
      
      tableData.push([
        chalk.yellow(commit.sha),
        chalk.cyan(commit.date),
        chalk.blue(commit.author),
        `${emoji} ${commit.commitType}`,
        changes,
        chalk.white(commit.message)
      ]);
    });
    
    const commitTableConfig = {
      columns: {
        0: { width: 8, alignment: 'center' },
        1: { width: 12, alignment: 'center' },
        2: { width: 15, alignment: 'left' },
        3: { width: 12, alignment: 'center' },
        4: { width: 15, alignment: 'center' },
        5: { width: 50, alignment: 'left', wrapWord: true }
      }
    };
    console.log(createStyledTable(tableData, commitTableConfig));
    
    // Display commit tree
    console.log(chalk.green.bold('\n🌳 Commit Tree Visualization'));
    console.log(chalk.gray('━'.repeat(80)));
    console.log(buildCommitTree(formattedCommits));
    
    // Display summary
    console.log(chalk.blue.bold('\n✅ Commit History Analysis Complete'));
    console.log(chalk.gray('━'.repeat(80)));
    console.log(chalk.blue(`📊 Repository: ${chalk.yellow(repo)}`));
    console.log(chalk.blue(`📈 Analyzed: ${chalk.cyan(stats.totalCommits)} commits by ${chalk.blue(stats.uniqueAuthors)} authors`));
    console.log(chalk.blue(`🗓️  Period: ${stats.dateRange.earliest ? 
      `${stats.dateRange.earliest.toLocaleDateString()} to ${stats.dateRange.latest.toLocaleDateString()}` :
      'Full history'}`));
    console.log(chalk.blue(`⏰ Generated at: ${chalk.white(new Date().toLocaleString())}`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error exploring commit history: ${error.message}`));
    console.error(chalk.gray('━'.repeat(80)));
    throw error;
  }
};

module.exports = {
  exploreCommitHistory
};