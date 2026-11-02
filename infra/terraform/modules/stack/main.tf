# One full environment: network + service + storage + (optional) database + alarms.
variable "env" { type = string }
variable "image" { type = string }
variable "domain_name" { type = string }
variable "hosted_zone_id" { type = string }
variable "alert_email" { type = string }
variable "secret_arns" { type = map(string) }
variable "cpu" { default = 512 }
variable "memory" { default = 1024 }
variable "min_tasks" { default = 2 }
variable "max_tasks" { default = 10 }
variable "single_nat" { default = true }
variable "protect" {
  description = "Deletion protection on stateful/edge resources (true for prod)."
  default     = false
}
variable "monthly_budget_usd" { default = 200 }
variable "enable_database" { default = false }
variable "tmdb_region" { default = "GB" }

locals { name = "worldstreaming-${var.env}" }

module "network" {
  source     = "../network"
  name       = local.name
  single_nat = var.single_nat
}
module "service" {
  source              = "../ecs-service"
  name                = local.name
  vpc_id              = module.network.vpc_id
  public_subnet_ids   = module.network.public_subnet_ids
  private_subnet_ids  = module.network.private_subnet_ids
  image               = var.image
  domain_name         = var.domain_name
  hosted_zone_id      = var.hosted_zone_id
  cpu                 = var.cpu
  memory              = var.memory
  min_tasks           = var.min_tasks
  max_tasks           = var.max_tasks
  deletion_protection = var.protect
  secret_arns         = var.secret_arns
  environment = {
    APP_ENV          = var.env
    SERVICE_NAME     = "worldstreaming-web"
    APP_URL             = "https://${var.domain_name}"
    TMDB_REGION      = var.tmdb_region
  }
}
module "storage" {
  source        = "../storage"
  name          = "${local.name}-data"
  force_destroy = !var.protect
}
module "database" {
  source                    = "../database"
  name                      = local.name
  enabled                   = var.enable_database
  vpc_id                    = module.network.vpc_id
  private_subnet_ids        = module.network.private_subnet_ids
  allowed_security_group_id = module.service.task_security_group_id
  multi_az                  = var.protect
}
module "monitoring" {
  source                  = "../monitoring"
  name                    = local.name
  alb_arn_suffix          = module.service.alb_arn_suffix
  target_group_arn_suffix = module.service.target_group_arn_suffix
  cluster_name            = module.service.cluster_name
  service_name            = module.service.service_name
  alert_email             = var.alert_email
  monthly_budget_usd      = var.monthly_budget_usd
}

output "ecr_repository_url" { value = module.service.ecr_repository_url }
output "cluster_name" { value = module.service.cluster_name }
output "service_name" { value = module.service.service_name }
output "url" { value = "https://${var.domain_name}" }
