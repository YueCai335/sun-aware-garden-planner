import os

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_session
from .schemas import HealthResponse, WorkspaceImport
from .service import import_workspace, load_workspace, update_workspace, workspace_response

app = FastAPI(title="Sun-Aware Garden Planner API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_methods=["GET", "PUT"],
    allow_headers=["Content-Type"],
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.put("/workspaces/{workspace_id}/import", status_code=status.HTTP_201_CREATED, tags=["workspaces"])
def import_local_workspace(
    workspace_id: str,
    payload: WorkspaceImport,
    session: Session = Depends(get_session),
):
    if workspace_id != payload.workspace_id:
        raise HTTPException(status_code=422, detail="workspaceId must match the path parameter")
    return workspace_response(import_workspace(session, payload))


@app.get("/workspaces/{workspace_id}", tags=["workspaces"])
def get_workspace(workspace_id: str, session: Session = Depends(get_session)):
    workspace = load_workspace(session, workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace_response(workspace)


@app.put("/workspaces/{workspace_id}", tags=["workspaces"])
def save_server_workspace(
    workspace_id: str,
    payload: WorkspaceImport,
    session: Session = Depends(get_session),
):
    if workspace_id != payload.workspace_id:
        raise HTTPException(status_code=422, detail="workspaceId must match the path parameter")
    return workspace_response(update_workspace(session, payload))
