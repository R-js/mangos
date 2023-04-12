
const testRegex = [

];

const collectCoverageFrom = [
    'src/lib/**/*.ts',
];

module.exports = {
    automock: false,
    collectCoverage: true,
    maxWorkers: "50%",
    collectCoverageFrom,
    coveragePathIgnorePatterns: ['node_modules', 'test'],
    coverageDirectory: 'coverage',
    coverageProvider: 'babel', //"v8" is still experimental, but use "v8" for walk through debugging
    //coverageProvider: 'v8', //"v8" is still experimental, but use "v8" for walk through debugging
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    cacheDirectory: '.jest-cache',
    testPathIgnorePatterns: ['/esm/', '/commonjs/', '/types/'],
    //testMatch: ['**/__tests__/**/*.[t]s?(x)', '**/?(*.)+(spec|test).[t]s?(x)'],
    testRegex,
    transform: {
        "\\.test\\.ts$": ["ts-jest", {
            compiler: 'typescript',
            tsconfig: 'tsconfig.json',
            diagnostics: {
                ignoreCodes: [151001],
            },
        }]
    },
    moduleNameMapper: {,
        '^@lib/(.*)$': '<rootDir>/src/lib/$1',
        '^lib/(.*)$': '<rootDir>/src/lib/$1'
    },
    //setupFiles: [
    //    '<rootDir>/src/packages/__test__/jest-ext.d.ts'
    //],
    setupFilesAfterEnv: [
        '<rootDir>/src/setupTestEnv.ts',
        //'<rootDir>/src/packages/__test__/mock-of-debug.ts'
    ],
};


