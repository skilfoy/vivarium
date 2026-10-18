terraform {
  required_version = ">= 1.7"
}

variable "allow_apply" {
  type = bool
}

variable "hosts" {
  type = list(object({
    fqdn = string
    ip   = string
  }))
}

resource "terraform_data" "guest" {
  for_each = { for host in var.hosts : host.fqdn => host }
  input    = each.value

  lifecycle {
    precondition {
      condition     = var.allow_apply
      error_message = "The compute pool stays off until allow_apply is true on a machine you own."
    }
    precondition {
      condition     = !startswith(each.value.ip, "10.16.16.")
      error_message = "Management addresses are not pool guests."
    }
  }
}

output "guest_count" {
  value = length(terraform_data.guest)
}
