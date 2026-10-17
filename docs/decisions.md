# Decision log

Date: 2026-10-16. Deferred items name the milestone that needs them.

| # | Question | Choice |
| --- | --- | --- |
| 1 | Name | Vivarium |
| 2 | Phase-1 org | Northline Mutual, prefix 10.16.0.0/16 |
| 3 | Hardware after the local smoke stack | Updated 2026-10-17. Every band, including free, plans the full habitat and spreads it across one guest per role. Free uses 1 GB free-tier guests across Oracle, Google Cloud, AWS, Azure, and a machine you already have. Apply stays off until the operator passes `allow_apply` on a machine they own. |
| 4 | SIEM | Updated 2026-10-17. The detection plane is the same on every band. Wazuh, Elastic, Zeek, Suricata, OpenSearch, Velociraptor, osquery, Fleet, Sigma, TheHive, MISP, Arkime, and Security Onion. A heavier role gets more free-tier guests. It is not removed. |
| 5 | Windows evaluation media | Updated 2026-10-17. `none`, evaluation media the operator supplies, or a license on the unlimited band. No image and no key in the repo. Certificate enrollment and the local-admin gap require Windows. The other identity modules do not. |
| 6 | Upstream images vs stand-ins | Smoke uses first-party stand-ins. OpenPLC, Asterisk, Orthanc, and OpenEMR wait for their sector milestones. |
| 7 | Forks and bakeoff | Forks are in. CAI stays on the archive branch. Shannon is in wave 2. Roster is catalogs/harnesses.json. |
| 8 | Repo visibility | Private. A public README would be a separate decision. |
| 9 | Catalog format | JSON, so the compiler has no third-party parser. |

Lumen Station is not part of this project.
