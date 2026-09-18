const { multisig } = await import("./pls_bitcoin_wasm.js");

module.exports = Object.assign({}, multisig, {
  default: multisig,
});
