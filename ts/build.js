import { multisig } from "./bitcoin/pls_bitcoin_wasm.js";
import ejs from "ejs";
import fs from "fs";

const properties = Object.keys(multisig);

const versions = ["node", "web"];

for (let version of versions) {
  const result = await ejs.renderFile("./bitcoin/index.ejs", { version, properties });

  fs.writeFileSync(`./bitcoin/index.${version}.js`, result);
}
