# Environment Setup

## Account & access model
- We use one team member's AWS account.
- The root user signs in only for first-time setup (MFA on root, billing access, an admin IAM user). After that, root credentials are locked away for emergencies only.
- Each team member has their own IAM user and password, and signs in through the account's IAM sign-in link.
- Access is scoped per person through IAM groups (least privilege).
- CloudTrail logs every action under each user's name.

## IAM groups
| Group | Role | Policies |
|---|---|---|
| Admins | Account owner | AdministratorAccess |
| Cloud_Architect | Lead & Cloud Architect | AmazonEC2FullAccess, CloudFrontFullAccess |
| Security | Security | IAMFullAccess, AmazonEC2FullAccess, AmazonS3FullAccess, CloudFrontFullAccess, SecurityAudit |
| App_Developer | App Developer | AmazonEC2FullAccess, AmazonS3FullAccess |
| DevOps | DevOps | AmazonEC2ReadOnlyAccess, CloudWatchReadOnlyAccess |
| Monitoring_Docs | Monitoring & Documentation | CloudWatchFullAccess, AmazonSNSFullAccess, ReadOnlyAccess |
| Cost_Presentation | Cost & Presentation | Billing, ReadOnlyAccess |

## AWS CLI setup (Ubuntu / WSL)
1. Install the CLI:
   ```bash
   sudo apt update && sudo apt install unzip -y
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip && sudo ./aws/install
   ```
2. Create the profile: `aws configure --profile theta`
3. Test it: `aws sts get-caller-identity --profile theta`

Never commit access keys to this repo.

## Region & resource names
- Region: `us-east-1`
- Network: theta-vpc

| Resource | Name |
|---|---|
| EC2 security group | theta-ec2-sg |
| ALB security group | theta-alb-sg |
| VPC | theta-vpc |
| EC2 instance | theta-web-ec2 (Amazon Linux 2023, nginx) |
| EC2 instance role | theta-web-server-role |
| GitHub Actions deploy role | theta-github-deploy |
| Key pair | theta-key |
| S3 bucket | theta-static-... |
| Target group | theta-tg |
| Load balancer | theta-alb |
| Site domain | harvesthub.thetacloud.site |
| CloudFront origin domain | origin.harvesthub.thetacloud.site |
| ACM certificate | us-east-1, used by CloudFront and the ALB |
| Budget | theta-zero-spend |
| Alarm email topic | theta-alerts |
