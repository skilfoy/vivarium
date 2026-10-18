# Apply

Apply is off. CI does not turn it on.

On a machine you own, from `terraform/stacks/local`:

```
terraform init
terraform apply -var allow_apply=true
```

That plans one logical guest for each of the 21 allowed Northline names. It does not open the other seven orgs, the management plane, or a default route. Passing `allow_apply` anywhere else is the same refusal until you set it on purpose.

Take the snapshot in `dist/snapshots/seed/smoke/` before a graded run. The file name is the scope hash. Do not give it to a harness.
