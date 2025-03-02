# git-bro

<div align="center">

[![NPM version](https://img.shields.io/npm/v/git-bro.svg)](https://www.npmjs.com/package/git-bro)
[![License](https://img.shields.io/npm/l/git-bro.svg)](https://github.com/Adwait-Borate/git-bro/blob/master/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/git-bro.svg)](https://www.npmjs.com/package/git-bro)
[![GitHub issues](https://img.shields.io/github/issues/Adwait-Borate/git-bro.svg)](https://github.com/Adwait-Borate/git-bro/issues)
[![GitHub stars](https://img.shields.io/github/stars/Adwait-Borate/git-bro.svg)](https://github.com/Adwait-Borate/git-bro/stargazers)

**Get detailed insights for GitHub repositories without cloning the entire codebase**

[Installation](#installation) •
[Usage](#usage) •
[Features](#features) •
[Examples](#examples) •
[Configuration](#configuration) •
[Troubleshooting](#troubleshooting) •
[Contributing](#contributing) •
[License](#license)

</div>

## Why git-bro?

Have you ever needed detailed insights for a GitHub repository? Or wanted to audit dependencies, explore commit history, or analyze project metadata without downloading the entire codebase? git-bro solves these problems by providing specific commands to generate insights, audit dependencies, explore commits, and generate project folder structures, saving you bandwidth, time, and disk space.

## Features

- **Generate Insights**: Get detailed insights for a GitHub repository
- **Audit Dependencies**: Analyze dependencies in a GitHub repository
- **Explore Commits**: View commit history of a GitHub repository
- **Generate Structure**: Generate a project folder structure

## Installation

### Global Installation (Recommended)

```bash
npm install -g git-bro
```

This installs git-bro as a global command-line tool accessible from anywhere in your terminal.

### On-demand Usage

```bash
npx git-bro <github-repo-url>
```

Run git-bro directly without installation using `npx`.

## Command Line Options

| Option          | Description         |
| --------------- | ------------------- |
| `-V, --version` | Show version number |
| `-h, --help`    | Show help           |

## Commands

| Command                     | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `insights <repo> [options] ` | Generate detailed insights for a GitHub repository |
| `audit <repo> [options] `    | Audit dependencies in a GitHub repository          |
| `commits <repo> [options]`  | Explore commit history of a GitHub repository      |
| `generate`                  | Generate a project folder structure                |

## Commits Feature Options

| Option              | Description                                  |
| ------------------- | -------------------------------------------- |
| `-a, --author <author>` | Filter commits by author                     |
| `-f, --file <file>`      | Filter commits by file path                   |
| `-c, --conflicts`        | Show only commits with merge conflicts        |
| `-l, --limit <number>`   | Limit number of commits (default: "50")       |
| `-h, --help`             | Display help for command                      |

## Audit Feature Options

| Option              | Description                                  |
| ------------------- | -------------------------------------------- |
| `--type <type>`     | Type of dependency file (package.json, requirements.txt) |
| `--output <path>`   | Output directory for audit reports           |


## Examples

### Generate Insights for a Repository

```bash
git-bro insights username/repository
```

### Audit Dependencies in a Repository

```bash
git-bro audit username/repository
```

### Explore Commit History

```bash
git-bro commits username/repository
```

### Generate Project Folder Structure

```bash
git-bro generate
```

## Configuration

git-bro works out of the box without configuration. For rate-limited GitHub API usage, authentication support is under development.

## Troubleshooting

### Common Issues

#### Rate Limit Exceeded

```
Error: Request failed with status code 403
```

**Solution**: GitHub limits unauthenticated API requests. Wait a few minutes and try again.

#### Invalid URL Format

```
Error: Invalid GitHub URL format
```

**Solution**: Ensure your URL follows the pattern: `https://github.com/owner/repo`

#### Repository Not Found

```
Error: Repository not found
```

**Solution**: Verify the repository name and ensure it is accessible.

## Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions to git-bro are **greatly appreciated**.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See the [open issues](https://github.com/Adwait-Borate/git-bro/issues) for a list of proposed features and known issues.

## Roadmap

- [ ] Add GitHub token authentication
- [ ] Support for GitLab and Bitbucket repositories
- [ ] Download from specific commits or tags
- [ ] Dry run mode
- [ ] CLI interactive mode

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- GitHub API for making this tool possible
- Everyone who has provided feedback and suggestions

---

<div align="center">
<p>Made with ❤️ by <a href="https://github.com/Adwait-Borate">Adwait-Borate</a> and <a href="https://github.com/ShreyashIngle">ShreyashIngle</a></p>
<p>If you find this tool useful, consider <a href="https://github.com/sponsors/Adwait-Borate">sponsoring</a> its development</p>
</div>
