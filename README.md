# Git-master

<div align="center">

[![NPM version](https://img.shields.io/npm/v/git-master.svg)](https://www.npmjs.com/package/git-master)
[![License](https://img.shields.io/npm/l/git-master.svg)](https://github.com/Adwait-Borate/git-master/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/git-master.svg)](https://www.npmjs.com/package/git-master)
[![GitHub issues](https://img.shields.io/github/issues/Adwait-Borate/git-master.svg)](https://github.com/Adwait-Borate/git-master/issues)
[![GitHub stars](https://img.shields.io/github/stars/Adwait-Borate/git-master.svg)](https://github.com/Adwait-Borate/git-master/stargazers)

**Download specific folders from GitHub repositories without cloning the entire codebase**

[Installation](#installation) •
[Usage](#usage) •
[Features](#features) •
[Examples](#examples) •
[Configuration](#configuration) •
[Troubleshooting](#troubleshooting) •
[Contributing](#contributing) •
[License](#license)

</div>

## Why Git-master?

Have you ever needed just a single component from a massive repository? Or wanted to reference a specific configuration directory without downloading gigabytes of code? Git-master solves this problem by letting you extract and download only the folders you need, saving bandwidth, time, and disk space.

## Features

- **Selective Downloads**: Fetch specific folders instead of entire repositories
- **Directory Structure**: Preserves complete folder structure
- **Custom Output**: Specify your preferred output directory
- **Branch Support**: Works with any branch, not just the default one
- **Simple Interface**: Clean, intuitive command-line experience
- **Lightweight**: Minimal dependencies and fast execution
- **No Authentication**: Works with public repositories without requiring credentials

## Installation

### Global Installation (Recommended)

```bash
npm install -g git-master
```

This installs Git-master as a global command-line tool accessible from anywhere in your terminal.

### On-demand Usage

```bash
npx git-master <github-folder-url>
```

Run Git-master directly without installation using `npx`.

## Usage

### Basic Command

```bash
git-master https://github.com/username/repository/tree/branch/folder
```

### With Custom Output Directory

```bash
git-master https://github.com/username/repository/tree/branch/folder -o ./my-output-folder
```

### Command Line Options

| Option                     | Description              | Default           |
| -------------------------- | ------------------------ | ----------------- |
| `-o, --output <directory>` | Specify output directory | Current directory |
| `-V, --version`            | Show version number      | -                 |
| `-h, --help`               | Show help                | -                 |

### Commands

| Command                    | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `insights [options] <repo>`| Generate detailed insights for a GitHub repository |
| `audit [options] <repo>`   | Audit dependencies in a GitHub repository        |
| `commits [options] <repo>` | Explore commit history of a GitHub repository    |
| `generate`                 | Generate a project folder structure              |

## Examples

### Extract a Component Library

```bash
# Download React DOM package
git-master https://github.com/facebook/react/tree/main/packages/react-dom
```

### Get Configuration Files

```bash
# Extract VS Code build configuration
git-master https://github.com/microsoft/vscode/tree/main/build -o ./vscode-build-config
```

### Download Documentation

```bash
# Get Node.js documentation
git-master https://github.com/nodejs/node/tree/main/doc -o ./node-docs
```

### Copy UI Templates

```bash
# Extract Tailwind components
git-master https://github.com/tailwindlabs/tailwindcss/tree/master/src/components -o ./tailwind-components
```

### Generate Project Folder Structure

```bash
# Generate a project folder structure
git-master generate
```

### Generate Insights for a Repository

```bash
# Generate insights for a repository
git-master insights username/repository
```

### Audit Dependencies in a Repository

```bash
# Audit dependencies in a repository
git-master audit username/repository
```

### Explore Commit History

```bash
# Explore commit history of a repository
git-master commits username/repository
```

## How It Works

Git-master operates in four stages:

1. **URL Parsing**: Extracts repository owner, name, branch, and target folder path
2. **API Request**: Uses GitHub's API to fetch the folder structure
3. **Content Download**: Retrieves each file individually while maintaining directory structure
4. **Local Storage**: Saves files to your specified output directory

## Configuration

Git-master works out of the box without configuration. For rate-limited GitHub API usage, authentication support is under development.

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

**Solution**: Ensure your URL follows the pattern: `https://github.com/owner/repo/tree/branch/folder`

#### Folder Not Found

```
Error: Path not found in repository
```

**Solution**: Verify the folder path exists in the specified branch and repository.

## Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions to Git-master are **greatly appreciated**.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See the [open issues](https://github.com/Adwait-Borate/git-master/issues) for a list of proposed features and known issues.

## Roadmap

- [ ] Add GitHub token authentication
- [ ] Support for GitLab and Bitbucket repositories
- [ ] Download from specific commits or tags
- [ ] Dry run mode
- [ ] File filtering options
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
