terraform {
  required_version = ">= 1.7"
}

variable "name" {
  type = string
}

# Directory and enrollment answer from the smoke service.
# This is not a Windows certificate authority and it does not apply.
resource "terraform_data" "identity" {
  input = var.name
}
