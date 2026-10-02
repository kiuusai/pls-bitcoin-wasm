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

// Each public key can be x-only (32 bytes) or compressed (33 bytes).
const parts: Uint8Array[];

// Compressed keys are converted to x-only keys during multisig creation.
const arbitrators: Uint8Array[];
 
// Minimum arbitrators quantity needed to unlock contract in dispute case
const quorum: number;

// Internal key can be x-only (32 bytes) or compressed (33 bytes).
// An x-only internal key is interpreted as even parity (prefix 0x02).
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

// The internal key and every key in scripts().combination are returned as
// x-only public keys: 32 bytes without the compressed-key parity byte.
const internalKey: Uint8Array = contractMultisig.internalKey();
const scriptKeys: Uint8Array[] = contractMultisig.scripts()[0].combination;
```

Each `parts` and `arbitrators` key can be an x-only key (32 bytes) or a
compressed key (33 bytes). Compressed inputs are converted to x-only form for
multisig creation. `internalPubkey` also accepts either format; when supplied
as a 32-byte x-only key, it is interpreted as the even-parity point (the
compressed key prefix is `0x02`). Public keys returned by `internalKey()` and
`scripts().combination` are always x-only keys (32 bytes).

### Error handling

WIT errors are thrown as tagged objects. Check the `tag` field to handle a
specific error; variants with a string payload also include a `val` field.

`createMultisig()` can throw:
- `parts`, `arbitrators`, or `internal-pubkey`
  - For: invalid keys
- `quorum-zero`
  - For: a zero quorum
- `arbitrator-is-part`
  - When: a key appears in both lists
- `duplicate-part` or `duplicate-arbitrator`
  - When: a key repeats within its own list
  - The `val` field contains the duplicate x-only key

`startTxSpending()` can throw:
- `utxo`, `out`,`lock-time`
  - For: invalid spending data
- `script-not-found`
- When: the redeem script is not a leaf in the multisig's Taproot tree

See an error handling example:

```typescript
import type { MultisigError } from "pls-bitcoin-lib";

try {
  const contractMultisig = multisig.createMultisig(data);
} catch (error) {
  if (typeof error === "object" && error !== null && "tag" in error) {
    const err: MultisigError = error as any;
    // Handle the tagged WIT error variant.
  }
}
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

// Find script that contains the desired x-only key combination in Script.combination
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

// Get needed keypairs by matching each 32-byte x-only key in the combination
// against the x-only form of the compressed keypair public keys.
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
