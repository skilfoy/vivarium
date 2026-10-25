# Apply

Apply stays off. CI does not turn it on. Do not treat a local apply as the next step.

The preferred substrate, when an operator later chooses to deploy, is free-tier AWS: one t3.micro and 750 hours per guest, one account per guest. That plan is in the compiler. It is not applied here.

The stacks still validate: local, proxmox, aws-isolated, gcp-isolated, azure-isolated, and oracle-isolated. Each one refuses to apply unless `allow_apply` is set on a machine the operator owns. Setting that variable is a later decision, not this change.

Take the snapshot in `dist/snapshots/seed/smoke/` before a graded run. The file name is the scope hash. Do not give it to a harness.
