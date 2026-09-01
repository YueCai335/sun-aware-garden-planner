# Backend Foundation

The FastAPI service stores a complete Garden Operations workspace in PostgreSQL.
Its OpenAPI documentation is available at `http://localhost:8000/docs` while
the service is running.

## Run Locally

Start PostgreSQL, apply the Alembic migration, and run the API:

```bash
docker compose up --build
```

Verify the service:

```bash
curl http://localhost:8000/health
```

The local database is bound to `127.0.0.1:5433`. The Compose environment uses
local-only trust authentication and has no production credentials.

To run the API and tests outside Docker Compose, create a virtual environment
in `backend/`, install the development dependencies, and point `DATABASE_URL`
at a PostgreSQL database:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
alembic upgrade head
pytest
```

## REST Contract

`PUT /workspaces/{workspaceId}/import` accepts a complete version-8 browser
workspace plus the stable `workspaceId` field. The path value and field must
match. The request persists gardens, growing areas, layouts, plantings, care
history, and open care tasks in one transaction.

Sending the identical import again returns the already stored workspace. A
different payload for the same workspace returns `409`, preserving the
explicit-import boundary before the later server-backed frontend workflow.

`GET /workspaces/{workspaceId}` returns the imported garden data.

`PUT /workspaces/{workspaceId}` validates and saves a complete workspace after
an import. It replaces the workspace's relational garden records in one
transaction, keeping the database as the single write source.

`POST /workspaces/{workspaceId}/gardens/{gardenId}/rotation-guidance` evaluates
a planting's crop family and planting date against the same growing area's
three preceding calendar years. It returns history, any raised-bed or
in-ground repeat warning, and family-level rotation candidates. The endpoint
does not change stored planting records.

`POST /workspaces/{workspaceId}/gardens/{gardenId}/ai/care-note-draft` sends
one Chinese or English care note to the configured AI provider and returns a
validated draft for user review. The default provider is local Ollama with
`qwen3:4b`. Install Ollama on the Mac host, run `ollama pull qwen3:4b`, then
rebuild the API container. Set `AI_PROVIDER=openai` plus `OPENAI_API_KEY` to
use OpenAI later. The endpoint returns a draft; the frontend saves a reviewed
draft with the existing workspace update endpoint.

The request body preserves the existing browser naming convention. A compact
example is:

```json
{
  "workspaceId": "local-workspace-1",
  "version": 8,
  "selectedGardenId": "garden-1",
  "gardens": [
    {
      "id": "garden-1",
      "name": "Home garden",
      "plan": { "widthMeters": 8, "depthMeters": 5 },
      "growingAreas": [],
      "plantings": [],
      "careEvents": [],
      "careTasks": []
    }
  ]
}
```

The backend does not read or modify browser storage. Frontend integration owns
the future user-triggered import action and subsequent switch to server data.
