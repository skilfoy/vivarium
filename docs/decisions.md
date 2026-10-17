# Decision log

Date: 2026-10-16. Deferred items name the milestone that needs them.

| # | Question | Choice |
| --- | --- | --- |
| 1 | Name | Vivarium |
| 2 | Phase-1 org | Northline Mutual, prefix 10.16.0.0/16 |
| 3 | Hardware after the local smoke stack | Updated 2026-10-17. An operator profile picks the substrate: this machine, Proxmox, Google Cloud, Oracle Cloud, AWS, Azure, or a hybrid. Apply stays off until that operator passes `allow_apply` on a machine they own. |
| 4 | SIEM | Updated 2026-10-17. The detection plane is composable. Wazuh and Elastic are both in it, with Zeek, Suricata, OpenSearch, Velociraptor, osquery, Fleet, Sigma, TheHive, MISP, Arkime, and Security Onion as a bundle. The free band cannot carry the heavy modules. |
| 5 | Windows evaluation media | Updated 2026-10-17. `none`, evaluation media the operator supplies, or a license on the unlimited band. No image and no key in the repo. Certificate enrollment and the local-admin gap require Windows. The other identity modules do not. |
| 6 | Upstream images vs stand-ins | Smoke uses first-party stand-ins. OpenPLC, Asterisk, Orthanc, and OpenEMR wait for their sector milestones. |
| 7 | Forks and bakeoff | Forks are in. CAI stays on the archive branch. Shannon is in wave 2. Roster is catalogs/harnesses.json. |
| 8 | Repo visibility | Private. A public README would be a separate decision. |
| 9 | Catalog format | JSON, so the compiler has no third-party parser. |

Lumen Station is not part of this project.
