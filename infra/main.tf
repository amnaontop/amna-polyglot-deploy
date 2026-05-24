resource "azurerm_resource_group" "main" {
  name     = var.project_name == "" ? "polyglot-rg" : "${var.project_name}-rg"
  location = var.location
  tags     = { Project = var.project_name }
}

locals {
  supported_vm_sizes = {
    centralindia  = "Standard_D2s_v3"
    westus2       = "Standard_B1ls"
    eastus        = "Standard_B1ls"
    southeastasia = "Standard_D2s_v3"
  }

  region  = trimspace(var.location)
  vm_size = trimspace(var.vm_size) == "" ? lookup(local.supported_vm_sizes, local.region, "Standard_D2s_v3") : trimspace(var.vm_size)
}

resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = { Project = var.project_name }
}

resource "azurerm_subnet" "public" {
  name                 = "${var.project_name}-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]

  depends_on = [azurerm_virtual_network.main]
}
resource "azurerm_subnet_network_security_group_association" "public" {
  subnet_id                 = azurerm_subnet.public.id
  network_security_group_id = azurerm_network_security_group.main.id
}

resource "azurerm_public_ip" "main" {
  name                = "${var.project_name}-pip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"        # Basic ki jagah Standard
  tags                = { Project = var.project_name }
}

resource "azurerm_network_security_group" "main" {
  name                = "${var.project_name}-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.allowed_ssh_ip != "" ? var.allowed_ssh_ip : "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Frontend"
    priority                   = 1003
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Backend"
    priority                   = 1004
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = { Project = var.project_name }
}

resource "azurerm_network_interface" "main" {
  name                = "${var.project_name}-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.public.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.main.id
  }
}

resource "azurerm_linux_virtual_machine" "main" {
  name                = "${var.project_name}-vm"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = local.vm_size
  admin_username      = var.admin_username

  network_interface_ids = [azurerm_network_interface.main.id]
  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  custom_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    apt-get update -y
    apt-get install -y git docker.io docker-compose
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ${var.admin_username}

    APP_DIR="/home/${var.admin_username}/app"
    rm -rf "$APP_DIR"
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"

    git clone --depth 1 --branch feature/dockerization https://github.com/amnaontop/amna-polyglot-deploy.git .
    docker-compose down || true
    docker-compose build
    docker-compose up -d
    chown -R ${var.admin_username}:${var.admin_username} "$APP_DIR"
  EOF
  )

  tags = { Project = var.project_name }
}