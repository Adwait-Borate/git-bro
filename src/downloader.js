const axios = require("axios");
const fs = require("fs");
const path = require("path");
const pLimit = require('p-limit').default || require('p-limit');
const cliProgress = require("cli-progress"); // Progress bar

// Set concurrency limit (adjustable based on network performance)
const limit = pLimit(5);

/**
 * Fetches the contents of a folder from a GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} folderPath - Path to the folder
 * @returns {Promise<Array>} - Promise resolving to an array of file objects
 */
const fetchFolderContents = async (owner, repo, branch, folderPath) => {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

    try {
        const response = await axios.get(apiUrl);
        return response.data.tree.filter((item) => item.path.startsWith(folderPath));
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.error(`Repository, branch, or folder not found: ${owner}/${repo}/${branch}/${folderPath}`);
            return [];
        }
        console.error(`Failed to fetch folder contents: ${error.message}`);
        return [];
    }
};

/**
 * Downloads a single file from a GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} filePath - Path to the file
 * @param {string} outputPath - Path where the file should be saved
 * @returns {Promise<Object>} - Object containing download status
 */
const downloadFile = async (owner, repo, branch, filePath, outputPath) => {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;

    try {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, Buffer.from(response.data));
        return { filePath, success: true };
    } catch (error) {
        return { filePath, success: false, error: error.message };
    }
};

module.exports = {
    fetchFolderContents,
    downloadFile,
};