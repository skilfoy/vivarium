terraform {
  required_version = ">= 1.7"
}

variable "name" {
  type = string
}

resource "terraform_data" "workload" {
  input = var.name
}
