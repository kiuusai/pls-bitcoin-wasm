#!/bin/bash

set -e

FILENAME="$(realpath "${BASH_SOURCE[0]}")"
DIRNAME="$(dirname "${FILENAME}")"
PROJECT_DIR="$(realpath "${DIRNAME}/..")"

compile_wasm() {
  cd "${PROJECT_DIR}"

  cargo component build --target wasm32-unknown-unknown --release
}

(compile_wasm)
