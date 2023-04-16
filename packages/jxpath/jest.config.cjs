const testRegex = [
    //'src/tokenizer/__test__/tokenizer.test.ts',
    'src/tokenizer/__test__/regexpTokenizer.test.ts',
    'src/tokenizer/__test__/identifierTokenizer.test.ts'
];

const collectCoverageFrom = ['src/**/*.ts'];

module.exports = {
    automock: false,
    collectCoverage: true,
    maxWorkers: '1',
    collectCoverageFrom,
    coveragePathIgnorePatterns: ['node_modules', 'dist'],
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
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
