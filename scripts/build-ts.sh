#!/bin/bash

set -e

FILENAME="$(realpath "${BASH_SOURCE[0]}")"
DIRNAME="$(dirname "${FILENAME}")"
PROJECT_DIR="$(realpath "${DIRNAME}/..")"
TS_DIR="${PROJECT_DIR}/ts"

TARGET="wasm32-unknown-unknown"

WASM_SOURCE="target/${TARGET}/release/pls_bitcoin_wasm.wasm"
WIT_SOURCE="wit/multisig.wit"
OUTPUT="ts/bitcoin"

build_ts() {
  cd "${PROJECT_DIR}"

  transpile_args=(
    --no-typescript
    --no-component-error-wrapping
    --no-namespaced-exports
    # --minify
    # --optimize
  )

  general_args=(
    --use-namespace-objects
    --strict
  )

  echo "Building web versions..."
  jco transpile --no-nodejs-compat --name pls_bitcoin_wasm_web \
    "${transpile_args[@]}" \
    "${general_args[@]}" \
    "${WASM_SOURCE}" -o "${OUTPUT}"
  jco types --name pls_bitcoin_wasm_web \
    "${general_args[@]}" \
    "${WIT_SOURCE}" -o "${OUTPUT}"

  echo "Building node versions..."
  jco transpile --name pls_bitcoin_wasm_node \
    "${transpile_args[@]}" \
    "${general_args[@]}" \
    "${WASM_SOURCE}" -o "${OUTPUT}"
  jco types --name pls_bitcoin_wasm_node \
    "${general_args[@]}" \
    "${WIT_SOURCE}" -o "${OUTPUT}"

  cd "${TS_DIR}"

  npm run build
}

(build_ts)
