#!/bin/bash

# This script it's strictly to being used to configure Devcontainers.
# Do not try to run it manually without understanding what are you doing.

set -e

install_cargo_deps() {
  sudo apt update && sudo apt install build-essential clang

  rustup target add wasm32-unknown-unknown

  tools=(
    cargo-component
    wit-bindgen-cli
    wat_server
    wasm-tools
  )

  cargo install --locked "${tools[@]}"
}

main() {
  (install_cargo_deps)
}

main
