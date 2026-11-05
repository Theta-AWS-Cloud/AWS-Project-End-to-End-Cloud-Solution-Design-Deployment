# Security

## Security groups & open ports
| Security group | Port | Source | Why |
|---|---|---|---|
| theta-alb-sg | 443 (HTTPS) | CloudFront managed prefix list | CloudFront to the ALB |
| theta-ec2-sg | 80 (HTTP) | theta-alb-sg | ALB to EC2, inside the VPC |

The ALB's HTTP port 80 listener redirects to 443.

## Least privilege (card 31)
- Before: *screenshot / summary*
- After: *screenshot / summary*

## Known trade-offs
- HTTPS runs from the visitor to the load balancer, using an ACM certificate in `us-east-1`. ALB → EC2 runs over HTTP on port 80 inside the VPC. The ALB only accepts traffic from CloudFront.

## Deploy access
- GitHub Actions assumes the IAM role `theta-github-deploy` through OIDC, with no stored keys.
- The deploy runs on the instance through SSM (`AWS-RunShellScript`), not SSH.
- The EC2 instance uses the role `theta-web-server-role`.
