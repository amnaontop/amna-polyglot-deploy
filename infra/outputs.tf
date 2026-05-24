output "public_ip_address" {
  value = azurerm_public_ip.main.ip_address
}

output "ssh_command" {
  value = "ssh -i ~/.ssh/polyglot-key ${var.admin_username}@${azurerm_public_ip.main.ip_address}"
}

output "frontend_url" {
  value = "http://${azurerm_public_ip.main.ip_address}:3000"
}

output "backend_url" {
  value = "http://${azurerm_public_ip.main.ip_address}:5000"
}