# Deployment Checklist

Steps to rebuild the whole setup from scratch, in order. *Fill in each step as its card is completed (card 39).*

1. IAM groups and users
2. EC2 security group
3. EC2 instance + `scripts/setup.sh`
4. S3 bucket and static assets
5. Target group
6. ALB security group + Application Load Balancer
7. CloudFront distribution
8. S3 locked to CloudFront (OAC)
9. Security groups restricted to CloudFront / ALB
10. GitHub Secrets + deploy workflow
11. CloudWatch alarms + SNS
12. CloudWatch Logs (7-day retention)
13. Budgets alert
