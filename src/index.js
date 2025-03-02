const { program } = require('commander');
const { parseGitHubUrl } = require('./parser');
const { generateRepoInsights } = require('./insights');
const { auditDependencies } = require('./dependency-audit');
const { exploreCommitHistory } = require('./commit-explorer');
const { createProjectStructure } = require('./project-generator');

const initializeCLI = () => {
  program
    .version('1.1.2')
    .description('CLI tool for GitHub repository management');

  // Command for repository insights
  program
    .command('insights <repo>')
    .description('Generate detailed insights for a GitHub repository')
    .option('-p, --period <period>', 'Time period for analytics (weekly/monthly)', 'monthly')
    .option('-o, --output <directory>', 'Output directory for reports', process.cwd())
    .action(async (repo, options) => {
      try {
        await generateRepoInsights(repo, options);
        console.log('Repository insights generated successfully!');
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  // Command for dependency audit
  program
    .command('audit <repo>')
    .description('Audit dependencies in a GitHub repository')
    .option('-t, --type <type>', 'Dependency file type (package.json, requirements.txt)', 'package.json')
    .option('-o, --output <directory>', 'Output directory for reports', process.cwd())
    .action(async (repo, options) => {
      try {
        await auditDependencies(repo, options);
        console.log('Dependency audit completed successfully!');
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  // Command for commit history explorer
  program
    .command('commits <repo>')
    .description('Explore commit history of a GitHub repository')
    .option('-a, --author <author>', 'Filter commits by author')
    .option('-f, --file <file>', 'Filter commits by file path')
    .option('-c, --conflicts', 'Show only commits with merge conflicts')
    .option('-l, --limit <number>', 'Limit number of commits', '50')
    .action(async (repo, options) => {
      try {
        await exploreCommitHistory(repo, options);
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  // Command for project structure generation
  program
    .command('generate')
    .description('Generate a project folder structure')
    .action(async () => {
      try {
        await createProjectStructure();
        console.log('Project structure generated successfully!');
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  program.parse(process.argv);
};

module.exports = {
  downloadFolder: initializeCLI
};
