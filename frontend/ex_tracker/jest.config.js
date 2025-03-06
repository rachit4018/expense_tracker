module.exports = {
    testMatch: [
      "**/test/**/*.js",       // Look for tests in the `test` directory
      "**/?(*.)+(spec|test).js" // Look for files with .spec.js or .test.js
    ],
    testPathIgnorePatterns: [
      "/node_modules/"  // Ignore node_modules
    ],
  };