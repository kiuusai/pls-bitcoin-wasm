# pls-bitcoin-lib: A Bitcoin multisig contracts constructor

Welcome to Private Law Society (PLS) Bitcoin lib!

This repository contains a JS/TS code for multisig contracts generation with Private Law Society protocol.
It consists in a multisig generator for contracts.

## Bitcoin contracts? Multisig? Why and how?

The objective of this lib is implement a way to create a multisig with Taproot to secure funds for contracts.

It's useful for a great variety of contracts scenarios like:
- Rent contracts
- Selling
- Marriage
- Companies foundation
- Employment
- Others

In this way, you can create a contract with a person and if they want to cheat you, you can activate the preselected arbitrator to resolve your conflict.

Basically we have the following parts:
- Customers (parts/contractors)
- Arbitrators

In both cases, these persons are represented by their public keys.

To unlock UTXO's in a contract multisig you need at least one of the following conditions:
- A signature of each customer
- One customer signature + minimum configured arbitrators signatures

We call this minimum quantity of arbitrators needed to unlock UTXO's as `quorum`.

## Library usage

*"Okay. I understood. So... How to use this lib?"*

### Creating a multisig

If you want to create a contract multisig, you can do something like this:
```typescript
import multisig from "pls-bitcoin-lib";
import type { Network } from "pls-bitcoin-lib";

// List of contractors public keys in compressed format (33 bytes: 32 bytes + parity byte)
const parts: Uint8Array[];

// List of arbitrators public keys in compressed format (33 bytes: 32 bytes + parity byte)
const arbitrators: Uint8Array[];
 
// Minimum arbitrators quantity needed to unlock contract in dispute case
const quorum: number;

// Internal public key used to generate the script.
// It's in compressed format (33 bytes: 32 bytes + parity byte)
// Should be a public key with an unknown private key.
// This field only exists for compatibility purposes.
// It will probably be disabled in future
const internalPubkey: Uint8Array;

// Network that multisig should be generated
// Available options:
// - bitcoin
// - signet
// - testnet
// - testnet4
const network: Network;

const contractMultisig = multisig.createMultisig({
  parts,
  arbitrators,
  quorum,
  internalPubkey,
  network,
});

// Generated address for contract multisig
// Deposit values to be locked here
const address = contractMultisig.address();
```

### Spending UTXO's in multisig

To spend UTXO's in multisig, do something like this:
```typescript
import type { Multisig, Script, Utxo, TxOut, LockTime } from "pls-bitcoin-lib";
import { toXOnly, Psbt } from "bitcoinjs-lib";
import type { ECPairInterface } from "ecpair";

// Constructed multisig
const contractMultisig: Multisig;

// Gets scripts from multisig
const scripts = contractMultisig.scripts();

// Find script that contains the desired key combination in Script.combination
const redeemScript: Script;

// Get UTXO's data from blockchain
const utxos: Utxo[];

// Construct outputs for funds destination
const outs: TxOut[];

// Provide an absolute lock time spending condition
// It can be a timestamp in Unix format (seconds) or a block height
// LockTime enum has functions like Blockheight and Timestamp to help when defining it
const lockTime: LockTime | undefined;

const rawPsbt = contractMultisig.startTxSpending({
  // Script to unlock UTXO's in bytes (Uint8Array)
  redeemScript: redeemScript.leaf,
  // UTXO's to unlock
  utxos,
  // Destination outputs for contracts decisions
  outs,
  // Lock transaction to being mined until it satisfies the lock time condition
  lockTime,
});

const psbt = Psbt.fromBuffer(rawPsbt);

// Get needed keypairs to unlock UTXO's
const keypairs: ECPairInterface[];

// Sign inputs with keypairs signing
for (let keypair of keypairs) psbt.signAllInputs(keypair);

// Finalize all inputs
psbt.finalizeAllInputs();

// Constructed transaction data
const finalTx = psbt.extractTransaction();
```

To see more detailed usage you can check [multisig_works.test.ts](./tests/multisig_works.test.ts) file.

## DISCLAIMER

That's a beta software.
Understand that it's under progressive development and it can have compatibility issues with future protocol versions.
Major updates means protocol incompatibility with older versions.
Middle ones means possible incompatible API definitions or perhaps new developed features.
Also, as any beta project it may susceptible to failues.
We test it rigorously and we have an active community that help us to resolve a lot of issues, but IT REMAINS AS A BETA SOFTWARE.
Use it as your own risk.

By using this software you understand that we (Private Law Society) aren't responsible for any funds losses.
