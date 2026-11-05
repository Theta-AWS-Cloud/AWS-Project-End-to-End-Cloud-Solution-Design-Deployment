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

Users reach the app at https://harvesthub.thetacloud.site over HTTPS through **Amazon CloudFront**. CloudFront routes requests by path:

- **`/static/*`** (images, CSS, JS) is cached by CloudFront and served from a private **S3** bucket, readable only by CloudFront through Origin Access Control (OAC).
- **Everything else** (pages and `/data/*.json`) is not cached and goes over HTTPS to an **Application Load Balancer**, which forwards it over HTTP on port 80 inside the VPC to **one EC2 instance** running nginx.

Security groups lock the path down: the ALB only accepts traffic from CloudFront, and the EC2 instance only accepts traffic from the ALB. **GitHub Actions** deploys the app to the instance through SSM and syncs static assets to S3, and **CloudWatch** monitors health and errors.

### Architecture

![HarvestHub architecture](docs/architecture.svg)

**Design decisions**

- **HTTPS from the visitor to the load balancer.** Visitors connect to CloudFront over HTTPS, and CloudFront connects to the ALB over HTTPS on port 443 via `origin.harvesthub.thetacloud.site`, using the same ACM certificate. The ALB's HTTP port 80 listener redirects to 443. From the ALB to EC2, traffic uses HTTP on port 80 inside the VPC. The ALB security group only allows the CloudFront managed prefix list, so the ALB can't be reached directly.
- **Public subnets for EC2.** Private subnets would need a NAT Gateway (~$30+/month), which breaks the budget. Instead, the instance sits in a public subnet, but its security group only accepts traffic from the ALB.
- **One EC2 instance for now.** A single instance (`theta-web-ec2`) keeps costs down, but if it or its Availability Zone fails, the site is down until it's restored. Auto Scaling is optional and not set up.
- **Custom domain.** The app is served on `harvesthub.thetacloud.site`, with its ACM certificate in `us-east-1`, the region CloudFront requires.
- **Caching.** CloudFront's default behaviour uses CachingDisabled, so pages and `/data/*.json` are never cached. Only `/static/*` is cached (CachingOptimized), so each deploy creates an invalidation.

---

## Tech Stack

| Area              | Tools                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| Compute           | Amazon EC2 (`t3.micro`), 1 instance (`theta-web-ec2`, Amazon Linux 2023, nginx); Auto Scaling optional, not set up |
| Networking        | VPC (`theta-vpc`), 2 public subnets, Internet Gateway                              |
| Load balancing    | Application Load Balancer, Target Group                                            |
| CDN & HTTPS       | Amazon CloudFront, custom domain, ACM certificate in `us-east-1`                   |
| Storage           | Amazon S3 (static assets, private via Origin Access Control)                       |
| Security          | IAM (least privilege), Security Groups, CloudFront managed prefix list, CloudTrail |
| CI/CD             | GitHub Actions (OIDC to `theta-github-deploy`, no stored access keys), deploys through SSM |
| Monitoring & cost | CloudWatch Alarms & Logs (CloudWatch agent on EC2), AWS Budgets                    |
| Collaboration     | GitHub, Trello                                                                     |
| Web app           | HTML / CSS / JavaScript                                                            |

---

## Repository Structure

```
.
├── app/                  # Web application source
│   ├── *.html            # Pages (served from EC2)
│   ├── data/             # JSON data (served from EC2, not cached)
│   └── static/           # Uploaded to S3 and served under /static/
│       ├── css/          # Stylesheets
│       ├── images/       # Images
│       └── js/           # Scripts
├── docs/                 # Architecture diagram, setup and security notes, image credits
├── LICENSE
└── README.md
```

Planned: `scripts/` (deployment and setup scripts) and `.github/workflows/` (CI/CD pipeline, Phase 4).

### Local testing

Pages load their data with `fetch`, so opening them directly from disk won't work. Run a local web server instead:

```bash
cd app
python3 -m http.server
```

Then open http://localhost:8000.

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

- VPC (`theta-vpc`) with **two public subnets in different Availability Zones** (e.g. AZ-a and AZ-b) and an Internet Gateway.
- Region: `us-east-1`

### 4. Security groups

| Security group | Inbound rule | Source                                                                           |
| -------------- | ------------ | -------------------------------------------------------------------------------- |
| ALB SG         | HTTPS 443    | CloudFront managed prefix list (`com.amazonaws.global.cloudfront.origin-facing`) |
| EC2 SG         | HTTP 80      | ALB SG                                                                           |

The ALB's HTTP port 80 listener redirects to 443. EC2 doesn't need port 443 because HTTPS ends at the ALB. Deploys don't use SSH: GitHub Actions assumes `theta-github-deploy` through OIDC and runs on the instance through SSM (`AWS-RunShellScript`).

### 5. EC2

- Instance type: `t3.micro` (Free Tier eligible)
- One instance: `theta-web-ec2` (Amazon Linux 2023, nginx).
- Attach the IAM instance role `theta-web-server-role`, with permissions for the CloudWatch agent and SSM.

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

Live site: https://harvesthub.thetacloud.site

---

## Documentation
- [Environment setup](docs/environment-setup.md)
- [Security](docs/security.md)
- [Deployment checklist](docs/deployment-checklist.md)
- [Image credits](docs/image-credits.md)

---

## Team

| Name                  | Role                           | Responsibilities                                                                                                                                                                                                                          |
| --------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bismark Hayford       | Project Lead & Cloud Architect | Leads the team, Trello upkeep and close-out, sets deadlines, owns architecture design, ALB, Auto Scaling, CloudFront                                                                                                                      |
| Theophilus Nuworku    | App Developer                  | Web app build, EC2 hosting, static assets on S3                                                                                                                                                                                           |
| Jason Osei            | Security Lead                  | IAM groups and users; security groups; ACM certificate; S3 locked to CloudFront (OAC); ALB and EC2 restricted to CloudFront traffic; EC2 role for CloudWatch Logs; least-privilege review; documenting open ports |
| Robert Deku           | DevOps / CI/CD                 | Owns the GitHub repo; branching and branch protection; deploy script; GitHub Actions workflow and secrets; PR reviews; live pipeline demo                                                                                                  |
| Emmanuel Donkor       | Monitoring & Documentation     | CloudWatch alarms (CPU, 5xx); CloudWatch Logs with 7-day retention; README and environment setup docs; architecture diagram; final deployment checklist                                                                                  |
| Mathilda Morkeh Annan | Cost (Finance) & Presentation  | AWS Budgets alert; tracking Free Tier usage; confirming a zero bill after teardown; building the presentation deck; coordinating everyone's sections                                                                                       |

---

## Cost Notes

This project is designed to stay within the AWS Free Tier. AWS changed the Free Tier for accounts created after mid-2025 to a credit-based free plan, so check which plan the account is on in the Billing console. An AWS Budgets alert warns us before costs go over the limit.

Remember to **stop or delete resources** (especially the ALB and EC2 instance) when they're not in use. We avoid NAT Gateways for the same reason.

## Third-party licences

The charts use [Highcharts](https://www.highcharts.com), stored in `app/static/js/highcharts.js`. Highcharts is not open source. It is used here under its free [educational licence](https://www.highcharts.com/education/) for non-commercial coursework. Any commercial use of this project needs a paid Highcharts licence or a different chart library.
