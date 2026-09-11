/** @module Interface pls:bitcoin/multisig@0.1.2 **/
export { _new as new };
function _new(opts: Options): Multisig;
export type Buffer = Uint8Array;
export type Address = string;
/**
 * # Variants
 * 
 * ## `"signet"`
 * 
 * ## `"bitcoin"`
 * 
 * ## `"regtest"`
 * 
 * ## `"testnet"`
 * 
 * ## `"testnet4"`
 */
export type Network = 'signet' | 'bitcoin' | 'regtest' | 'testnet' | 'testnet4';
export interface Options {
  parts: Array<Buffer>,
  arbitrators: Array<Buffer>,
  quorum: number,
  internalPubkey: Buffer,
  network: Network,
}
export interface Script {
  combination: Array<Buffer>,
  leaf: Buffer,
  weight: number,
}
export interface Utxo {
  txid: Buffer,
  vout: number,
  value: bigint,
}
export interface Txout {
  value: bigint,
  address: Address,
}
export interface StartTxSpendingParams {
  redeemScript: Buffer,
  utxos: Array<Utxo>,
  outs: Array<Txout>,
}
export type Error = ErrorParts | ErrorArbitrators | ErrorInternalPubkey;
export interface ErrorParts {
  tag: 'parts',
  val: string,
}
export interface ErrorArbitrators {
  tag: 'arbitrators',
  val: string,
}
export interface ErrorInternalPubkey {
  tag: 'internal-pubkey',
  val: string,
}
export type StartTxSpendingError = StartTxSpendingErrorUtxo | StartTxSpendingErrorOut;
export interface StartTxSpendingErrorUtxo {
  tag: 'utxo',
  val: string,
}
export interface StartTxSpendingErrorOut {
  tag: 'out',
  val: string,
}

export class Multisig implements Disposable {
  /**
   * This type does not have a public constructor.
   */
  private constructor();
  address(): Address;
  internalKey(): Buffer;
  scripts(): Array<Script>;
  startTxSpending(params: StartTxSpendingParams): Buffer;
  [Symbol.dispose](): void;
}
