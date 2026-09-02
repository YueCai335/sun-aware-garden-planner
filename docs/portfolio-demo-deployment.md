# Portfolio Demo Deployment

This guide publishes the current Garden Operations workflow as a personal
portfolio demo. It uses generic data and keeps AI and photo uploads in the
local application.

## Before You Start

- The GitHub repository must contain the approved deployment configuration.
- Create free accounts for [Supabase](https://supabase.com/),
  [Render](https://render.com/), and [Vercel](https://vercel.com/).
- Keep database passwords in provider dashboards. Do not place them in Git,
  screenshots, or chat messages.

## 1. Create the Supabase Database

1. Create a new free Supabase project in a nearby region.
2. In **Database > Extensions**, enable `vector`.
3. Open **Connect** and copy the **Session pooler** connection string.
4. Add `?sslmode=require` when it is absent from the copied string.

Use the session pooler because the Render API is a persistent service running
from an IPv4 environment. The application accepts Supabase connection strings
that begin with either `postgresql://` or `postgres://`.

## 2. Create the Render API

1. In Render, choose **New > Blueprint** and select this GitHub repository.
2. Render reads `render.yaml` and proposes the FastAPI web service.
3. Enter the Supabase connection string as `DATABASE_URL`.
4. Set `FRONTEND_ORIGINS` after the Vercel project has its `vercel.app` URL.
5. Create the service and open `https://your-render-service.onrender.com/health`.

The API runs Alembic migrations during startup. A successful health response
contains `{ "status": "ok" }`.

## 3. Create the Vercel Frontend

1. In Vercel, import the same GitHub repository.
2. Keep the detected Next.js preset and root directory.
3. Add `NEXT_PUBLIC_API_BASE_URL` with the Render API URL, such as
   `https://your-render-service.onrender.com`.
4. Deploy and copy the resulting `https://your-project.vercel.app` URL.
5. Return to Render, set `FRONTEND_ORIGINS` to that exact Vercel URL, and
   redeploy the API.

## 4. Verify the Public Demo

1. Open the Vercel URL in a private browser window.
2. Select **Load demo garden**.
3. Import the generic garden into PostgreSQL from **Edit garden**.
4. Add a care event and a next-season plan item.
5. Refresh the page and confirm the workspace reloads from PostgreSQL.

The first API request after Render idles can take about a minute. Wait for the
page request to finish, then refresh once when necessary.

## Demo Boundaries

- AI Garden Note, Plant Health assessment, Plant Knowledge, and photo uploads
  display a local-app message in the public demo.
- The public demo has no account login. Use generic demonstration data only.
- Supabase and Render free tiers can pause inactive services. Reopen the
  health URL before sharing the demo link for an interview.

## Local AI Demonstration

Use the local Docker Compose setup when demonstrating AI or photo workflows.
It runs Ollama on the Mac and keeps photo evidence in the local Docker volume.
