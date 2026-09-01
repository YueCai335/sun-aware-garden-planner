import os

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .ai import CareNoteExtractor, CareNoteProviderError, configured_care_note_extractor
from .database import get_session
from .schemas import CareNoteDraftRequest, CareNoteDraftResponse, HealthResponse, RotationGuidanceRequest, RotationGuidanceResponse, WorkspaceImport
from .service import care_note_draft, import_workspace, load_workspace, rotation_guidance, update_workspace, workspace_response

app = FastAPI(title="Sun-Aware Garden Planner API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type"],
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok")


def get_care_note_extractor() -> CareNoteExtractor:
    try:
        return configured_care_note_extractor()
    except CareNoteProviderError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


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


@app.post(
    "/workspaces/{workspace_id}/gardens/{garden_id}/rotation-guidance",
    response_model=RotationGuidanceResponse,
    tags=["garden planning"],
)
def get_rotation_guidance(
    workspace_id: str,
    garden_id: str,
    payload: RotationGuidanceRequest,
    session: Session = Depends(get_session),
):
    return rotation_guidance(session, workspace_id, garden_id, payload)


@app.post(
    "/workspaces/{workspace_id}/gardens/{garden_id}/ai/care-note-draft",
    response_model=CareNoteDraftResponse,
    tags=["AI"],
)
def create_care_note_draft(
    workspace_id: str,
    garden_id: str,
    payload: CareNoteDraftRequest,
    session: Session = Depends(get_session),
    extractor: CareNoteExtractor = Depends(get_care_note_extractor),
):
    return care_note_draft(session, workspace_id, garden_id, payload, extractor)


@app.put("/workspaces/{workspace_id}", tags=["workspaces"])
def save_server_workspace(
    workspace_id: str,
    payload: WorkspaceImport,
    session: Session = Depends(get_session),
):
    if workspace_id != payload.workspace_id:
        raise HTTPException(status_code=422, detail="workspaceId must match the path parameter")
    return workspace_response(update_workspace(session, payload))
