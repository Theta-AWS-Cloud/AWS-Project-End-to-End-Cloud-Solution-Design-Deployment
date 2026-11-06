# Deployment Checklist

Steps to rebuild the whole setup from scratch, in order. Resource names are listed in [Environment setup](environment-setup.md).

1. **IAM.** Turn on MFA for root, then create the role-based groups and one IAM user per member (`firstname.lastname`).
2. **Budget.** Create the zero-spend budget `theta-zero-spend`, emailing the whole team, before launching anything.
3. **Networking.** Create `theta-vpc` with 2 public subnets in different Availability Zones and an Internet Gateway. Don't add a NAT gateway.
4. **EC2.** Launch `theta-web-ec2` (`t3.micro`, Amazon Linux 2023) with the role `theta-web-server-role` and the security group `theta-web-sg`, with no port 22. Install nginx, clone this repo to `/opt/app`, and have nginx serve the site from `/opt/app/app`.
5. **Target group.** Create `theta-tg` (HTTP 80, health check `/`) and register the instance.
6. **Certificate.** Request one public ACM certificate in `us-east-1` for `harvesthub.thetacloud.site` and `origin.harvesthub.thetacloud.site`, and validate it through DNS at Spaceship.
7. **Load balancer.** Create `theta-alb` (internet-facing, 2 AZs) with the security group `theta-alb-sg`. Add an HTTPS 443 listener with the certificate that forwards to `theta-tg`, and an HTTP 80 listener that redirects to 443. Point `origin.harvesthub` at the ALB with a CNAME at Spaceship.
8. **S3.** Create `theta-assets-2026nov` with Block all public access on, and upload `app/static/` to the bucket's `static/` folder.
9. **CloudFront.** Create the distribution for `harvesthub.thetacloud.site`.
   - Default behaviour: `origin.harvesthub.thetacloud.site`, HTTPS only, TLS 1.2, Redirect HTTP to HTTPS, CachingDisabled, AllViewerExceptHostHeader.
   - `/static/*` behaviour: the S3 bucket through OAC (`theta-assets-oac`), Redirect HTTP to HTTPS, CachingOptimized.
   - Add the bucket policy that allows only this distribution, and point `harvesthub` at CloudFront with a CNAME at Spaceship.
10. **Lockdown.** Limit `theta-alb-sg` to HTTPS 443 from `com.amazonaws.global.cloudfront.origin-facing`, and `theta-web-sg` to HTTP 80 from `theta-alb-sg`. Run the [lockdown tests](security.md#lockdown-tests-card-33).
11. **CI/CD.** Create the OIDC role `theta-github-deploy`, trusting only this repo's `main` branch. Add the GitHub Secrets `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION` and `EC2_INSTANCE_ID`, and set up the `production` environment. Merge to `main` and confirm the deploy.
12. **Monitoring.** Create the SNS topic `theta-alerts`, alarms for EC2 CPU above 80% and ALB 5xx rate above 5%, and send nginx logs to CloudWatch Logs with 7-day retention.

After grading, tear everything down and confirm the bill is zero.
