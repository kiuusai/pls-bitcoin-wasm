#!/bin/bash
set -eu

RPC=(
  bitcoin-cli \
  -rpcconnect=127.0.0.1 \
  -rpcport="${RPC_PORT}" \
  -rpcuser="${RPC_USER}" \
  -rpcpassword="${RPC_PASSWORD}"
)

bitcoind_args=( 
  -server=1
  -regtest=1
  -txindex=1
  -rest=1
  -rpcbind=0.0.0.0
  -rpcallowip=0.0.0.0/0
  -fallbackfee=0.00001
  -blockfilterindex=1
  -peerblockfilters=1
  -rpcuser="${RPC_USER}"
  -rpcpassword="${RPC_PASSWORD}"
  -rpcport="${RPC_PORT}"
  -port="${PORT}"
  -wallet="${WALLET}"
)

bitcoind "${bitcoind_args[@]}" "$@" &
PID=$!

trap 'kill -TERM "$PID" 2>/dev/null || true; wait "$PID"' INT TERM

echo "Waiting for Bitcoin Core RPC..."

until "${RPC[@]}" getblockchaininfo >/dev/null 2>&1; do
    if ! kill -0 "$PID" 2>/dev/null; then
        exit 1
    fi
    sleep 1
done

# Create the wallet if it does not exist.
if ! "${RPC[@]}" listwalletdir | grep -q '"name"[[:space:]]*:[[:space:]]*"'"${WALLET}"'"'; then
    echo "Creating ${WALLET} wallet"
    "${RPC[@]}" createwallet "${WALLET}"
fi

# Explicitly load the wallet if necessary.
if ! "${RPC[@]}" listwallets | grep -q '^[[:space:]]*"'"${WALLET}"'"'; then
    "${RPC[@]}" loadwallet "${WALLET}" true
fi

if "${RPC[@]}" -rpcwallet="${WALLET}" getwalletinfo >/dev/null; then
  echo "Wallet ok"
else
  echo "Wallet not loaded"
  exit 1
fi

wait "$PID"
