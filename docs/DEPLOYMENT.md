# Deployment guide — AWS EC2

This guide deploys the Dockerized app on one Ubuntu EC2 instance. It is designed for a course demo. For a real public app, use a managed MongoDB service, HTTPS, backups, and stricter firewall rules.

## 1. Prepare the EC2 instance

1. Launch an Ubuntu 24.04 EC2 instance (a small instance is enough for a demo).
2. In its security group, allow inbound `22` (SSH) only from your IP, plus `8040` and `5000` for the basic demo. For a public site, use `80`/`443` instead of exposing these app ports.
3. Connect using SSH:

```bash
ssh -i prodpilot.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## 2. Install Docker and Git

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-v2
sudo usermod -aG docker $USER
exit
```

Sign in again after the `exit`, then confirm Docker works:

```bash
docker --version
docker compose version
```

## 3. Clone and configure

```bash
git clone https://github.com/YOUR-ORG/ProdPilot.git
cd ProdPilot
cp .env.example .env
nano .env
```

Replace `JWT_SECRET` with a long random value. You can generate one with `openssl rand -hex 32`.

For an EC2 deployment, edit `docker-compose.yml` so the client build argument uses the public server URL, for example:

```yaml
VITE_API_URL: http://YOUR_EC2_PUBLIC_IP:5000
```

Also set `CLIENT_ORIGIN` for the server to `http://YOUR_EC2_PUBLIC_IP:8040`. These values are needed because the browser must be allowed to call the API.

## 4. Start the stack

```bash
docker compose up -d --build
docker compose ps
curl http://localhost:5000/api/health
```

Open `http://YOUR_EC2_PUBLIC_IP:8040`, register an account, and try the full task workflow.

## 5. Update after a merge

```bash
git pull origin main
docker compose up -d --build
```

## 6. Enable automatic GitHub Actions deployment

The repository already includes `.github/workflows/deploy.yml`. It deploys only after the CI workflow passes for a commit pushed to `main`.

In **GitHub → Settings → Secrets and variables → Actions**, create these repository secrets:

| Secret | Value |
| --- | --- |
| `EC2_HOST` | EC2 public IP address or DNS name |
| `EC2_USER` | `ubuntu` for the standard Ubuntu AMI |
| `EC2_SSH_KEY` | Contents of the private SSH key that can access the server |

On EC2, clone the repository into `/opt/prodpilot` before enabling this workflow. If the GitHub repository is private, give the EC2 host a read-only deploy key or another secure Git credential. Keep the server’s `.env` file only on EC2; do not put it in GitHub or the repository.

After that setup, merging a reviewed pull request into `main` triggers CI. A successful CI run then SSHes to EC2 and runs `git pull --ff-only origin main` followed by `docker compose up -d --build` automatically.
