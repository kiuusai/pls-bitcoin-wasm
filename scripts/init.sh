#!/bin/bash

# This script is strictly for first setup in your devcontainer
# or your development environment.
# Ensure you have asdf installed if you want to run it outside devcontainer

set -e

FILENAME="$(realpath "${BASH_SOURCE[0]}")"
DIRNAME="$(dirname "${FILENAME}")"
PROJECT_DIR="$(realpath "${DIRNAME}/..")"

install_plugins() {
  plugins=(
    rust
    nodejs
    golang
  )

  for plugin in "${plugins[@]}";
  do
    asdf plugin add "${plugin}"
  done
}

install_asdf_deps() {
  cd "${PROJECT_DIR}"

  asdf install
}

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

install_npm_deps() {
  cd "${PROJECT_DIR}"

  npm install
}

main() {
  (install_plugins)
  (install_asdf_deps)
  (install_cargo_deps)
  (install_npm_deps)
}

main
