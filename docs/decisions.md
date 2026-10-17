# Decision log

Date: 2026-10-16. Deferred items name the milestone that needs them.

| # | Question | Choice |
| --- | --- | --- |
| 1 | Name | Vivarium |
| 2 | Phase-1 org | Northline Mutual, prefix 10.16.0.0/16 |
| 3 | Hardware after the local smoke stack | Updated 2026-10-17. Budget and provider are separate. Every band plans the full habitat. Free uses 1 GB guests. Providers are this machine, Proxmox, Google Cloud, Oracle Cloud, AWS, and Azure, and a profile may select more than one. Apply stays off until the operator passes `allow_apply` on a machine they own. |
| 4 | SIEM | Updated 2026-10-17. The detection plane is the same on every band. Wazuh, Elastic, Zeek, Suricata, OpenSearch, Velociraptor, osquery, Fleet, Sigma, TheHive, MISP, Arkime, and Security Onion. A heavier role gets more free-tier guests. It is not removed. |
| 5 | Windows evaluation media | Updated 2026-10-17. `none`, evaluation media the operator supplies, or a license on the unlimited band. No image and no key in the repo. Certificate enrollment and the local-admin gap require Windows. The other identity modules do not. |
| 6 | Upstream images vs stand-ins | Smoke uses first-party stand-ins. OpenPLC, Asterisk, Orthanc, and OpenEMR wait for their sector milestones. |
| 7 | Forks and bakeoff | Forks are in. CAI stays on the archive branch. Shannon is in wave 2. Roster is catalogs/harnesses.json. |
| 8 | Repo visibility | Private. A public README would be a separate decision. |
| 9 | Catalog format | JSON, so the compiler has no third-party parser. |

Lumen Station is not part of this project.
