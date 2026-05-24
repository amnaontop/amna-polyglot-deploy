variable "location" {
  description = "Azure region"
  type        = string
  default     = "centralindia"

  validation {
    condition = contains(["centralindia", "westus2", "eastus", "southeastasia"], trimspace(var.location))
    error_message = "location must be one of centralindia, westus2, eastus, or southeastasia."
  }
}

variable "project_name" {
  description = "Prefix for all resources"
  type        = string
  default     = "polyglot"
}

variable "vm_size" {
  description = "Azure VM size; leave blank to auto-select a supported size for the chosen region"
  type        = string
  default     = ""

  validation {
    condition = var.vm_size == "" || contains([
      "Standard_A1_v2",
      "Standard_B1ls",
      "Standard_B2s",
      "Standard_DS1_v2",
      "Standard_D2s_v3",
      "Standard_F2s_v2",
    ], var.vm_size)
    error_message = "vm_size must be blank or one of Standard_A1_v2, Standard_B1ls, Standard_B2s, Standard_DS1_v2, Standard_D2s_v3, or Standard_F2s_v2."
  }
}

variable "admin_username" {
  description = "VM login username"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/polyglot-key.pub"
}

variable "allowed_ssh_ip" {
  description = "Your public IP for SSH access"
  type        = string
}