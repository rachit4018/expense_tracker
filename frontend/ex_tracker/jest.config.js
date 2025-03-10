module.exports = {
    setupFilesAfterEnv: ["<rootDir>/setupTests.js"], // ✅ Fix path issue
    testEnvironment: "jest-environment-jsdom",
    transform: {
      "^.+\\.jsx?$": "babel-jest"
    },
    transformIgnorePatterns: [
      "node_modules/(?!axios)" // Ensure Jest transforms axios
    ],
    moduleNameMapper: {
        axios: 'axios/dist/node/axios.cjs',
    },
  };
  