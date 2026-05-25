output "public_ip_address" {
  value = aws_instance.main.public_ip
}

output "ssh_command" {
  value = "ssh -i ~/.ssh/polyglot-aws-key.pem ubuntu@${aws_instance.main.public_ip}"
}

output "frontend_url" {
  value = "http://${aws_instance.main.public_ip}:3000"
}

output "backend_url" {
  value = "http://${aws_instance.main.public_ip}:5000"
}