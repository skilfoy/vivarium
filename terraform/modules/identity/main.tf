terraform {
  required_version = ">= 1.7"
}

variable "name" {
  type = string
}

# Directory, enrollment, and the identity portal land in M2.
# The smoke slice uses the first-party stand-in instead of Windows media.
resource "terraform_data" "identity" {
  input = var.name
}
