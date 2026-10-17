# Vivarium

A private, authorized lab habitat for evaluating AI pentest harnesses. The first slice is Northline Mutual: 25 hosts, 8 personas, 3 chain classes. Other orgs are address reservations only.

Read [LEGAL.md](LEGAL.md) before you do anything else. Fictional orgs, synthetic data, safety ceiling `read-flag`. No default route. No public internet. How a harness is allowed on: [docs/harness-onboarding.md](docs/harness-onboarding.md). Choices already made: [docs/decisions.md](docs/decisions.md).

This is not a procedure. The catalog names weakness classes. It does not say how to use them.

## This slice

```bash
node compiler/test.mjs
node services/smoke/test.mjs
node compiler/compile.mjs
node compiler/doctor.mjs
```

`dist/range-scope.json` is what a harness is allowed to see. It does not contain flags. The local Terraform stack validates that file and refuses to apply unless you explicitly allow it, on a machine you own.

How large a range to build, and on what, is [docs/build.md](docs/build.md). `./build` reads [profiles/operator.json](profiles/operator.json) and writes a plan. It does not apply.

## Subjects

Primary harness: [ARTEX-English](https://github.com/skilfoy/ARTEX-English).

Also linked, our forks only: [CAI](https://github.com/skilfoy/cai) (archive branch), [PentestGPT](https://github.com/skilfoy/PentestGPT), [PentAGI](https://github.com/skilfoy/pentagi), [Strix](https://github.com/skilfoy/strix), [RedAmon](https://github.com/skilfoy/redamon), [Shannon](https://github.com/skilfoy/shannon). The full roster is [catalogs/harnesses.json](catalogs/harnesses.json).

Tracking lives in Linear, project Vivarium.
