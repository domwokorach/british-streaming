terraform {
  required_version = ">= 1.10"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.70" } }
  backend "s3" {
    # bucket is supplied at init time:  terraform init -backend-config="bucket=<state_bucket output of bootstrap>"
    key          = "worldstreaming/dev/terraform.tfstate"
    region       = "eu-west-2"
    encrypt      = true
    use_lockfile = true # S3-native state locking (Terraform >= 1.10); no DynamoDB table needed
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { Project = "worldstreaming", Environment = "dev", ManagedBy = "terraform", CostCenter = "streaming-platform" }
  }
}

variable "region" { default = "eu-west-2" }
variable "root_domain" { type = string }
variable "hosted_zone_id" { type = string }
variable "alert_email" { type = string }
variable "image" {
  description = "Image reference pinned by digest; set by CI on every deploy."
  type        = string
}
variable "secret_arns" {
  description = "ENV_NAME => Secrets Manager ARN (TMDB_API_READ_TOKEN, SUPABASE_SECRET_KEY, METRICS_TOKEN)."
  type        = map(string)
}

module "stack" {
  source         = "../../modules/stack"
  env            = "dev"
  image          = var.image
  hosted_zone_id = var.hosted_zone_id
  alert_email    = var.alert_email
  secret_arns    = var.secret_arns
  cpu = 256
  memory = 512
  min_tasks = 1
  max_tasks = 2
  single_nat = true
  protect = false
  monthly_budget_usd = 80
  domain_name = "dev.${var.root_domain}"
}

output "ecr_repository_url" { value = module.stack.ecr_repository_url }
output "cluster_name" { value = module.stack.cluster_name }
output "service_name" { value = module.stack.service_name }
output "url" { value = module.stack.url }
