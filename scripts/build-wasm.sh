#!/bin/bash

set -e

FILENAME="$(realpath "${BASH_SOURCE[0]}")"
DIRNAME="$(dirname "${FILENAME}")"
PROJECT_DIR="$(realpath "${DIRNAME}/..")"

TARGET="wasm32-unknown-unknown"

compile_wasm() {
  cd "${PROJECT_DIR}"

  cargo component build --target "${TARGET}" --release
}

(compile_wasm)
