# OPTIONAL managed Postgres. The app's system of record is Supabase today, so this module is
# off by default (enabled = false). Enable it only if you migrate to self-managed RDS.
variable "name" { type = string }
variable "enabled" { default = false }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "allowed_security_group_id" { type = string }
variable "instance_class" { default = "db.t4g.medium" }
variable "multi_az" { default = false }
variable "backup_retention_days" { default = 14 }

resource "aws_db_subnet_group" "this" {
  count      = var.enabled ? 1 : 0
  name       = var.name
  subnet_ids = var.private_subnet_ids
}
resource "aws_security_group" "db" {
  count       = var.enabled ? 1 : 0
  name_prefix = "${var.name}-db-"
  vpc_id      = var.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.allowed_security_group_id]
  }
}
resource "aws_db_instance" "this" {
  count                       = var.enabled ? 1 : 0
  identifier                  = var.name
  engine                      = "postgres"
  engine_version              = "16"
  instance_class              = var.instance_class
  allocated_storage           = 50
  max_allocated_storage       = 500
  storage_encrypted           = true
  username                    = "app"
  manage_master_user_password = true # password lives in Secrets Manager and rotates automatically
  db_subnet_group_name        = aws_db_subnet_group.this[0].name
  vpc_security_group_ids      = [aws_security_group.db[0].id]
  multi_az                    = var.multi_az
  backup_retention_period     = var.backup_retention_days
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.name}-final"
  performance_insights_enabled = true
  enabled_cloudwatch_logs_exports = ["postgresql"]
  auto_minor_version_upgrade  = true
  lifecycle { prevent_destroy = true }
}
output "endpoint" { value = var.enabled ? aws_db_instance.this[0].endpoint : null }
output "identifier" { value = var.enabled ? aws_db_instance.this[0].identifier : null }
