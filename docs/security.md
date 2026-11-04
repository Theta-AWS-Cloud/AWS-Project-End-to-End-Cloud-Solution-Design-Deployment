# Security

## Security groups & open ports
| Security group | Port | Source | Why |
|---|---|---|---|
| theta-ec2-sg | 22 (SSH) | Team IPs | Admin access and deploys |
| theta-ec2-sg | 80 (HTTP) | Anywhere (temporary, Phase 2 testing) | Changed to theta-alb-sg in card 30 |
| theta-alb-sg | 80 (HTTP) | *To be added in card 22* | |

*Update this table after card 30 with the final rules.*

## Least privilege (card 31)
- Before: *screenshot / summary*
- After: *screenshot / summary*

## Known trade-offs
- CloudFront → ALB runs over HTTP, because there's no custom domain for a certificate. The ALB only accepts traffic from CloudFront.
- SSH (22) stays open for the GitHub Actions deploy, with key-only login.
