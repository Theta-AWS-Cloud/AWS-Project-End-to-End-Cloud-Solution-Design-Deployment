# Security

## Security groups & open ports (card 32)

| Security group | Port | Source | Why |
|---|---|---|---|
| `theta-alb-sg` | 443 (HTTPS) | CloudFront managed prefix list (`com.amazonaws.global.cloudfront.origin-facing`) | Only CloudFront can reach the ALB |
| `theta-web-sg` | 80 (HTTP) | `theta-alb-sg` | Only the ALB can reach the server |

**SSH is removed.** `theta-web-sg` has no port 22 rule. Admin access goes through AWS Systems Manager (SSM), which doesn't use inbound ports.

**Port 80 on the ALB.** The ALB's port 80 listener redirects to 443, but port 80 isn't open in `theta-alb-sg`. CloudFront connects to the ALB on 443 only, and CloudFront handles the HTTP to HTTPS redirect for visitors.

## Lockdown tests (card 33)

All tests pass. The ALB and EC2 addresses are left out on purpose, because this repo is public.

| Test | Expected | Result |
|---|---|---|
| `https://harvesthub.thetacloud.site` | 200 | ✅ 200 |
| `http://harvesthub.thetacloud.site` | Redirect to HTTPS | ✅ 301 to HTTPS |
| `/static/css/style.css` through the domain | Served from S3 and cached | ✅ 200 from AmazonS3, cached on repeat requests |
| `https://origin.harvesthub.thetacloud.site` (ALB) | Blocked | ✅ Timeout |
| ALB raw DNS name | Blocked | ✅ Timeout (curl exit code 28) |
| EC2 public IP | Blocked | ✅ Timeout (curl exit code 28) |
| Direct S3 URL | Blocked | ✅ 403 Forbidden |

## If something breaks

| What you see | Cause | Fix |
|---|---|---|
| 504 on the site | The ALB security group rule is wrong | Check the prefix-list rule on `theta-alb-sg` is HTTPS 443, not 80 |
| 502, or the target is unhealthy | The server security group rule is wrong | Check `theta-web-sg` allows HTTP 80 from `theta-alb-sg` |
| Pages load as plain text with no styling | CSS, JS or images aren't loading from S3 | Check the `/static/*` CloudFront behaviour, Origin Access Control (`theta-assets-oac`) and the bucket policy |
| The deploy fails | Not a security group problem | SSM doesn't use inbound ports, so check the SSM side and the workflow run |

## Encryption in transit

- Visitor to CloudFront: HTTPS. HTTP redirects to HTTPS.
- CloudFront to the ALB: HTTPS only, TLS 1.2, through `origin.harvesthub.thetacloud.site`.
- ALB to EC2: HTTP on port 80 inside the VPC. HTTPS ends at the load balancer, and `theta-web-sg` only accepts this traffic from the ALB.
- CloudFront to S3: signed requests through Origin Access Control.

The certificate is a public ACM certificate in `us-east-1`, DNS-validated, covering both `harvesthub.thetacloud.site` and `origin.harvesthub.thetacloud.site`.

## Storage

- `theta-assets-2026nov` has Block all public access turned on.
- The bucket policy allows reads only from our CloudFront distribution, through `theta-assets-oac`.

## Access & permissions

| Identity | Used by | Allows |
|---|---|---|
| `theta-web-server-role` | The EC2 instance | SSM management (`AmazonSSMManagedInstanceCore`) and the CloudWatch agent (`CloudWatchAgentServerPolicy`) |
| `theta-github-deploy` | GitHub Actions, through OIDC with no stored keys | Trusts only this repo's `main` branch. Can only run SSM commands on our instance, sync the bucket's `static/` folder, and invalidate our distribution |
| `theta-devops-server-access` | The `DevOps` IAM group | Server access for the DevOps role, alongside its read-only policies |

Root has MFA and was used only for first-time setup. Every member has their own IAM user in a role-based group, with no policies attached directly to users. CloudTrail records who did what.

## Least privilege (card 31)
- Before: *screenshot / summary*
- After: *screenshot / summary*

## Known trade-offs
- HTTPS runs from the visitor to the load balancer, using an ACM certificate in `us-east-1`. ALB → EC2 runs over HTTP on port 80 inside the VPC. The ALB only accepts traffic from CloudFront.

## Deploy access
- GitHub Actions assumes the IAM role `theta-github-deploy` through OIDC, with no stored keys.
- The deploy runs on the instance through SSM (`AWS-RunShellScript`), not SSH.
- The EC2 instance uses the role `theta-web-server-role`.
