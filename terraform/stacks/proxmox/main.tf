terraform {
  required_version = ">= 1.7"
}

variable "allow_apply" {
  type    = bool
  default = false
}

resource "terraform_data" "refused" {
  lifecycle {
    precondition {
      condition     = var.allow_apply
      error_message = "Apply stays off until you pass -var allow_apply=true on a machine you own."
    }
  }
}
