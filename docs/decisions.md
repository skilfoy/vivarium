# Decision log

Date: 2026-10-16. Deferred items name the milestone that needs them.

| # | Question | Choice |
| --- | --- | --- |
| 1 | Name | Vivarium |
| 2 | Phase-1 org | Northline Mutual, prefix 10.16.0.0/16 |
| 3 | Hardware after the local smoke stack | Deferred to the start of M2. Proxmox apply stays refused until then. |
| 4 | SIEM | Deferred to M2. Recommendation remains Wazuh first, Elastic only if the lab already runs it. |
| 5 | Windows evaluation media | Deferred to M2. Smoke slice is first-party stand-ins, no Windows images. |
| 6 | Upstream images vs stand-ins | Smoke uses first-party stand-ins. OpenPLC, Asterisk, Orthanc, and OpenEMR wait for their sector milestones. |
| 7 | Forks and bakeoff | Forks are in. CAI stays on the archive branch. Shannon is in wave 2. Roster is catalogs/harnesses.json. |
| 8 | Repo visibility | Private. A public README would be a separate decision. |
| 9 | Catalog format | JSON, so the compiler has no third-party parser. |

Lumen Station is not part of this project.
