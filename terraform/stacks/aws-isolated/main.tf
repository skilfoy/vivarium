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
      error_message = "Isolated-cloud apply is disabled until the hardware decision in the decision log is closed."
    }
  }
}
