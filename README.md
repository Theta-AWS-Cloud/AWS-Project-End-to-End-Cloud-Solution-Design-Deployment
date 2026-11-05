# End-to-End Cloud Solution Design & Deployment

A secure, highly available and scalable web application deployed on AWS, built as a group project using GitHub for version control and Trello for project management. The design aims to keep costs within the AWS Free Tier (or the free plan credits on newer AWS accounts).

---

## The Problem

A fast-growing startup has launched a new web application, but users are dealing with:

- Slow page load times
- Inconsistent availability during peak traffic
- Concerns about the security of the application
- No structured deployment process, which makes collaboration hard and increases the risk of deployment errors

They need a secure, highly available and scalable cloud solution that fits a limited budget and supports future growth.

## Our Solution

Users reach the app over HTTPS through **Amazon CloudFront**, which caches content close to them. CloudFront routes requests by path:

- **`/static/*`** (images, CSS, JS) is served from a private **S3** bucket, readable only by CloudFront through Origin Access Control (OAC).
- **Everything else** is forwarded over HTTP to an **Application Load Balancer**, which spreads traffic across **two EC2 instances in two Availability Zones**. If one instance or AZ fails, the other keeps serving.

Security groups lock the path down: the ALB only accepts traffic from CloudFront, and the EC2 instances only accept traffic from the ALB. **GitHub Actions** deploys the app to the instances and syncs static assets to S3, and **CloudWatch** monitors health and errors.

### Architecture

![HarvestHub architecture](docs/architecture.svg)

**Design decisions**

- **HTTP between CloudFront and the ALB.** Users always connect over HTTPS. The CloudFront-to-ALB hop uses HTTP to avoid needing a custom domain and a second certificate. The ALB security group only allows the CloudFront managed prefix list, so the ALB can't be reached directly.
- **Public subnets for EC2.** Private subnets would need a NAT Gateway (~$30+/month), which breaks the budget. Instead, the instances sit in public subnets, but their security group only accepts traffic from the ALB.
- **Two instances minimum.** One instance per AZ is the baseline for high availability. An Auto Scaling Group is optional and only for scaling beyond two.
- **Default CloudFront domain.** The app is served on the free `*.cloudfront.net` domain, which already includes HTTPS. If a custom domain is added later, its ACM certificate **must be requested in `us-east-1`**.

---

## Tech Stack

| Area              | Tools                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| Compute           | Amazon EC2 (`t3.micro`), 2 instances across 2 AZs, Auto Scaling Group (optional)   |
| Networking        | VPC, 2 public subnets, Internet Gateway                                            |
| Load balancing    | Application Load Balancer, Target Group                                            |
| CDN & HTTPS       | Amazon CloudFront (ACM only if a custom domain is added)                           |
| Storage           | Amazon S3 (static assets, private via Origin Access Control)                       |
| Security          | IAM (least privilege), Security Groups, CloudFront managed prefix list, CloudTrail |
| CI/CD             | GitHub Actions (OIDC to an IAM role, no stored access keys)                        |
| Monitoring & cost | CloudWatch Alarms & Logs (CloudWatch agent on EC2), AWS Budgets                    |
| Collaboration     | GitHub, Trello                                                                     |
| Web app           | HTML / CSS / JavaScript                                                            |

---

## Repository Structure

```
.
├── app/                  # Web application source
│   ├── assets/images/    # Images (uploaded to S3 under /static/)
│   ├── css/              # Stylesheets
│   └── js/               # Scripts
├── docs/                 # Architecture diagram, screenshots, notes
├── LICENSE
└── README.md
```

Planned: `scripts/` (deployment and setup scripts) and `.github/workflows/` (CI/CD pipeline, Phase 4).

---

## Branching Strategy

| Branch                 | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `main`                 | Production-ready code only. Pushes here trigger deployment.              |
| `Develop`              | Integration branch where finished features come together and get tested. |
| `feature/<short-name>` | One branch per task, e.g. `feature/alb-setup`, `feature/home-page`.      |

> Branch names are case-sensitive: the integration branch is `Develop` with a capital **D**.

**Workflow**

1. Pick a card on Trello and assign yourself.
2. Get the latest integration branch and branch from it:
   ```bash
   git fetch origin
   git checkout -b feature/<short-name> origin/Develop
   ```
3. Commit small, clear changes.
4. Open a Pull Request into `Develop` and get at least one teammate to review it.
5. When `Develop` is stable, open a PR from `Develop` into `main`.

No direct pushes to `main`.

---

## Environment Setup (Phase 1)

### 1. AWS account & IAM

- We created a new AWS account and signed in as the root user only once, to enable MFA and create individual IAM users.
- After that initial setup, root credentials are locked away and reserved for emergency/account-recovery use only.
- Each team member has their own IAM user with a personal username, password, and MFA device.
- Everyone signs in through the account's IAM sign-in link using their own credentials. No one uses the root account for daily work.
- The team works within the same AWS account and shares its resources. Access is scoped per person through IAM group permissions (least privilege).
- CloudTrail logs all activity under each individual user's identity, so actions can be traced back to the person who performed them.

### 2. AWS CLI

Install the AWS CLI v2, then set up a named profile:

```bash
aws configure --profile <profile-name>
aws sts get-caller-identity --profile <profile-name>   # check it works
```

Never commit access keys to this repo.

### 3. Networking

- VPC with **two public subnets in different Availability Zones** (e.g. AZ-a and AZ-b) and an Internet Gateway.
- Region: `<region>`

### 4. Security groups

| Security group | Inbound rule | Source                                                                           |
| -------------- | ------------ | -------------------------------------------------------------------------------- |
| ALB SG         | HTTP 80      | CloudFront managed prefix list (`com.amazonaws.global.cloudfront.origin-facing`) |
| EC2 SG         | HTTP 80      | ALB SG                                                                           |
| EC2 SG         | SSH 22       | Team IPs only (or use SSM Session Manager and skip SSH entirely)                 |

EC2 doesn't need port 443 because HTTPS is handled by CloudFront.

### 5. EC2

- Instance type: `t3.micro` (Free Tier eligible)
- One instance in each public subnet (2 total).
- Attach an IAM instance role with permissions for the CloudWatch agent (and SSM, if used).

### 6. S3

- Bucket name: `<bucket-name>`
- Used for static assets, served under `/static/*`.
- Block all public access. Reads are allowed only through CloudFront OAC.

---

## Project Phases

- [ ] **Phase 1:** Project setup & environment configuration
- [ ] **Phase 2:** Web app development & deployment (EC2 + ALB)
- [ ] **Phase 3:** Security hardening & CloudFront integration
- [ ] **Phase 4:** CI/CD pipeline, monitoring & cost management
- [ ] **Phase 5:** Presentation & project showcase

---

## Project Management

Tasks are tracked on Trello with the columns **Backlog → In Progress → Review → Done**.

Trello board: `<link>`

---

## Live Demo

CloudFront URL: `<coming soon>`

---

## Documentation
- [Environment setup](docs/environment-setup.md)
- [Security](docs/security.md)
- [Deployment checklist](docs/deployment-checklist.md)

---

## Team

| Name     | Role     |
| -------- | -------- |
| `<name>` | `<role>` |
| `<name>` | `<role>` |
| `<name>` | `<role>` |

---

## Cost Notes

This project is designed to stay within the AWS Free Tier. AWS changed the Free Tier for accounts created after mid-2025 to a credit-based free plan, so check which plan the account is on in the Billing console. An AWS Budgets alert warns us before costs go over the limit.

Remember to **stop or delete resources** (especially the ALB and EC2 instances) when they're not in use. We avoid NAT Gateways for the same reason.
