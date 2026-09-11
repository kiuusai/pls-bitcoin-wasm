#!/bin/bash

set -e

FILENAME="$(realpath "${BASH_SOURCE[0]}")"
DIRNAME="$(dirname "${FILENAME}")"
PROJECT_DIR="$(realpath "${DIRNAME}/..")"

WASM_SOURCE="target/wasm32-unknown-unknown/release/pls_bitcoin_wasm.wasm"
OUTPUT="ts/bitcoin"

build_ts() {
  cd "${PROJECT_DIR}"

  jco transpile -mO "${WASM_SOURCE}" -o "${OUTPUT}"
}

(build_ts)
