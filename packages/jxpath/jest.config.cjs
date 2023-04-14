const testRegex = ['src/tokenizer/__test__/tokenizer.test.ts'];

const collectCoverageFrom = ['src/**/*.ts'];

module.exports = {
    automock: false,
    collectCoverage: true,
    maxWorkers: '50%',
    collectCoverageFrom,
    coveragePathIgnorePatterns: ['node_modules', 'dist'],
    coverageDirectory: 'coverage',
    coverageProvider: 'babel',
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    cacheDirectory: '.jest-cache',
    testPathIgnorePatterns: ['/dist/', '/node_modules/'],
    testRegex,
    transform: {
        '\\.test\\.ts$': [
            'ts-jest',
            {
                compiler: 'typescript',
                tsconfig: 'tsconfig.json',
                diagnostics: {
                    ignoreCodes: [151001]
                }
            }
        ]
    }
};
