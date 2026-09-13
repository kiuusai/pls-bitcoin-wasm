# WASM port for PLS (Private Law Society) Bitcoin lib

Welcome to WASM port for Private Law Society (PLS) Bitcoin lib!

This repository contains a port of [pls-bitcoin-lib](https://crates.io/pls-bitcoin-lib) to the following languages:
- TypeScript

It consists in a multisig generator for contracts. Now, available as a WASM component with [WIT (WebAssembly Interface Type)](https://component-model.bytecodealliance.org/)
It means that it's easier (easier, not easy) to port it with a strong definition for other languages.

## DISCLAIMER

That's a beta software.
Understand that it's under progressive development and it can have compatibility issues with future protocol versions.
Major updates means protocol incompatibility with older versions.
Middle ones means possible incompatible API definitions or perhaps new developed features.
Also, as any beta project it may susceptible to failues.
We test it rigorously and we have an active community that help us to resolve a lot of issues, but IT REMAINS AS A BETA SOFTWARE.
We can ensure that it works. But we can't do the same with your intelligence.
Use it as your own risk.

By using this software you understand that we (Private Law Society) aren't responsible for any funds losses.

## Help us contributing (First steps to develop)

This project uses some technologies to help developers reduces the friction when startin development.
Every tool used here are optional. But all help you develop faster. So consider using them.

See a resume of environment helpers:
- [Devcontainers](#devcontainers)
- [ASDF](#asdf)
- [Nigiri (inside Devcontainers)](#nigiri-inside-devcontainers)

Also, see some topics to work with this project:
- [Project API definition](#project-api-definition)
- [Building resources](#building-resources)
- [Automated tests](#automated-tests)

### Devcontainers

This project was developed using [Devcontainers](https://containers.dev/).
It means you can simply up the project devcontainer and get hands dirty.

For a vscode instance just install devcontainers extension and start the work.
If you is a NeoVIM rat you can use [`devcontainers-cli`](https://github.com/devcontainers/cli) to up containers and start work with it directly from terminal.

#### Why devcontainers?

There are some reasons to use Devcontainers here.
Such as:
- Preconfigured and replicable environment for every contributer.
- No "works on my machine"
- Patternized environment for e2e tests, build and publish

#### Installing `devcontainers-cli` with [NPM](https://github.com/npm/cli)

With NPM package manager, install `devcontainers-cli`:
```bash
npm install -g @devcontainers/cli
```

#### Starting devcontainers

Up project devcontainers.

```bash
devcontainer up
```
It should create devcontainers and up it into Docker instances.

Then enter in development container:
```bash
devcontainer exec bash # Or your prefered shell instance such as ZSH or FISH
```

To exit, just enter `exit` or press `Ctrl+D`.

`IMPORTANT`: You should have Docker and Docker Compose installed on your machine.

### ASDF

This project contains a [`.tool-versions`](./.tool-versions) file.
It's a version descriptor for [ASDF](https://github.com/asdf-vm/asdf) version manager.
It means you can use ASDF to download the exactly Rust and NodeJS toolkit versions that was used for develop it.
ASDF is a very flexible version manager.
It works managing versions for a lot of language sets.
So, you can work with some projects each one containing their own `.tool-versions` ensuring that the correct version for that language has being used.
Consider using it for your own personal projects.

#### Installing ASDF

The easiest way to install ASDF is with Golang:

```bash
go install github.com/asdf-vm/asdf/cmd/asdf@v0.20.0
```

#### Configuring to current project

Just follow the steps below:

Install rust plugin:
```bash
asdf plugin add rust

```

In project root install tools: 
```bash
asdf install
```

### Nigiri (inside Devcontainers)

[Nigiri](https://github.com/vulpemventures/nigiri) are being used as a helper to e2e tests.
It's installed in devcontainers and it's necessary to run e2e tests correctly.

#### Using Nigiri

Inside devcontainer you can start Nigiri by just doing:
```bash
nigiri start
```

To prune Nigiri data you can stop it with `--delete` flag:
```bash
nigiri stop --delete
```

### Project API definition

This project uses [WIT (WebAssembly Interface Type)](https://component-model.bytecodealliance.org/) to define API usage and creates WASM component properly.
The file that defines structures, errors, functions operations and so on is `wit/multisig.wit`.
You can check it to understand how files are generated.

By default, generated JS files aren't saved in Git because they are minified and optmized.
The only generated files that persists in Git repository are the TS definitions for package documentation purposes.

### Building resources

#### Build WASM files only

If you want to just build `.wasm` files you can run in root folder:
```bash
./scripts/build-wasm.sh
```
Or manually do the following:
```bash
cargo component build --target wasm32-unknown-unknown --release
```
They're equivalent.

You also can use `npm` to do it:
```bash
npm run build
```

The WASM files will be generated in `target/wasm32-unknown-unknown/release/pls_bitcoin_wasm.wasm`

#### Build WASM files + TypeScript API

To build WASM files with TypeScript API definitions you should do the following in root directory:
```bash
npm run build:ts
```
It will 

### Automated tests

#### DISCLAIMER

You need nigiri instance started to run automated tests.
See [Nigiri (inside Devcontainers)](#nigiri-inside-devcontainers) for more information.

#### Executing automated tests

At moment you can execute e2e tests for TS generated files by entering in `ts` folder and executing:
```bash
npm run test
```

#### IMPORTANT

The API files are generated automatically but it doesn't means tests are unnecessary.
e2e tests are necessary to asserts that everything are running as expected and correctly compiled.
Consider creating new tests and NEVER despite them.
