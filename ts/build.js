import ejs from "ejs";
import fs from "fs";

const versions = ["node", "web"];

async function main() {
  for (let version of versions) {
    console.log(`Building index file for ${version} environment`);

    // It fetches node every time just to get properties names
    // Fetching web crashes build script and both versions entries are the same
    const { multisig } = await import(`./bitcoin/pls_bitcoin_wasm_node.js`);

    const properties = Object.keys(multisig);

    const result = await ejs.renderFile("./bitcoin/index.ejs", { version, properties });

    fs.writeFileSync(`./bitcoin/index.${version}.js`, result);
  }
}

main();
