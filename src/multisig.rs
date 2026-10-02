use bitcoin::absolute::LockTime;
use bitcoin::hashes::Hash;
use pls_bitcoin_lib::{
    Multisig, MultisigData, MultisigError as LibMultisigError, SpendingData, SpendingError, Utxo,
};

use bitcoin::secp256k1::{PublicKey, XOnlyPublicKey};
use bitcoin::{Address, Amount, Network, OutPoint, ScriptBuf, TxOut, Txid};
use indexmap::IndexSet;

use crate::bindings::exports::pls::bitcoin::multisig;
use crate::bindings::exports::pls::bitcoin::multisig::{
    MultisigError, StartTxSpendingData, StartTxSpendingError,
};

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

fn parse_xonly_key(bytes: &[u8]) -> Result<XOnlyPublicKey, bitcoin::secp256k1::Error> {
    if bytes.len() == 32 {
        XOnlyPublicKey::from_slice(bytes)
    } else {
        PublicKey::from_slice(bytes).map(|key| key.x_only_public_key().0)
    }
}

fn parse_internal_key(bytes: &[u8]) -> Result<PublicKey, bitcoin::secp256k1::Error> {
    if bytes.len() == 32 {
        let mut compressed = Vec::with_capacity(33);
        compressed.push(0x02);
        compressed.extend_from_slice(bytes);
        PublicKey::from_slice(&compressed)
    } else {
        PublicKey::from_slice(bytes)
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
        params: StartTxSpendingData,
    ) -> Result<multisig::Buffer, StartTxSpendingError> {
        let redeem_script = ScriptBuf::from_bytes(params.redeem_script);

        let utxos: Vec<Utxo> = params
            .utxos
            .clone()
            .iter()
            .map(|utxo| {
                // Necessary because Txid::from_slice needs the reverse data order to mount txid
                // correctly
                let mut txid_data = utxo.txid.clone();

                txid_data.reverse();

                let txid = Txid::from_slice(&txid_data)
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
                    .map_err(|err| StartTxSpendingError::Out(err.to_string()))?
                    .require_network(self.multisig.network())
                    .map_err(|err| StartTxSpendingError::Out(err.to_string()))?;

                Ok(TxOut {
                    value: Amount::from_sat(out.value),
                    script_pubkey: address.script_pubkey(),
                })
            })
            .collect::<Result<_, _>>()?;

        let lock_time = if params.lock_time.is_some() {
            Some(match params.lock_time.unwrap() {
                multisig::LockTime::BlockHeight(height) => LockTime::from_height(height)
                    .map_err(|err| StartTxSpendingError::LockTime(err.to_string()))?,
                multisig::LockTime::Timestamp(timestamp) => LockTime::from_time(timestamp)
                    .map_err(|err| StartTxSpendingError::LockTime(err.to_string()))?,
            })
        } else {
            None
        };

        let psbt = self
            .multisig
            .start_tx_spending(SpendingData {
                redeem_script,
                utxos,
                outs,
                lock_time,
            })
            .map_err(|err| match err {
                SpendingError::ScriptNotFound => StartTxSpendingError::ScriptNotFound,
            })?;

        return Ok(psbt.serialize());
    }
}

pub struct MultisigComponent;

impl multisig::Guest for MultisigComponent {
    type Multisig = MultisigWrapper;

    fn create_multisig(data: multisig::MultisigData) -> Result<multisig::Multisig, MultisigError> {
        let parsed_parts: Vec<XOnlyPublicKey> = data
            .parts
            .clone()
            .iter()
            .map(|part| parse_xonly_key(part))
            .collect::<Result<_, _>>()
            .map_err(|err| multisig::MultisigError::Parts(err.to_string()))?;
        let mut parts: IndexSet<XOnlyPublicKey> = IndexSet::with_capacity(parsed_parts.len());
        for part in parsed_parts {
            if !parts.insert(part) {
                return Err(MultisigError::DuplicatePart(part.to_string()));
            }
        }

        let parsed_arbitrators: Vec<XOnlyPublicKey> = data
            .arbitrators
            .clone()
            .iter()
            .map(|arbitrator| parse_xonly_key(arbitrator))
            .collect::<Result<_, _>>()
            .map_err(|err| multisig::MultisigError::Arbitrators(err.to_string()))?;
        let mut arbitrators: IndexSet<XOnlyPublicKey> =
            IndexSet::with_capacity(parsed_arbitrators.len());
        for arbitrator in parsed_arbitrators {
            if !arbitrators.insert(arbitrator) {
                return Err(MultisigError::DuplicateArbitrator(arbitrator.to_string()));
            }
        }

        let internal_pubkey = parse_internal_key(&data.internal_pubkey)
            .map_err(|err| multisig::MultisigError::InternalPubkey(err.to_string()))?;

        let multisig = Multisig::new(MultisigData {
            parts,
            arbitrators,
            internal_pubkey,
            quorum: data.quorum as usize,
            network: enum_conversion(data.network),
        })
        .map_err(|err| match err {
            LibMultisigError::QuorumZero => MultisigError::QuorumZero,
            LibMultisigError::ArbitratorIsPart(key) => {
                MultisigError::ArbitratorIsPart(key.to_string())
            }
        })?;

        Ok(multisig::Multisig::new(MultisigWrapper { multisig }))
    }
}
