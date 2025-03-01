const { program } = require('commander');
const { parseGitHubUrl } = require('./parser');
const { downloadFolder } = require('./downloader');
const { exploreCommitHistory } = require('./commit-explorer');
const { createProjectStructure } = require('./project-generator');

const initializeCLI = () => {
  program
    .version('1.1.2')
    .description('Clone specific folders from GitHub repositories');

  // Command for downloading folders
  program
    .command('download <url>')
    .description('Download a specific folder from a GitHub repository')
    .option('-o, --output <directory>', 'Output directory', process.cwd())
    .action(async (url, options) => {
      try {
        const parsedUrl = parseGitHubUrl(url);
        await downloadFolder(parsedUrl, options.output);
        console.log('Folder cloned successfully!');
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

  // Default command (for backward compatibility)
  program
    .argument('[url]', 'GitHub URL of the folder to clone')
    .option('-o, --output <directory>', 'Output directory', process.cwd())
    .action(async (url, options) => {
      if (!url) {
        program.help();
        return;
      }
      
      try {
        const parsedUrl = parseGitHubUrl(url);
        await downloadFolder(parsedUrl, options.output);
        console.log('Folder cloned successfully!');
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
