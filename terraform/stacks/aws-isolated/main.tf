terraform {
  required_version = ">= 1.7"
}

variable "allow_apply" {
  type    = bool
  default = false
}

locals {
  scope       = jsondecode(file("${path.module}/../../../dist/range-scope.json"))
  deny_cidrs  = [for rule in local.scope.deny : rule.cidr]
  allow_cidrs = [for rule in local.scope.allow : rule.cidr]
  forbidden   = contains(local.deny_cidrs, "0.0.0.0/0") || contains(local.allow_cidrs, "0.0.0.0/0")
}

resource "terraform_data" "cage" {
  input = {
    substrate = "aws"
    hash      = sha256(jsonencode(local.scope))
  }

  lifecycle {
    precondition {
      condition     = var.allow_apply
      error_message = "Apply stays off until you pass -var allow_apply=true on a machine you own."
    }
    precondition {
      condition     = local.forbidden == false
      error_message = "A default route is not allowed."
    }
    precondition {
      condition     = contains(local.deny_cidrs, "10.16.16.0/20")
      error_message = "Management /20 must stay denied."
    }
  }
}
