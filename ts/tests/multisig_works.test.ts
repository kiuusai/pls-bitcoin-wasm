import { describe, test, beforeAll, expect } from "vitest";

import * as ecc from "tiny-secp256k1";
import { ECPairFactory, ECPairInterface } from "ecpair";
import * as bitcoin from "bitcoinjs-lib";
import RpcClient from "bitcoin-json-rpc";

import multisig, { LockTime } from "pls-bitcoin-lib";
import type { Network } from "pls-bitcoin-lib";

describe("multisig test", () => {
  const ECPair = ECPairFactory(ecc);

  const env = process.env;

  let rpcClient: RpcClient;

  beforeAll(() => {
    bitcoin.initEccLib(ecc);

    rpcClient = new RpcClient(env.RPC_URL || "http://admin1:123@0.0.0.0:18443");
  });

  const networkRegexp: { [key in Network]: RegExp } = {
    bitcoin: /bc1/,
    signet: /tb1/,
    regtest: /bcrt1/,
    testnet: /tb1/,
    testnet4: /tb1/,
  };

  type NetworkAndRegExp = {
    network: Network;
    regexp: RegExp;
  };

  const networkAndRegexpList: NetworkAndRegExp[] = Object.keys(networkRegexp).map((network) => ({
    network: network as Network,
    regexp: networkRegexp[network as Network],
  }));

  test.each(networkAndRegexpList)(
    "verifies if multisig creates multisig address for $network network",
    ({ network, regexp }) => {
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
    },
  );

  type ArbitrationData = {
    partsCount: number;
    arbitratorsCount: number;
    quorum: number;
  };

  const arbitrationData: ArbitrationData[] = [
    {
      partsCount: 2,
      arbitratorsCount: 1,
      quorum: 1,
    },
    {
      partsCount: 5,
      arbitratorsCount: 2,
      quorum: 2,
    },
    {
      partsCount: 2,
      arbitratorsCount: 3,
      quorum: 3,
    },
    {
      partsCount: 2,
      arbitratorsCount: 3,
      quorum: 1,
    },
  ];

  type SpendingTestCase = ArbitrationData & { blocksToLock: number };

  const blocksToLockList = [0, 1, 5];

  const spendingTestCases: SpendingTestCase[] = arbitrationData.flatMap((data) =>
    blocksToLockList.map((blocksToLock) => ({ ...data, blocksToLock })),
  );

  // TODO: iterate for each script combination case
  test.each(spendingTestCases)(
    "verifies if multisig creates spendable amounts for $partsCount clients, $arbitratorsCount arbitrators, $quorum quorum and timelock for $blocksToLock",
    async ({ partsCount, arbitratorsCount, quorum, blocksToLock }) => {
      const partsEcpair = Array(partsCount)
        .fill(null)
        .map(() => ECPair.makeRandom());

      const parts = partsEcpair.map((ecpair: ECPairInterface) => ecpair.publicKey);

      const arbitratorsEcpair = Array(arbitratorsCount)
        .fill(null)
        .map(() => ECPair.makeRandom());

      const arbitrators = arbitratorsEcpair.map((ecpair) => ecpair.publicKey);

      const allEcpairs: { [key: string]: ECPairInterface } = {};

      function bufferToHex(buf: Uint8Array) {
        return Buffer.from(buf).toString("hex");
      }

      partsEcpair.forEach((ecpair: ECPairInterface) => {
        allEcpairs[bufferToHex(ecpair.publicKey)] = ecpair;
      });

      arbitratorsEcpair.forEach((ecpair: ECPairInterface) => {
        allEcpairs[bufferToHex(ecpair.publicKey)] = ecpair;
      });

      const internalPubkey: Uint8Array = ECPair.makeRandom().publicKey;

      const ms = multisig.new({
        parts,
        arbitrators,
        quorum,
        internalPubkey,
        network: "regtest",
      });

      const latestBlock = await rpcClient.getBlockCount();

      async function mineBlocks(blocks: number) {
        const rpcAddress = await rpcClient.getNewAddress();
        await rpcClient.generateToAddress(blocks, rpcAddress);
      }

      // Needed to generate spendable amounts
      if (latestBlock < 100) await mineBlocks(101);

      for (let redeemScript of ms.scripts()) {
        await mineBlocks(1);

        const txid = await rpcClient.sendToAddress(
          ms.address(),
          "1",
          "send to multisig",
          undefined,
          true,
        );

        await mineBlocks(1);

        const tx = await rpcClient.getRawTransactionAsObject(txid);

        const utxo = tx.vout.find((out) => out.scriptPubKey?.address === ms.address())!;

        const [redeemerEcpair] = partsEcpair;

        const redeemerAddress = bitcoin.payments.p2pkh({
          pubkey: redeemerEcpair.publicKey,
          network: bitcoin.networks.regtest,
        }).address!;

        const fee = 1000n;

        const latestBlock = await rpcClient.getBlockCount();

        const lockTime = (() => {
          if (blocksToLock <= 0) return undefined;

          return LockTime.BlockHeight(latestBlock + blocksToLock);
        })();

        const rawPsbt = ms.startTxSpending({
          redeemScript: redeemScript.leaf,
          utxos: [
            {
              txid: Buffer.from(txid, "hex"),
              vout: utxo.n!,
              value: BigInt(utxo.value! * 10 ** 8),
            },
          ],
          outs: [
            {
              value: BigInt(utxo.value! * 10 ** 8) - fee,
              address: redeemerAddress,
            },
          ],
          lockTime,
        });

        const psbt = bitcoin.Psbt.fromBuffer(rawPsbt);

        const ecpairsToSign = redeemScript.combination.map((pubkey) => {
          const ecpair = allEcpairs[bufferToHex(pubkey)]!;

          return ecpair;
        });

        await Promise.all(
          ecpairsToSign.map(async (ecpair) => {
            await psbt.signAllInputsAsync(ecpair);
          }),
        );

        psbt.finalizeAllInputs();

        const finalTx = psbt.extractTransaction();

        if (blocksToLock > 0) {
          // Equivalent to Rust for _ in 0..blocksToLock
          for (let _ in Array(blocksToLock).fill(null)) {
            // Ensures that server throws an error if tries to process requests without satisfies lockTime
            await expect(rpcClient.sendRawTransaction(finalTx.toHex())).rejects.toThrow(
              "non-final",
            );
            await mineBlocks(1);
          }
        }

        await rpcClient.sendRawTransaction(finalTx.toHex());
      }
    },
  );
});
