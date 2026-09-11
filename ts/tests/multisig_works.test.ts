import { describe, test, beforeAll, expect } from "vitest";

import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import * as bitcoin from "bitcoinjs-lib";

import { multisig } from "../bitcoin/pls_bitcoin_wasm.js";
import type { Network } from "../bitcoin/interfaces/pls-bitcoin-multisig.d.ts";

describe("multisig test", () => {
  const ECPair = ECPairFactory(ecc);

  beforeAll(() => {
    bitcoin.initEccLib(ecc);
  });

  const network_regexp: { [key in Network]: RegExp } = {
    bitcoin: /bc1/,
    signet: /tb1/,
    regtest: /bcrt1/,
    testnet: /tb1/,
    testnet4: /tb1/,
  };

  test.each(
    Object.keys(network_regexp).map((network) => ({ network: network as Network, regexp: network_regexp[network as Network] })),
  )("verifies if multisig creates multisig address for $network network", ({ network, regexp }) => {
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
      network,
    });

    expect(() => ms.address()).not.toThrow();
    expect(ms.address()).not.toBeFalsy();
    expect(ms.address()).toMatch(regexp);
  });
});
