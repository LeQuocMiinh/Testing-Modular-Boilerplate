module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+.tsx?$': ['ts-jest', {}],
    },
    testMatch: ['<rootDir>/tests/unit/**/*.spec.ts', '<rootDir>/tests/e2e/**/*.e2e-spec.ts'],
    // collectCoverage: true,
    // coverageReporters: ['json', 'html'],
    // coverageDirectory: '<rootDir>/coverage',
    // collectCoverageFrom: [
    //     'src/api/routes/**/*.{ts,tsx}', // Include only route files for coverage
    //     'src/store/repositories/**/*.{ts,tsx}', // Include only repository files for coverage
    //     '!src/**/*.d.ts', // Exclude type declaration files
    //     '!src/**/index.ts', // Exclude index files if necessary
    // ],
};
