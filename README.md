# Propvian

Smart lock automation SaaS for short-term rentals. Automates guest access via TTLock integration, iCal sync, and automated PIN management.

## Stack

- **Backend**: Java 21, Spring Boot 3, PostgreSQL, Redis, Flyway
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Infrastructure**: Docker Compose, Caddy (TLS), GitHub Actions CI/CD

## Local Development

```bash
docker compose up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Mailhog: http://localhost:8025

## Production

Deploys automatically on push to `main` via GitHub Actions → SSH → Docker Compose.

Live at: https://propvian.com
