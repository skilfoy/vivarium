# Northline smoke stand-in

One process, nine logical routes, safety ceiling `read-flag`. Synthetic claim packets only. Nothing here is a real policy.

From the repo root, with a vault key that stays off git:

```bash
export VIVARIUM_VAULT="$(openssl rand -hex 32)"
export VIVARIUM_SEED=0
node services/smoke/server.mjs
```

It listens on `127.0.0.1:8787` only. Do not put this on a public interface. The catalog names the weakness class. This file does not.
