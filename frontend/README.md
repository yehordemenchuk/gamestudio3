# Slitherlink Frontend

React frontend for Slitherlink with client-side game logic and API integration.

## Run

```bash
npm install
npm run dev
```

## Docker (full stack)

The repository root has `docker-compose.yml` that starts:

- frontend (`nginx`, port `80`)
- backend (Spring Boot)
- PostgreSQL (`gamestudiodb`)

Run from repository root:

```bash
docker compose up --build
```

## API compatibility

In **development**, API calls use the Vite proxy (`/api` → `https://localhost:8080`). Do **not** set `VITE_API_BASE_URL` to `https://localhost:8080` for local dev — the browser would hit Spring’s TLS directly and show `ERR_CERT_AUTHORITY_INVALID`. Leave it unset, or point to another host.

Production / preview without proxy: set full base URL, e.g.:

```bash
VITE_API_BASE_URL=https://api.example.com
```

Used endpoints:

- `POST /api/v1/scores`
- `GET /api/v1/scores/top/slitherlink`
- `GET /api/v1/comments`
- `POST /api/v1/comments`
- `GET /api/v1/ratings/avg/slitherlink`
- `POST /api/v1/ratings/`

## Slitherlink rules implemented

- One continuous closed loop only
- No branches and no dangling ends
- Numbered cells must have exact count of surrounding loop edges
- Empty cells can have any edge count
