# One-time, per AWS account: remote state bucket (versioned, encrypted) + the GitHub OIDC trust
# so CI never holds long-lived AWS keys.  Run locally with admin credentials:
#   terraform init && terraform apply -var 'github_repo=OWNER/REPO'
terraform {
  required_version = ">= 1.10"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.70" } }
}
variable "region" { default = "eu-west-2" }
variable "github_repo" { type = string }
provider "aws" { region = var.region }

resource "aws_s3_bucket" "state" {
  bucket = "worldstreaming-tfstate-${data.aws_caller_identity.me.account_id}"
  lifecycle { prevent_destroy = true }
}
data "aws_caller_identity" "me" {}
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration { status = "Enabled" }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "aws:kms" } }
}
resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# Plan role: read-only, assumable from any ref (PRs). Apply/deploy roles: only from protected GitHub environments.
data "aws_iam_policy_document" "trust" {
  for_each = { plan = "repo:${var.github_repo}:*", deploy = "repo:${var.github_repo}:environment:*" }
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [each.value]
    }
  }
}
resource "aws_iam_role" "ci" {
  for_each           = data.aws_iam_policy_document.trust
  name               = "worldstreaming-ci-${each.key}"
  assume_role_policy = each.value.json
  max_session_duration = 3600
}
resource "aws_iam_role_policy_attachment" "plan_readonly" {
  role       = aws_iam_role.ci["plan"].name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}
# Deploy role: scope this down to the resources your stack manages before using it in production.
resource "aws_iam_role_policy_attachment" "deploy_power" {
  role       = aws_iam_role.ci["deploy"].name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}
output "state_bucket" { value = aws_s3_bucket.state.bucket }
output "plan_role_arn" { value = aws_iam_role.ci["plan"].arn }
output "deploy_role_arn" { value = aws_iam_role.ci["deploy"].arn }
