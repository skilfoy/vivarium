import { createServer } from "node:http";
import { handle } from "./app.mjs";

const seed = Number(process.env.VIVARIUM_SEED ?? "0");
const vaultKey = process.env.VIVARIUM_VAULT;
if (!vaultKey) {
  console.error("Set VIVARIUM_VAULT to a local file's contents. Do not commit it.");
  process.exit(1);
}

const port = Number(process.env.PORT ?? "8787");
createServer((req, res) => {
  const result = handle({
    method: req.method ?? "GET",
    url: req.url ?? "/",
    headers: { authorization: req.headers.authorization },
    seed,
    vaultKey,
  });
  res.writeHead(result.status, { "content-type": "application/json" });
  res.end(JSON.stringify(result.body));
}).listen(port, "127.0.0.1");
