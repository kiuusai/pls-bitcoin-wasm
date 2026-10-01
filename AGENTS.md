# AGENTS.md

This file defines working guidelines for AI coding agents in this repository

## Project overview
- Name: pls-bitcoin-lib (WASM)
- Code type: WASM rust generator, port for multiple languages
- Rust source code: `src/`
- Target languages:
  - TypeScript:
    - Source code: `ts/`
    - Tests: `ts/tests`
- WASM API definition: `wit/`
- Testing enviroment: `.devcontainer/`
- CI/CD code: `.github/workflows`
- Scripts to build resources:
  - Available to be executed from npm `package.json` on root dir
  - Shell Scripts for each npm script: `scripts/`

## Primary goals for agents
1. Make minimal, focused changes that solves the user request
2. Preserve existing architecture, naming and style conventions
3. Keep multisig execution safe avoiding wrong data parsing and other data transfer issues
4. Validate changes with relevant tests
5. Document each public resource with a short explanation about their usability and if needed, some warning about security checks
6. Search for any possible security issue inside current code and report it immediately

## Safety rules
- Ensure data is being translated to `pls-bitcoin-lib` Rust lib calls correctly
  - pls-bitcoin-lib links:
    - https://docs.rs/pls-bitcoin-lib
    - https://crates.io/crates/pls-bitcoin-lib
- Ensure error handlings are being correctly parsed to 
- Any code change should pass in E2E tests for each target language
- Consider Rust code the source of thuth. Other languages code should be considered only a compatibility shell for WASM files

## Editing guidelines
- Prefer small diffs over broad refactors
- Rust source:
  - Prefer define variable type at start instead of on method execuction in cases it's required static typing
  - Use shortest path for variable definitions every time it's possible
- Match existing coding patterns before introducing new abstractions
- Add brief comments only for non obviously logic
- Update docs when behavior, flows, or developer commands change

## Testing expectations
- Tests are only changed where explicitly code logic & API definition are modified
- Tests cannot bypass current code logic flow unless explicitly required
- Tests or any code gen NEVER can bypass API definitions
- If specific test doesn't exists, create one that satisfies the functionality necessity
- Avoid adding environment variables. If needed, put a coherent default value on this

## Regtest and local infra
Each target language has their own E2E tests coverage

- Run E2E tests inside a `devcontainer`. User should have installed `devcontainers-cli` or `devpod` to execute it
- Tests should successfully runs inside a fresh devcontainer install

## Workflow for agents
1. Read the request and inspect only relevant files
2. Propose or apply minimal changes
3. Summarize what changed, validation performed and residual risks

## Commit guidance
- Keep commits atomic and descriptive
- Group related code, tests and docs in the same commit
- Avoid mixing unrelated cleanups with functional changes

## Definition of done
A tasks is completed when:
1. The requested behavior is implemented
2. Relevant checks/tests pass or failures are explained and resolved
3. No obvious regression are introduced in nearby flows
4. Documentation is updated when needed
