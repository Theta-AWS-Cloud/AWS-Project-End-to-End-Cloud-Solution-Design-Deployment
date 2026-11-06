# Security

## Security groups & open ports (card 32)

| Security group | Port | Source | Why |
|---|---|---|---|
| `theta-alb-sg` | 443 (HTTPS) | CloudFront managed prefix list (`com.amazonaws.global.cloudfront.origin-facing`) | Only CloudFront can reach the ALB |
| `theta-web-sg` | 80 (HTTP) | `theta-alb-sg` | Only the ALB can reach the server |

**SSH is removed.** `theta-web-sg` has no port 22 rule. Admin access goes through AWS Systems Manager (SSM), which doesn't use inbound ports.

**Port 80 on the ALB.** The ALB's port 80 listener redirects to 443, but port 80 isn't open in `theta-alb-sg`. CloudFront connects to the ALB on 443 only, and CloudFront handles the HTTP to HTTPS redirect for visitors.

## Least privilege (card 31)
- Before: *screenshot / summary*
- After: *screenshot / summary*

## Known trade-offs
- HTTPS runs from the visitor to the load balancer, using an ACM certificate in `us-east-1`. ALB → EC2 runs over HTTP on port 80 inside the VPC. The ALB only accepts traffic from CloudFront.

## Deploy access
- GitHub Actions assumes the IAM role `theta-github-deploy` through OIDC, with no stored keys.
- The deploy runs on the instance through SSM (`AWS-RunShellScript`), not SSH.
- The EC2 instance uses the role `theta-web-server-role`.
