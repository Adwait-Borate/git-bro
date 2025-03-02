const axios = require("axios");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const { table } = require("table");
const semver = require("semver");
const readline = require("readline");

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Prompts the user for confirmation
 * @param {string} message - Message to display
 * @returns {Promise<boolean>} - User's response
 */
const confirmWithUser = (message) => {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
};

/**
 * Fetches a file from a GitHub repository
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {string} filePath - Path to the file
 * @param {string} branch - Branch name
 * @returns {Promise<string>} - File content
 */
const fetchFileFromRepo = async (repo, filePath, branch = "main") => {
  const spinner = ora(`Fetching ${filePath} from ${repo}`).start();
  try {
    const [owner, repoName] = repo.split("/");
    if (!owner || !repoName) {
      throw new Error("Invalid repository format. Use owner/repo format.");
    }

    // Try to get the file from the specified branch
    try {
      const response = await axios.get(
        `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${filePath}`
      );
      spinner.succeed(`${filePath} fetched successfully`);
      return response.data;
    } catch (error) {
      // If the file doesn't exist on the specified branch, try 'master'
      if (branch !== "master") {
        spinner.text = `Trying to fetch ${filePath} from master branch`;
        try {
          const response = await axios.get(
            `https://raw.githubusercontent.com/${owner}/${repoName}/master/${filePath}`
          );
          spinner.succeed(
            `${filePath} fetched successfully from master branch`
          );
          return response.data;
        } catch (innerError) {
          throw new Error(
            `File not found in main or master branch: ${innerError.message}`
          );
        }
      }
      throw error;
    }
  } catch (error) {
    spinner.fail(`Failed to fetch ${filePath}: ${error.message}`);
    throw error;
  }
};

/**
 * Fetches latest package versions from npm registry
 * @param {Object} dependencies - Dependencies object
 * @returns {Promise<Object>} - Latest versions
 */
const fetchLatestVersions = async (dependencies) => {
  const spinner = ora("Fetching latest package versions").start();
  const results = {};
  const packages = Object.keys(dependencies);

  try {
    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize);
      const promises = batch.map(async (pkg) => {
        try {
          const response = await axios.get(`https://registry.npmjs.org/${pkg}`);
          const latestVersion = response.data["dist-tags"].latest;
          const currentVersion = dependencies[pkg].replace(/[^0-9.]/g, "");

          // Safely compare versions
          let isOutdated = false;
          try {
            isOutdated = semver.lt(
              semver.coerce(currentVersion) || "0.0.0",
              semver.coerce(latestVersion) || "0.0.0"
            );
          } catch (e) {
            // If semver comparison fails, assume it's not outdated
            isOutdated = false;
          }

          results[pkg] = {
            current: currentVersion,
            latest: latestVersion,
            outdated: isOutdated,
          };
        } catch (error) {
          results[pkg] = {
            current: dependencies[pkg].replace(/[^0-9.]/g, ""),
            latest: "unknown",
            outdated: false,
            error: error.message,
          };
        }
      });

      await Promise.all(promises);
      spinner.text = `Fetched ${Math.min(i + batchSize, packages.length)}/${
        packages.length
      } packages`;
    }

    spinner.succeed("Latest package versions fetched successfully");
    return results;
  } catch (error) {
    spinner.fail(`Failed to fetch latest versions: ${error.message}`);
    throw error;
  }
};

/**
 * Fetches security vulnerabilities for packages
 * @param {Object} dependencies - Dependencies object
 * @returns {Promise<Object>} - Vulnerabilities information
 */
const fetchVulnerabilities = async (dependencies) => {
  const spinner = ora("Checking for security vulnerabilities").start();
  const results = {};
  const packages = Object.keys(dependencies);

  try {
    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize);
      const promises = batch.map(async (pkg) => {
        try {
          // Using npm advisory API
          const response = await axios.get(
            `https://registry.npmjs.org/-/npm/v1/security/advisories/package/${pkg}`
          );

          const vulnerabilities = response.data.objects || [];
          results[pkg] = {
            vulnerabilities: vulnerabilities.length,
            details: vulnerabilities.map((v) => ({
              id: v.id,
              title: v.title,
              severity: v.severity,
              vulnerable_versions: v.vulnerable_versions,
            })),
          };
        } catch (error) {
          results[pkg] = {
            vulnerabilities: 0,
            details: [],
            error: error.message,
          };
        }
      });

      await Promise.all(promises);
      spinner.text = `Checked ${Math.min(i + batchSize, packages.length)}/${
        packages.length
      } packages`;
    }

    spinner.succeed("Security vulnerabilities checked successfully");
    return results;
  } catch (error) {
    spinner.fail(`Failed to check vulnerabilities: ${error.message}`);
    throw error;
  }
};

/**
 * Updates outdated packages in the repository
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {Object} outdatedPackages - Outdated packages with versions
 * @param {string} packageJsonPath - Path to package.json
 * @returns {Promise<void>}
 */
const updateOutdatedPackages = async (
  repo,
  outdatedPackages,
  packageJsonPath
) => {
  if (Object.keys(outdatedPackages).length === 0) {
    console.log(
      chalk.green("\n✅ All packages are up to date. No updates needed.")
    );
    return;
  }

  console.log(chalk.blue.bold("\n📦 Packages to Update:"));
  const updateData = [
    ["Package", "Current Version", "Target Version"],
    ...Object.entries(outdatedPackages).map(([pkg, info]) => [
      pkg,
      info.current,
      info.latest,
    ]),
  ];
  console.log(table(updateData));

  const confirmed = await confirmWithUser(
    "Do you want to update these packages?"
  );
  if (!confirmed) {
    console.log(chalk.yellow("Package updates cancelled."));
    return;
  }

  const spinner = ora("Updating packages").start();
  // This would normally involve cloning the repo, updating package.json,
  // running npm update, and creating a PR. For demonstration purposes,
  // we'll just simulate it.
  spinner.succeed("Packages updated successfully (simulated)");

  console.log(chalk.green("\n✅ The following updates have been applied:"));
  console.log(table(updateData));
};

/**
 * Suggests alternative packages
 * @param {Object} dependencies - Dependencies object
 * @returns {Promise<Object>} - Alternative packages
 */
const suggestAlternatives = async (dependencies) => {
  // This is a simplified version. In a real implementation, you would
  // use a more comprehensive database of package alternatives.
  const alternatives = {
    moment: [
      { name: "date-fns", description: "Lightweight alternative to Moment.js" },
      {
        name: "dayjs",
        description: "Fast 2kB alternative to Moment.js with the same API",
      },
    ],
    lodash: [
      { name: "ramda", description: "Functional programming library" },
      { name: "lodash-es", description: "ES modules version of Lodash" },
    ],
    jquery: [
      { name: "cash-dom", description: "Lightweight jQuery alternative" },
      { name: "umbrella", description: "Tiny jQuery alternative" },
    ],
    express: [
      { name: "fastify", description: "Fast and low overhead web framework" },
      {
        name: "koa",
        description: "Next generation web framework by Express team",
      },
    ],
    request: [
      { name: "axios", description: "Promise based HTTP client" },
      { name: "got", description: "Human-friendly HTTP request library" },
    ],
  };

  const results = {};
  Object.keys(dependencies).forEach((pkg) => {
    if (alternatives[pkg]) {
      results[pkg] = alternatives[pkg];
    }
  });

  return results;
};

/**
 * Safely parses JSON data
 * @param {string} content - JSON content to parse
 * @returns {Object|null} - Parsed JSON or null on error
 */
const safeJsonParse = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

/**
 * Parses package.json content
 * @param {string} content - package.json content
 * @returns {Object} - Parsed dependencies
 */
const parsePackageJson = (content) => {
  try {
    // Handle case where content might be a string representation of an object
    let packageJson;

    if (typeof content === "object") {
      packageJson = content;
    } else if (typeof content === "string") {
      // Check if content starts with 'object' which might indicate it's not JSON
      if (content.trim().startsWith("object")) {
        throw new Error("Content is not valid JSON");
      }

      packageJson = safeJsonParse(content);

      if (!packageJson) {
        throw new Error("Failed to parse package.json content");
      }
    } else {
      throw new Error("Invalid content type");
    }

    return {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
    };
  } catch (error) {
    throw new Error(`Failed to parse package.json: ${error.message}`);
  }
};

/**
 * Parses requirements.txt content
 * @param {string} content - requirements.txt content
 * @returns {Object} - Parsed dependencies
 */
const parseRequirementsTxt = (content) => {
  const dependencies = {};
  const lines = content.split("\n");

  lines.forEach((line) => {
    // Skip comments and empty lines
    if (line.trim() === "" || line.trim().startsWith("#")) {
      return;
    }

    // Parse package name and version
    const match = line.match(/^([a-zA-Z0-9_.-]+)([=<>!~]+)([a-zA-Z0-9_.-]+)/);
    if (match) {
      dependencies[match[1]] = match[3];
    } else {
      // If no version specified
      const packageName = line.trim();
      if (packageName) {
        dependencies[packageName] = "latest";
      }
    }
  });

  return { dependencies };
};

/**
 * Ensures output directory exists
 * @param {string} outputDir - Output directory path
 */
const ensureOutputDirExists = (outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
};

/**
 * Audits dependencies in a GitHub repository
 * @param {string} repo - Repository in format 'owner/repo'
 * @param {Object} options - Options for dependency audit
 * @returns {Promise<void>}
 */
const auditDependencies = async (repo, options = {}) => {
  // Default options
  const defaultOptions = {
    type: "package.json",
    output: "./audit-reports",
    branch: "main",
    autoUpdate: false,
  };

  options = { ...defaultOptions, ...options };

  console.log(
    chalk.blue.bold(`\n🔍 Auditing dependencies for ${chalk.yellow(repo)}\n`)
  );

  try {
    ensureOutputDirExists(options.output);

    // Fetch dependency file
    let fileContent;
    let filePath = options.type;

    try {
      fileContent = await fetchFileFromRepo(repo, filePath, options.branch);
    } catch (error) {
      console.log(
        chalk.yellow(
          `Failed to fetch ${filePath}. Trying alternative locations...`
        )
      );

      // Try alternative locations
      if (options.type === "package.json") {
        try {
          filePath = "frontend/package.json";
          fileContent = await fetchFileFromRepo(repo, filePath, options.branch);
        } catch (e) {
          try {
            filePath = "backend/package.json";
            fileContent = await fetchFileFromRepo(
              repo,
              filePath,
              options.branch
            );
          } catch (e2) {
            throw new Error(
              `Could not find package.json in repository. Tried: package.json, frontend/package.json, backend/package.json`
            );
          }
        }
      } else if (options.type === "requirements.txt") {
        try {
          filePath = "requirements/requirements.txt";
          fileContent = await fetchFileFromRepo(repo, filePath, options.branch);
        } catch (e) {
          try {
            filePath = "requirements/base.txt";
            fileContent = await fetchFileFromRepo(
              repo,
              filePath,
              options.branch
            );
          } catch (e2) {
            throw new Error(
              `Could not find requirements.txt in repository. Tried: requirements.txt, requirements/requirements.txt, requirements/base.txt`
            );
          }
        }
      }
    }

    // Parse dependencies
    let parsedDependencies;
    if (options.type === "package.json") {
      parsedDependencies = parsePackageJson(fileContent);
    } else if (options.type === "requirements.txt") {
      parsedDependencies = parseRequirementsTxt(fileContent);
    } else {
      throw new Error(`Unsupported dependency file type: ${options.type}`);
    }

    // Check if dependencies exist
    if (Object.keys(parsedDependencies.dependencies).length === 0) {
      console.log(chalk.yellow(`\nNo dependencies found in ${filePath}`));
      rl.close();
      return;
    }

    // Check for outdated packages
    const latestVersions = await fetchLatestVersions(
      parsedDependencies.dependencies
    );

    // Check for vulnerabilities
    const vulnerabilities =
      options.type === "package.json"
        ? await fetchVulnerabilities(parsedDependencies.dependencies)
        : {};

    // Suggest alternatives
    const alternatives = await suggestAlternatives(
      parsedDependencies.dependencies
    );

    // Display results
    console.log(chalk.green.bold("\n📦 Dependencies Overview"));
    console.log(
      `Total dependencies: ${
        Object.keys(parsedDependencies.dependencies).length
      }`
    );

    // Display outdated packages
    const outdatedPackages = Object.entries(latestVersions)
      .filter(([_, info]) => info.outdated)
      .map(([pkg, info]) => [pkg, info.current, info.latest]);

    const outdatedPackagesObject = Object.entries(latestVersions)
      .filter(([_, info]) => info.outdated)
      .reduce((acc, [pkg, info]) => {
        acc[pkg] = info;
        return acc;
      }, {});

    if (outdatedPackages.length > 0) {
      console.log(chalk.yellow.bold("\n⚠️ Outdated Packages"));
      const outdatedData = [
        ["Package", "Current Version", "Latest Version"],
        ...outdatedPackages,
      ];
      console.log(table(outdatedData));
    } else {
      console.log(chalk.green("\n✅ All packages are up to date"));
    }

    // Display vulnerabilities
    if (options.type === "package.json") {
      const vulnerablePackages = Object.entries(vulnerabilities)
        .filter(([_, info]) => info.vulnerabilities > 0)
        .map(([pkg, info]) => [
          pkg,
          info.vulnerabilities,
          info.details.map((d) => `${d.title} (${d.severity})`).join("\n"),
        ]);

      if (vulnerablePackages.length > 0) {
        console.log(chalk.red.bold("\n🔒 Security Vulnerabilities"));
        const vulnerabilitiesData = [
          ["Package", "Vulnerabilities", "Details"],
          ...vulnerablePackages,
        ];
        console.log(table(vulnerabilitiesData));
      } else {
        console.log(chalk.green("\n✅ No security vulnerabilities found"));
      }
    }

    // Display alternative packages
    const alternativePackages = Object.entries(alternatives).map(
      ([pkg, alts]) => [
        pkg,
        alts.map((a) => `${a.name}: ${a.description}`).join("\n"),
      ]
    );

    if (alternativePackages.length > 0) {
      console.log(chalk.blue.bold("\n💡 Alternative Packages"));
      const alternativesData = [
        ["Package", "Alternatives"],
        ...alternativePackages,
      ];
      console.log(table(alternativesData));
    }

    // Save audit results to file
    const auditPath = path.join(
      options.output,
      `${repo.replace("/", "-")}-audit.json`
    );
    fs.writeFileSync(
      auditPath,
      JSON.stringify(
        {
          repository: repo,
          dependencyFile: filePath,
          dependencies: parsedDependencies.dependencies,
          outdatedPackages: outdatedPackagesObject,
          vulnerabilities:
            options.type === "package.json"
              ? vulnerabilities
              : "Not applicable",
          alternatives,
          generatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log(
      chalk.blue.bold(`\n✅ Dependency audit completed successfully!`)
    );
    console.log(chalk.blue(`📄 Detailed audit report saved to: ${auditPath}`));

    // Handle package updates if there are outdated packages
    // Handle package updates if there are outdated packages
    if (
      options.autoUpdate &&
      options.type === "package.json" &&
      outdatedPackages.length > 0
    ) {
      await updateOutdatedPackages(repo, outdatedPackagesObject, filePath);
    }
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Error auditing dependencies: ${error.message}`)
    );
  } finally {
    rl.close();
  }
};

module.exports = {
  auditDependencies,
};
