terraform {
  required_version = ">= 1.7"
}

variable "allow_apply" {
  type    = bool
  default = false
}

variable "scope_hash" {
  type        = string
  description = "Optional hash from dist/range-scope.sha256. Apply refuses a mismatch."
  default     = ""
}

locals {
  scope      = jsondecode(file("${path.module}/../../../dist/range-scope.json"))
  nft_rules  = file("${path.module}/../../../dist/forward.nft")
  deny_cidrs = [for rule in local.scope.deny : rule.cidr]
  allow_cidrs = [for rule in local.scope.allow : rule.cidr]
  scope_id   = sha256(jsonencode(local.scope))
  forbidden  = contains(local.deny_cidrs, "0.0.0.0/0") || contains(local.allow_cidrs, "0.0.0.0/0")
}

resource "terraform_data" "cage" {
  input = {
    hash = local.scope_id
    nft  = local.nft_rules
  }

  lifecycle {
    precondition {
      condition     = var.allow_apply
      error_message = "Local apply stays off until you pass -var allow_apply=true on a machine you own."
    }
    precondition {
      condition     = local.forbidden == false
      error_message = "A default route is not allowed."
    }
    precondition {
      condition     = contains(local.deny_cidrs, "10.16.16.0/20")
      error_message = "Management /20 must stay denied."
    }
    precondition {
      condition     = contains(local.deny_cidrs, "10.254.0.0/24")
      error_message = "Fake internet must stay denied."
    }
    precondition {
      condition     = var.scope_hash == "" || var.scope_hash == local.scope_id
      error_message = "scope_hash does not match the compiled scope."
    }
  }
}

module "pool" {
  source      = "../../modules/compute-pool"
  allow_apply = var.allow_apply
  hosts = [
    for name in local.scope.names : {
      fqdn = name.fqdn
      ip   = name.ip
    }
  ]
}

output "pool_guests" {
  value = module.pool.guest_count
}

output "scope_hash" {
  value = local.scope_id
}
