# 🚀 git-bro

<div align="center">

[![NPM version](https://img.shields.io/npm/v/git-bro.svg?style=for-the-badge&logo=npm&color=red)](https://www.npmjs.com/package/git-bro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Downloads](https://img.shields.io/npm/dm/git-bro.svg?style=for-the-badge&logo=npm&color=blue)](https://www.npmjs.com/package/git-bro)
[![GitHub issues](https://img.shields.io/github/issues/Adwait-Borate/git-bro.svg?style=for-the-badge&logo=github)](https://github.com/Adwait-Borate/git-bro/issues)
[![GitHub stars](https://img.shields.io/github/stars/Adwait-Borate/git-bro.svg?style=for-the-badge&logo=github&color=gold)](https://github.com/Adwait-Borate/git-bro/stargazers)

**🔍 Get comprehensive insights, audit dependencies, and explore commit history for any GitHub repository without cloning the entire codebase!**

[📦 Installation](#-installation) •
[🎯 Usage](#-usage) •
[✨ Features](#-features) •
[💡 Examples](#-examples) •
[⚙️ Configuration](#-configuration) •
[🛠️ Troubleshooting](#-troubleshooting) •
[🤝 Contributing](#-contributing) •
[📄 License](#-license)

</div>

---

## 🎯 Why git-bro?

Ever wanted to quickly analyze a GitHub repository without downloading gigabytes of code? **git-bro** is your ultimate companion! 🎉

🔥 **Perfect for:**
- 📊 **DevOps Engineers** - Quick repository insights and dependency audits
- 👩‍💻 **Developers** - Understanding project structure before contributing  
- 🔍 **Security Analysts** - Identifying vulnerable dependencies
- 📈 **Project Managers** - Getting team productivity insights
- 🎓 **Students** - Learning from open source projects

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📊 **Repository Insights**
- 🏆 Detailed repository statistics
- 👥 Top contributors analysis  
- 📈 Commit activity trends
- 🌟 Stars, forks, and engagement metrics
- 📅 Repository timeline analysis

</td>
<td width="50%">

### 🔍 **Dependency Audit**
- 🚨 Security vulnerability detection
- 📦 Outdated package identification
- 💡 Alternative package suggestions
- 📋 Comprehensive audit reports
- 🔄 Support for multiple package managers

</td>
</tr>
<tr>
<td width="50%">

### 📝 **Commit Explorer**
- 🌳 Visual commit tree representation
- 👤 Filter by author, file, or type
- 🔀 Merge conflict detection
- 📊 Commit statistics and trends
- 🎯 Advanced filtering options

</td>
<td width="50%">

### 🏗️ **Project Generator**
- ⚡ Frontend (React + Vite + Tailwind)
- 🖥️ Backend (Node.js + Express + MongoDB)
- 🔧 Ready-to-use project structures
- 📁 Best practices included
- 🚀 Production-ready templates

</td>
</tr>
</table>

---

## 📦 Installation

### 🌍 Global Installation (Recommended)

```bash
# Install globally with npm
npm install -g git-bro

# Or with yarn
yarn global add git-bro
```

### ⚡ On-demand Usage

```bash
# Run without installation
npx git-bro <command>
```

---

## 🎯 Usage

### 🔧 Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `-V, --version` | 📋 Show version number | `git-bro --version` |
| `-h, --help` | ❓ Show help information | `git-bro --help` |

### 🚀 Available Commands

<details>
<summary>📊 <strong>Repository Insights</strong></summary>

```bash
git-bro insights <owner/repo> [options]
```

**Options:**
- `-p, --period <period>` - Time period (weekly/monthly) 
- `-o, --output <directory>` - Output directory for reports

**Example:**
```bash
git-bro insights facebook/react --period weekly --output ./reports
```

</details>

<details>
<summary>🔍 <strong>Dependency Audit</strong></summary>

```bash
git-bro audit <owner/repo> [options]
```

**Options:**
- `-t, --type <type>` - File type (package.json, requirements.txt)
- `-o, --output <directory>` - Output directory for reports

**Example:**
```bash
git-bro audit express/express --type package.json --output ./audits
```

</details>

<details>
<summary>📝 <strong>Commit Explorer</strong></summary>

```bash
git-bro commits <owner/repo> [options]
```

**Options:**
- `-a, --author <author>` - Filter by author
- `-f, --file <file>` - Filter by file path  
- `-c, --conflicts` - Show merge conflicts only
- `-l, --limit <number>` - Limit number of commits (default: 50)

**Example:**
```bash
git-bro commits torvalds/linux --author "Linus Torvalds" --limit 100
```

</details>

<details>
<summary>🏗️ <strong>Project Generator</strong></summary>

```bash
git-bro generate
```

Interactive project structure generator with:
- ⚛️ **Frontend**: React + Vite + Tailwind CSS + TypeScript
- 🖥️ **Backend**: Node.js + Express + MongoDB + JWT Auth

</details>

---

## 💡 Examples

### 🎯 Quick Start Examples

```bash
# 📊 Get insights for a popular repository
git-bro insights microsoft/vscode

# 🔍 Audit dependencies with detailed output
git-bro audit facebook/react --output ./my-audits

# 📝 Explore recent commits by a specific author
git-bro commits vuejs/vue --author "Evan You" --limit 20

# 🏗️ Generate a new project structure
git-bro generate
```

### 🔥 Advanced Usage

```bash
# 📊 Weekly activity analysis with custom output
git-bro insights golang/go --period weekly --output ./golang-analysis

# 🚨 Security-focused dependency audit
git-bro audit rails/rails --type package.json --output ./security-reports

# 🔍 Find merge conflicts in commit history
git-bro commits kubernetes/kubernetes --conflicts --limit 50

# 📁 Filter commits affecting specific files
git-bro commits nodejs/node --file "package.json" --limit 30
```

---

## ⚙️ Configuration

git-bro works **out of the box** with zero configuration! 🎉

### 🔑 Optional: GitHub Authentication

For higher rate limits, set up a GitHub token:

```bash
# Set environment variable (optional)
export GITHUB_TOKEN=your_github_token_here
```

> 💡 **Tip**: Without authentication, you get 60 requests/hour. With auth, you get 5000 requests/hour!

---

## 📊 Sample Output

### 📈 Repository Insights
```
📊 Generating insights for facebook/react

📌 Repository Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repository Name    │ react
Stars             │ ⭐ 218,000
Forks             │ 🍴 45,000
Primary Language  │ JavaScript
Open Issues       │ 🐛 1,200

👥 Top Contributors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#1  Adwait B          📊 2,847 commits    Impact: 23%
#2  Shreyash I      📊 1,744 commits    Impact: 14%
#3  Parth B          📊 1,129 commits    Impact: 9%
```

### 🔍 Dependency Audit
```
🔍 Auditing dependencies for express/express

📦 Dependencies Overview
Total dependencies: 31

⚠️ Outdated Packages
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Package         Current    Latest
body-parser     1.19.0     1.20.2
cookie          0.4.1      0.5.0

🔒 Security Vulnerabilities
✅ No security vulnerabilities found

💡 Alternative Packages
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
express    │ fastify: Fast and low overhead web framework
           │ koa: Next generation web framework
```

---

## 🛠️ Troubleshooting

### 🚨 Common Issues & Solutions

<details>
<summary>⚠️ <strong>Rate Limit Exceeded</strong></summary>

**Error:** `Request failed with status code 403`

**💡 Solution:** 
- Wait a few minutes for rate limit reset
- Add GitHub authentication token
- Use `--limit` flag to reduce API calls

</details>

<details>
<summary>❌ <strong>Repository Not Found</strong></summary>

**Error:** `Repository not found`

**💡 Solution:**
- Verify repository name format: `owner/repo`
- Check if repository is public
- Ensure correct spelling

</details>

<details>
<summary>🔧 <strong>Installation Issues</strong></summary>

**Error:** Permission denied or npm errors

**💡 Solution:**
```bash
# For permission issues on macOS/Linux
sudo npm install -g git-bro

# Or use nvm to manage Node versions
nvm use node
npm install -g git-bro
```

</details>

---

## 🤝 Contributing

We ❤️ contributions! Here's how you can help make git-bro even better:

### 🚀 Quick Start

1. **🍴 Fork** the repository
2. **🌿 Create** your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **💻 Make** your changes
4. **✅ Test** your changes
5. **📝 Commit** your changes
   ```bash
   git commit -m '✨ Add amazing feature'
   ```
6. **🚀 Push** to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
7. **🎉 Open** a Pull Request

### 💡 Ideas for Contributions

- 🌟 Add support for GitLab and Bitbucket
- 📊 Implement more visualization options
- 🔐 Add advanced security scanning
- 🌍 Add internationalization support
- 📱 Create a web interface
- 🎨 Improve CLI user experience

### 🐛 Found a Bug?

Please [open an issue](https://github.com/Adwait-Borate/git-bro/issues) with:
- 📝 Clear description of the problem
- 🔄 Steps to reproduce
- 💻 Your environment details
- 📷 Screenshots (if applicable)

---

## 🗺️ Roadmap

### 🚧 Coming Soon

- [ ] 🔐 GitHub token authentication
- [ ] 🦊 GitLab and Bitbucket support  
- [ ] 📊 Interactive web dashboard
- [ ] 🏷️ Download from specific tags/commits
- [ ] 🧪 Dry run mode for safer operations
- [ ] 🎨 Enhanced CLI with interactive menus
- [ ] 📈 Advanced analytics and metrics
- [ ] 🤖 AI-powered code insights
- [ ] 📱 Mobile app companion
- [ ] 🔄 Real-time repository monitoring

### 💭 Future Ideas

- 🌐 Browser extension
- 📧 Email digest reports  
- 🔔 Slack/Discord integrations
- 📊 Custom dashboard creation
- 🤝 Team collaboration features

---

## 📊 Stats & Recognition

<div align="center">

![GitHub contributors](https://img.shields.io/github/contributors/Adwait-Borate/git-bro?style=for-the-badge&color=blue)
![GitHub last commit](https://img.shields.io/github/last-commit/Adwait-Borate/git-bro?style=for-the-badge&color=green)
![GitHub repo size](https://img.shields.io/github/repo-size/Adwait-Borate/git-bro?style=for-the-badge&color=orange)

</div>

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - feel free to use this project for any purpose! 🎉
```

---

## 🙏 Acknowledgments

### 💝 Special Thanks

- 🚀 **GitHub API** - For making this tool possible
- 🌟 **Open Source Community** - For continuous feedback and support
- 💻 **Contributors** - Everyone who has helped improve git-bro
- 📚 **Stack Overflow** - For solving countless development challenges

### 🛠️ Built With

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![GitHub API](https://img.shields.io/badge/GitHub%20API-181717?style=for-the-badge&logo=github&logoColor=white)

</div>

---

<div align="center">

### 🎉 Made with ❤️ by

**[Adwait Borate](https://github.com/Adwait-Borate)** & **[Shreyash Ingle](https://github.com/ShreyashIngle)**


*"Making repository analysis simple, one command at a time."* ✨

</div>
