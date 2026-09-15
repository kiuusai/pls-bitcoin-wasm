/** @module Interface pls:bitcoin/multisig@0.2.1 **/
/**
 * Multisig builder
 */
export { _new as new };
function _new(data: MultisigData): Multisig;
export type Buffer = Uint8Array;
export type Address = string;
/**
 * Describes which network the multisig should be generated
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
/**
 * Required data for multisig creation
 */
export interface MultisigData {
  /**
   * A public key list from contractors (involved parts).
   * They're compressed public keys (33 bytes keys: 32 bytes + parity byte)
   */
  parts: Array<Buffer>,
  /**
   * A public key list from arbitrators.
   * They're compressed public keys (33 bytes keys: 32 bytes + parity byte)
   */
  arbitrators: Array<Buffer>,
  /**
   * Quorum of minimal necessary arbitrators to unlock funds
   */
  quorum: number,
  /**
   * Internal public key. It's a critical data.
   * If the private key of this one is known, all funds can be sweeped.
   * This field exists for compatibility purposes with current on-air system.
   * It's a compressed public key (33 bytes key: 32 bytes + parity byte)
   * TODO: Finds a way to create a verifiable one using parts and arbitrators data instead of a hardcoded one
   */
  internalPubkey: Buffer,
  /**
   * Network to create  multisig
   */
  network: Network,
}
/**
 * Describes a multisig script
 */
export interface Script {
  /**
   * Combination of public keys for this script.
   * They're compressed public keys (33 bytes keys: 32 bytes + parity byte)
   */
  combination: Array<Buffer>,
  /**
   * Taproot script bytes
   */
  leaf: Buffer,
  /**
   * Script weight in taptree
   */
  weight: number,
}
export interface Utxo {
  /**
   * UTXO transaction ID bytes
   */
  txid: Buffer,
  /**
   * Index of UTXO from origin transaction in blockchain
   */
  vout: number,
  /**
   * Value in sats of current UTXO
   */
  value: bigint,
}
/**
 * Transaction output for spending case
 */
export interface TxOut {
  /**
   * Amount deposit in given address
   */
  value: bigint,
  /**
   * Address to deposit amount
   */
  address: Address,
}
/**
 * Required data to start UTXO's spending
 */
export interface StartTxSpendingData {
  /**
   * Script bytes to unlock UTXO's
   */
  redeemScript: Buffer,
  /**
   * List of UTXO's to unlock
   */
  utxos: Array<Utxo>,
  /**
   * List of outputs for unlocked funds
   */
  outs: Array<TxOut>,
}
/**
 * Multisig build errors
 */
export type MultisigError = MultisigErrorParts | MultisigErrorArbitrators | MultisigErrorInternalPubkey;
/**
 * An error occurred while processing contractors (involved parts) keys
 */
export interface MultisigErrorParts {
  tag: 'parts',
  val: string,
}
/**
 * An error occured while processing arbitrators keys
 */
export interface MultisigErrorArbitrators {
  tag: 'arbitrators',
  val: string,
}
/**
 * An error occurred while processing the internal public key
 */
export interface MultisigErrorInternalPubkey {
  tag: 'internal-pubkey',
  val: string,
}
/**
 * Start UTXO's spending errors
 */
export type StartTxSpendingError = StartTxSpendingErrorUtxo | StartTxSpendingErrorOut;
/**
 * An error occurred while processing UTXO's
 */
export interface StartTxSpendingErrorUtxo {
  tag: 'utxo',
  val: string,
}
/**
 * An error occured while processing outputs
 */
export interface StartTxSpendingErrorOut {
  tag: 'out',
  val: string,
}

export class Multisig implements Disposable {
  /**
   * This type does not have a public constructor.
   */
  private constructor();
  /**
  * Returns multisig address
  */
  address(): Address;
  /**
  * Returns internal public key used to generate the multisig (XOnly format)
  */
  internalKey(): Buffer;
  /**
  * Returns the list of scripts combinations to unlock funds
  */
  scripts(): Array<Script>;
  /**
  * Starts spending considering given data
  */
  startTxSpending(params: StartTxSpendingData): Buffer;
  [Symbol.dispose](): void;
}
