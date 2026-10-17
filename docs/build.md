# Building a range

`./build` reads a profile and writes `dist/build-plan.json`. It validates the Terraform stack for that profile. It does not apply, and it does not open a route.

The file you edit is [profiles/operator.json](../profiles/operator.json). Presets you can copy over it: [free](../profiles/free.json), [lab](../profiles/lab.json), [standard](../profiles/standard.json), [unlimited](../profiles/unlimited.json).

```bash
./build
./build profiles/lab.json
node compiler/build.mjs --profile profiles/operator.json --substrate proxmox --budget lab --windows evaluation
```

A profile does not change `dist/range-scope.json`. Selecting Hearthline plans a block for it. The harness is still denied that prefix until a later compile opens it.

## Fields

| Field | What you set |
| --- | --- |
| substrate | `local`, `proxmox`, `gcp`, `oracle`, `aws`, `azure`, `hybrid` |
| budget | `free`, `lab`, `standard`, `unlimited` |
| windows | `none`, `evaluation`, `licensed` |
| density | `smoke`, `living`, `federation` |
| orgs | `northline` plus any reserved org the band allows |
| identity | Modules below. `record` is always included. |
| detection | Modules below. `security-onion` expands to Zeek, Suricata, and Elastic. |
| noise | `caldera-floor`, `openaev`. Management plane only. |

Comma-separated overrides exist for `orgs`, `identity`, `detection`, and `noise`.

## What the bands are for

**Free.** One org, smoke density, no Windows. Identity is the record plus two modules, usually Samba and Keycloak. Detection is two guests plus Sigma, usually Zeek and Wazuh. Substrates are this machine, Google Cloud's always-free e2-micro in us-west1, us-central1, or us-east1, or Oracle Cloud's published always-free shape. Confirm both cloud cards before you depend on them. Oracle's allowance has been reduced before, and idle guests can be reclaimed. AWS and Azure are not in this band. Their allowances are credits that end.

**Lab.** Hardware you already run, Proxmox or this machine. Smoke or living. Windows evaluation media if you already have it from Microsoft. The full identity menu that the density allows, and the detection menu including packet capture if you have the disk. Cash cost is power.

**Standard.** An isolated paid account, or a lab that is about that size. One or two orgs, living density. AWS and Azure fit here because their free allowances expire. Plan on a few hundred dollars a month if the guests are small. Still no public address.

**Unlimited.** Every reserved org, licensed Windows if you have a license, hybrid (Proxmox habitat plus a private cloud sensor replica), packet capture, and the noise floor. Plan on four figures a month when the cloud side is real. The figure is a band, not a quote.

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
| Zeek, Suricata | Span metadata and alerts. |
| Wazuh | Host agents, manager out of scope. |
| OpenSearch | Search, lighter than Elastic. Cramped on a 1 GB guest. |
| Elastic | Search. Not on the free band. |
| Velociraptor, osquery | Endpoint questions. |
| Fleet | Manages osquery. Needs osquery. Not on the free band. |
| Sigma | Classes only. Does not count as a guest. |
| TheHive, MISP | Cases and synthetic events. No outbound feed. |
| Arkime | Packet capture. Not on the free band. |
| Security Onion | Bundle of Zeek, Suricata, and Elastic. Not on the free band. |
| Caldera floor, OpenAEV | Noise. Not a harness. Reaching either is a failed run. |

## What this will not do

- Apply Terraform. `allow_apply` stays false until you pass it, on a machine you own.
- Accept a default route, a public address, or a copy of Windows media in the repo.
- Put a product key, a cloud credential, or a seed-vault secret in the profile.
- Turn a detection rule into a procedure.
