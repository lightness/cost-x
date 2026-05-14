module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest',{
      useESM: true,
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!google-spreadsheet/dist/index.cjs)',
    'node_modules/(?!ky/distribution/index.js)'
  ],
};