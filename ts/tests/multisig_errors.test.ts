import { describe, expect, test } from "vitest";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";

import multisig from "pls-bitcoin-lib";

describe("multisig error test", () => {
  const ECPair = ECPairFactory(ecc);

  function expectWitError(action: () => unknown, tag: string) {
    expect(() => action()).toThrow(expect.objectContaining({ tag }));
  }

  test("throws when the arbitrator quorum is zero", () => {
    expectWitError(() => multisig.createMultisig({
      parts: [ECPair.makeRandom().publicKey],
      arbitrators: [ECPair.makeRandom().publicKey],
      quorum: 0,
      internalPubkey: ECPair.makeRandom().publicKey,
      network: "regtest",
    }), "quorum-zero");
  });

  test("throws when a public key is both a part and an arbitrator", () => {
    const sharedKey = ECPair.makeRandom().publicKey;

    expectWitError(() => multisig.createMultisig({
      parts: [sharedKey],
      arbitrators: [sharedKey],
      quorum: 1,
      internalPubkey: ECPair.makeRandom().publicKey,
      network: "regtest",
    }), "arbitrator-is-part");
  });

  test("throws when a part key is repeated, including across key encodings", () => {
    const part = ECPair.makeRandom().publicKey;

    expectWitError(() => multisig.createMultisig({
      parts: [part, part.slice(1)],
      arbitrators: [ECPair.makeRandom().publicKey],
      quorum: 1,
      internalPubkey: ECPair.makeRandom().publicKey,
      network: "regtest",
    }), "duplicate-part");
  });

  test("throws when an arbitrator key is repeated", () => {
    const arbitrator = ECPair.makeRandom().publicKey;

    expectWitError(() => multisig.createMultisig({
      parts: [ECPair.makeRandom().publicKey],
      arbitrators: [arbitrator, arbitrator],
      quorum: 1,
      internalPubkey: ECPair.makeRandom().publicKey,
      network: "regtest",
    }), "duplicate-arbitrator");
  });

  test("throws when spending with a script that is not in the multisig", () => {
    const ms = multisig.createMultisig({
      parts: [ECPair.makeRandom().publicKey],
      arbitrators: [ECPair.makeRandom().publicKey],
      quorum: 1,
      internalPubkey: ECPair.makeRandom().publicKey,
      network: "regtest",
    });

    expectWitError(() => ms.startTxSpending({
      redeemScript: Buffer.from([0x51]),
      utxos: [],
      outs: [],
      lockTime: undefined,
    }), "script-not-found");
  });
})
