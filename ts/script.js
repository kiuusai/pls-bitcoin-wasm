import { multisig } from "./bitcoin/pls_bitcoin_wasm.ts";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";

bitcoin.initEccLib(ecc);

const ECPair = ECPairFactory(ecc);

const partsEcpair = Array(2)
  .fill(null)
  .map(() => ECPair.makeRandom());

const parts = partsEcpair.map((ecpair) => ecpair.publicKey);

const arbitratorsEcpair = Array(1)
  .fill(null)
  .map(() => ECPair.makeRandom());

const arbitrators = arbitratorsEcpair.map((ecpair) => ecpair.publicKey);

const ms = multisig.new({
  parts,
  arbitrators,
  quorum: 1,
  internalPubkey: ECPair.makeRandom().publicKey,
  network: 'regtest',
})

console.log(ms.address());
