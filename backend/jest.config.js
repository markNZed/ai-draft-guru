// jest.config.js

export default {
  transform: {
    "^.+\\.mjs$": "babel-jest", // Use Babel to transform .mjs files
  },
  moduleFileExtensions: ['js', 'mjs'], // Ensure Jest handles both .js and .mjs
  testEnvironment: 'node', // Ensure you're testing in a Node.js environment
};
