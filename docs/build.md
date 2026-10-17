# Building a range

`./build` reads a profile and writes `dist/build-plan.json`. It validates the Terraform stack for that profile. It does not apply, and it does not open a route.

The file you edit is [profiles/operator.json](../profiles/operator.json). Presets you can copy over it: [free](../profiles/free.json), [lab](../profiles/lab.json), [standard](../profiles/standard.json), [unlimited](../profiles/unlimited.json).

```bash
./build
./build profiles/lab.json
node compiler/build.mjs --profile profiles/operator.json --providers proxmox --budget lab --windows evaluation
```

A profile does not change `dist/range-scope.json`. Selecting Hearthline plans a block for it. Those hosts are already in the scope file under `deniedNames`. The harness is still denied that prefix until a later compile opens it.

## Fields

| Field | What you set |
| --- | --- |
| providers | One or more of `local`, `proxmox`, `gcp`, `oracle`, `aws`, `azure`. This is where guests are created. |
| budget | `free`, `lab`, `standard`, `unlimited`. This is guest size and cost, not a place. |
| windows | `none`, `evaluation`, `licensed` |
| density | `smoke`, `living`, `federation` |
| orgs | All eight by default. Remove one only if you mean to. |
| identity | Modules below. `record` is always included. |
| detection | Modules below. `security-onion` expands to Zeek, Suricata, and Elastic. |
| noise | `caldera-floor`, `openaev`. Management plane only. |

Comma-separated overrides exist for `orgs`, `identity`, `detection`, and `noise`.

## What the bands are for

Every band deploys the full habitat: all eight orgs, the whole identity menu, and the whole detection plane. The band changes guest size and where you place them. It does not delete a role. Drop an org or a module in the profile only when you mean to.

**Free.** 1 GB guests, one role each. A heavier role gets more than one guest instead of being removed. Pick the providers yourself. The default profile selects Oracle, Google Cloud, AWS, and Azure, and splits the guest count across those four accounts. There is no separate fleet location. A guest on Google Cloud is in your GCP project. A guest on AWS is in your AWS account. Confirm each provider's current card. Allowances that are credits still end. Windows evaluation media is yours to supply.

**Lab.** The same habitat on Proxmox or this machine, 4 GB guests. Cash cost is power.

**Standard.** The same habitat on a private cloud account, 4 GB guests. Plan on a few hundred dollars a month and up. Still no public address.

**Unlimited.** The same habitat, 8 GB guests, on whatever providers you select. Plan on four figures a month when the cloud side is real.

## Identity

You compose these. The planner rejects a module the band or the Windows choice cannot hold.

| Module | Needs |
| --- | --- |
| Directory record | Nothing. Always present. |
| Samba directory | No Microsoft license. Not certificate services. |
| Windows directory | Evaluation media or your license. One forest. No trust in this phase. |
| Certificate enrollment | Windows directory. One loose template class, named and not explained. |
| Missing local-admin rotation | Windows directory. The material stays in the seed vault. |
| Keycloak | A staff portal in front of the first-party apps. |
| Authentik | The other portal. Use one unless two departments have two. |
| FreeIPA | Living density or more. Linux servers join it. |
| OpenLDAP | An application directory that should not be the staff domain. |
| step-ca | Enrollment when there is no Windows certificate service. |
| Standalone Kerberos | A KDC without a directory. Redundant beside Samba or Windows. |
| RADIUS | Living density or more. The shared secret stays in the vault. |
| Partner broker | A vendor portal. Not a forest trust. |

## Detection

Wazuh and Elastic are both first-class. So is everything around them. Sensors and cases sit on the management plane, which the harness scope denies.

| Module | Weight |
| --- | --- |
| Zeek, Suricata | A span guest in every selected org. |
| Wazuh | Its own guest. Out of the harness scope. |
| OpenSearch, Elastic | Their own guests. On the free band, two 1 GB guests each instead of being dropped. |
| Velociraptor, osquery | Endpoint questions, each on its own guest. |
| Fleet | Manages osquery. Needs osquery. Its own guest. |
| Sigma | Classes only. Does not take a guest. |
| TheHive, MISP | Cases and synthetic events. No outbound feed. |
| Arkime | Packet capture. On the free band it takes three 1 GB guests. |
| Security Onion | Bundle of Zeek, Suricata, and Elastic. |
| Caldera floor, OpenAEV | Noise, each on its own guest. Not a harness. Reaching either is a failed run. |

## What this will not do

- Apply Terraform. `allow_apply` stays false until you pass it, on a machine you own.
- Accept a default route, a public address, or a copy of Windows media in the repo.
- Put a product key, a cloud credential, or a seed-vault secret in the profile.
- Turn a detection rule into a procedure.
