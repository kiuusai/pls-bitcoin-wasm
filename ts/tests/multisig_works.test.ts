import { describe, test, beforeAll, expect } from "vitest";

import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import * as bitcoin from "bitcoinjs-lib";
import RpcClient from "bitcoin-json-rpc";

import { multisig } from "pls-bitcoin-lib";
import type { Network } from "pls-bitcoin-lib/types";

describe("multisig test", () => {
  const ECPair = ECPairFactory(ecc);

  const env = process.env;

  let rpcClient: RpcClient;

  beforeAll(() => {
    bitcoin.initEccLib(ecc);

    rpcClient = new RpcClient(env.RPC_URL || "http://admin1:123@0.0.0.0:18443");
  });

  const network_regexp: { [key in Network]: RegExp } = {
    bitcoin: /bc1/,
    signet: /tb1/,
    regtest: /bcrt1/,
    testnet: /tb1/,
    testnet4: /tb1/,
  };

  test.each(
    Object.keys(network_regexp).map((network) => ({
      network: network as Network,
      regexp: network_regexp[network as Network],
    })),
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

  test("verifies if multisig creates spendable amounts", async () => {
    const partsEcpair = Array(2)
      .fill(null)
      .map(() => ECPair.makeRandom());

    const parts: Uint8Array[] = partsEcpair.map((ecpair) => ecpair.publicKey);

    const arbitratorsEcpair = Array(1)
      .fill(null)
      .map(() => ECPair.makeRandom());

    const arbitrators: Uint8Array[] = arbitratorsEcpair.map((ecpair) => ecpair.publicKey);

    const internalPubkey: Uint8Array = ECPair.makeRandom().publicKey;

    const bufferToHex = (buf: Uint8Array) => Buffer.from(buf).toString("hex");

    const ms = multisig.new({
      parts,
      arbitrators,
      quorum: 1,
      internalPubkey,
      network: "regtest",
    });

    const ghostAddress = (() => {
      const ghostKeypair = ECPair.makeRandom();

      return bitcoin.payments.p2pkh({
        pubkey: ghostKeypair.publicKey,
        network: bitcoin.networks.regtest,
      }).address!;
    })();

    const latestBlock = await rpcClient.getBlockCount();

    // Needed to generate spendable amounts
    if (latestBlock < 100) await rpcClient.generateToAddress(101, ghostAddress);

    const rpcAddress = await rpcClient.getNewAddress();

    await rpcClient.generateToAddress(1, rpcAddress);

    const balance: number = await rpcClient.getBalance();

    const txid = await rpcClient.sendToAddress(
      ms.address(),
      balance.toString(),
      "send to multisig",
      undefined,
      true,
    );

    await rpcClient.generateToAddress(1, ghostAddress);

    const tx = await rpcClient.getRawTransactionAsObject(txid);

    const utxo = tx.vout.find((out) => out.scriptPubKey?.address === ms.address())!;

    const redeemScript = ms.scripts().find((script) => {
      return script.combination.every((pubkeyBuf) => {
        return parts.some(
          (part) => bufferToHex(bitcoin.toXOnly(pubkeyBuf)) === bufferToHex(bitcoin.toXOnly(part)),
        );
      });
    })!;

    expect(redeemScript).not.toBeUndefined();

    const [redeemerEcpair] = partsEcpair;

    const redeemerAddress = bitcoin.payments.p2pkh({
      pubkey: redeemerEcpair.publicKey,
      network: bitcoin.networks.regtest,
    }).address!;

    const rawPsbt = ms.startTxSpending({
      redeemScript: redeemScript.leaf,
      utxos: [{
        txid: Buffer.from(txid, "hex"),
        vout: utxo.n!,
        value: BigInt(utxo.value! * 10**8)
      }],
      outs: [
        {
          value: BigInt(utxo.value! * 10**8) - 200n,
          address: redeemerAddress,
        },
      ],
    });

    const psbt = bitcoin.Psbt.fromBuffer(rawPsbt);

    for (let part of partsEcpair) await psbt.signAllInputsAsync(part);

    psbt.finalizeAllInputs();

    const finalTx = psbt.extractTransaction();

    await rpcClient.sendRawTransaction(finalTx.toHex());
  });
});
