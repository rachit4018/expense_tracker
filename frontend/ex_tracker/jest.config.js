module.exports = {
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  transformIgnorePatterns: [
    "../node_modules/(?!(axios)/)", // ✅ Fix ESM packages like axios
  ],
  moduleFileExtensions: ["js", "jsx"],
};
