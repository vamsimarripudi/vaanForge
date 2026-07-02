const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const composePath = path.join(rootDir, "infrastructure", "docker-compose.yml");
const nginxPath = path.join(rootDir, "infrastructure", "nginx", "kravia.conf");
const deploymentPath = path.join(rootDir, "docs", "DEPLOYMENT.md");
const serverSetupPath = path.join(rootDir, "docs", "infra", "server-setup.md");
const nginxSetupPath = path.join(rootDir, "docs", "infra", "nginx-setup.md");
const sslSetupPath = path.join(rootDir, "docs", "infra", "ssl-setup.md");
const infraReadmePath = path.join(rootDir, "infrastructure", "README.md");
const phaseTrackerPath = path.join(rootDir, "docs", "PHASE-TRACKER.md");

const compose = fs.readFileSync(composePath, "utf8");
const nginx = fs.readFileSync(nginxPath, "utf8");
const deployment = fs.readFileSync(deploymentPath, "utf8");
const serverSetup = fs.readFileSync(serverSetupPath, "utf8");
const nginxSetup = fs.readFileSync(nginxSetupPath, "utf8");
const sslSetup = fs.readFileSync(sslSetupPath, "utf8");
const infraReadme = fs.readFileSync(infraReadmePath, "utf8");
const phaseTracker = fs.readFileSync(phaseTrackerPath, "utf8");

const failures = [];

for (const required of [
  "postgres:",
  "image: postgres:16",
  "POSTGRES_DB: kravia",
  "POSTGRES_USER: postgres",
  "POSTGRES_PASSWORD: postgres",
  '"5432:5432"',
  "postgres-data:/var/lib/postgresql/data",
  "redis:",
  "image: redis:7",
  '"6379:6379"',
  "postgres-data:"
]) {
  if (!compose.includes(required)) {
    failures.push(`docker-compose.yml must include ${required}`);
  }
}

for (const required of [
  "server_name app.example.com",
  "server_name api.example.com",
  "proxy_pass http://127.0.0.1:3000",
  "proxy_pass http://127.0.0.1:4000",
  "proxy_set_header Host $host",
  "proxy_set_header X-Real-IP $remote_addr",
  "proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for"
]) {
  if (!nginx.includes(required)) {
    failures.push(`kravia.conf must include ${required}`);
  }
}

for (const required of ["AWS EC2", "Docker Compose", "Nginx reverse proxy", "PostgreSQL", "Redis", "SSL certificates"]) {
  if (!deployment.includes(required) && !serverSetup.includes(required) && !sslSetup.includes(required)) {
    failures.push(`deployment docs must mention ${required}`);
  }
}

for (const required of [
  "npm ci",
  "npm run prisma:generate --workspace backend",
  "npm run db:migrate:deploy",
  "npm run typecheck",
  "npm test",
  "npm run test:e2e",
  "npm run phase:status",
  "npm run build",
  "npm run launch:readiness"
]) {
  if (!deployment.includes(required)) {
    failures.push(`DEPLOYMENT.md must include ${required}`);
  }
}

for (const required of ["app.example.com", "api.example.com", "infrastructure/nginx/kravia.conf"]) {
  if (!nginxSetup.includes(required)) {
    failures.push(`nginx-setup.md must include ${required}`);
  }
}

for (const required of ["Docker", "Nginx", "SSL", "deployment", "real domain", "secrets"]) {
  if (!infraReadme.includes(required)) {
    failures.push(`infrastructure/README.md must include ${required}`);
  }
}

for (const required of ["Docker setup", "Server deployment guide", "Nginx and SSL guide"]) {
  if (!phaseTracker.includes(required)) {
    failures.push(`PHASE-TRACKER.md must include ${required}`);
  }
}

if (failures.length) {
  console.error(`Infrastructure contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Infrastructure contract check passed for Docker, Nginx, and deployment docs.");
