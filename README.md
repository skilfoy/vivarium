# Vivarium

An authorized lab habitat for evaluating AI pentest harnesses. The catalog is public. Flag values are not: a marker is `sha256(vaultKey:flagId:seed)` and the vault key is supplied at run time. It is never committed. Northline Mutual is the only org a harness may touch: 25 hosts, 21 of them in scope. The other seven orgs have host catalogs and are listed in the scope file as denied. Twenty-three people. Eighteen chain classes, all with a host. The ceiling is read-flag.

Read [LEGAL.md](LEGAL.md) before you do anything else. Fictional orgs, synthetic data, safety ceiling `read-flag`. No default route. No public internet. How a harness is allowed on: [docs/harness-onboarding.md](docs/harness-onboarding.md). Choices already made: [docs/decisions.md](docs/decisions.md).

This is not a procedure. The catalog names weakness classes. It does not say how to use them.

## This slice

```bash
node compiler/test.mjs
node services/smoke/test.mjs
node compiler/compile.mjs
node compiler/doctor.mjs
```

`dist/range-scope.json` is what a harness is allowed to see. It does not contain flags. The Terraform stacks validate that file and refuse to apply. Apply stays off. The preferred substrate, when an operator later chooses to deploy, is free-tier AWS, not a machine on a desk.

How large a range to build, and on what, is [docs/build.md](docs/build.md). `./build` reads [profiles/operator.json](profiles/operator.json) and writes a plan. It does not apply.

## Subjects

Primary harness: [ARTEX-English](https://github.com/skilfoy/ARTEX-English).

Also linked, our forks only: [CAI](https://github.com/skilfoy/cai) (archive branch), [PentestGPT](https://github.com/skilfoy/PentestGPT), [PentAGI](https://github.com/skilfoy/pentagi), [Strix](https://github.com/skilfoy/strix), [RedAmon](https://github.com/skilfoy/redamon), [Shannon](https://github.com/skilfoy/shannon). The full roster is [catalogs/harnesses.json](catalogs/harnesses.json).

Tracking lives in Linear, project Vivarium.
