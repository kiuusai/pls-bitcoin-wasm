#!/bin/bash

set -e

FILENAME="$(realpath "${BASH_SOURCE[0]}")"
DIRNAME="$(dirname "${FILENAME}")"
PROJECT_DIR="$(realpath "${DIRNAME}/..")"

TARGET="wasm32-unknown-unknown"

WASM_SOURCE="target/${TARGET}/release/pls_bitcoin_wasm.wasm"
OUTPUT="ts/bitcoin"

build_ts() {
  cd "${PROJECT_DIR}"

  jco transpile -mO "${WASM_SOURCE}" -o "${OUTPUT}"
  jco types wit/multisig.wit --name pls_bitcoin_wasm -o "${OUTPUT}"
}

(build_ts)
