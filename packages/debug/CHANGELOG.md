# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.9-rc6-unreleased] - 2023-jul-28 enhancement

-   moved to a build/test system based on `vite` and `vitest` <jkfbogers@gmail.com>
-   introduced eslint + typescript + prettier integration <jkfbogers@gmail.com>
-   added path aliases, making it work with vitest and vite

## [0.0.9-rc5] - 2023-feb-17 fixes

-   documentation references @mangos/debug correctly (@mangos plural)
-   the test program in the README.md imports from "@mangos/debug" (not from "./dist/...")

## [0.0.9-rc2] - 2022-12-16

-   "alpha" releases are now named rcN (release candidate `N`)
-   added design for a log "collapser" (like we find in chrome devtools). See comments in src/index.ts line 262.
-   added this changelog

## [0.0.9-alpha] - 2022-12-01

We're super excited to announce the first release `0.0.9-alpha`
