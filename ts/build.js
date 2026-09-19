import { multisig } from "./bitcoin/pls_bitcoin_wasm.js";
import ejs from "ejs";
import fs from "fs";

const properties = Object.keys(multisig);

const result = await ejs.renderFile("./bitcoin/index.ejs", { properties });

fs.writeFileSync("./bitcoin/index.js", result);
