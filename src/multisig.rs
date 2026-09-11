use bitcoin::hashes::Hash;
use pls_bitcoin_lib::{Multisig, MultisigOptions, Utxo};

use bitcoin::secp256k1::PublicKey;
use bitcoin::{Address, Amount, Network, OutPoint, ScriptBuf, TxOut, Txid};

use crate::bindings::exports::pls::bitcoin::multisig;

pub struct MultisigWrapper {
    multisig: Multisig,
}

fn enum_conversion(network: multisig::Network) -> Network {
    match network {
        multisig::Network::Bitcoin => Network::Bitcoin,
        multisig::Network::Signet => Network::Signet,
        multisig::Network::Regtest => Network::Regtest,
        multisig::Network::Testnet => Network::Testnet,
        multisig::Network::Testnet4 => Network::Testnet4,
    }
}

impl multisig::GuestMultisig for MultisigWrapper {
    fn address(&self) -> multisig::Address {
        return self.multisig.address().to_string();
    }

    fn internal_key(&self) -> multisig::Buffer {
        return self.multisig.internal_key().serialize().to_vec();
    }

    fn scripts(&self) -> Vec<multisig::Script> {
        return self
            .multisig
            .scripts()
            .iter()
            .map(|script| multisig::Script {
                combination: script
                    .combination
                    .iter()
                    .map(|key| key.serialize().to_vec())
                    .collect(),
                leaf: script.leaf.to_bytes(),
                weight: script.weight as u32,
            })
            .collect();
    }

    fn start_tx_spending(
        &self,
        params: multisig::StartTxSpendingParams,
    ) -> Result<multisig::Buffer, multisig::StartTxSpendingError> {
        let redeem_script = ScriptBuf::from_bytes(params.redeem_script);

        let utxos: Vec<Utxo> = params
            .utxos
            .clone()
            .iter()
            .map(|utxo| {
                let txid = Txid::from_slice(&utxo.txid)
                    .map_err(|err| multisig::StartTxSpendingError::Utxo(err.to_string()))?;

                Ok(Utxo {
                    outpoint: OutPoint {
                        txid,
                        vout: utxo.vout,
                    },
                    value: Amount::from_sat(utxo.value),
                })
            })
            .collect::<Result<_, _>>()?;

        let outs: Vec<TxOut> = params
            .outs
            .clone()
            .iter()
            .map(|out| {
                let address = out
                    .address
                    .parse::<Address<_>>()
                    .map_err(|err| multisig::StartTxSpendingError::Out(err.to_string()))?
                    .require_network(self.multisig.network())
                    .map_err(|err| multisig::StartTxSpendingError::Out(err.to_string()))?;

                Ok(TxOut {
                    value: Amount::from_sat(out.value),
                    script_pubkey: address.script_pubkey(),
                })
            })
            .collect::<Result<_, _>>()?;

        let psbt = self.multisig.start_tx_spending(redeem_script, utxos, outs);

        return Ok(psbt.serialize());
    }
}

pub struct MultisigComponent;

impl multisig::Guest for MultisigComponent {
    type Multisig = MultisigWrapper;

    fn new(opts: multisig::Options) -> Result<multisig::Multisig, multisig::Error> {
        let parts: Vec<PublicKey> = opts
            .parts
            .clone()
            .iter()
            .map(|part| PublicKey::from_slice(part))
            .collect::<Result<_, _>>()
            .map_err(|err| multisig::Error::Parts(err.to_string()))?;

        let arbitrators: Vec<PublicKey> = opts
            .arbitrators
            .clone()
            .iter()
            .map(|arbitrator| PublicKey::from_slice(arbitrator))
            .collect::<Result<_, _>>()
            .map_err(|err| multisig::Error::Arbitrators(err.to_string()))?;

        let internal_pubkey = PublicKey::from_slice(&opts.internal_pubkey.clone())
            .map_err(|err| multisig::Error::InternalPubkey(err.to_string()))?;

        let multisig = Multisig::new(MultisigOptions {
            parts,
            arbitrators,
            internal_pubkey,
            quorum: opts.quorum as usize,
            network: enum_conversion(opts.network),
        });

        Ok(multisig::Multisig::new(MultisigWrapper { multisig }))
    }
}
