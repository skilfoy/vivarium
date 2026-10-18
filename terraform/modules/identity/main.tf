terraform {
  required_version = ">= 1.7"
}

variable "name" {
  type = string
}

# The smoke portal stands in front of the first-party apps.
# It is not a Keycloak install, and it does not apply.
resource "terraform_data" "identity" {
  input = var.name
}
