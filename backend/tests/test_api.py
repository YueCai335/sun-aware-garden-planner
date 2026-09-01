from copy import deepcopy

from sqlalchemy import func, select

from app import database
from app.models import Garden, Workspace


def workspace_payload():
    return {
        "workspaceId": "local-workspace-1",
        "version": 8,
        "selectedGardenId": "garden-1",
        "gardens": [
            {
                "id": "garden-1",
                "name": "Home garden",
                "plan": {"widthMeters": 8, "depthMeters": 5},
                "growingAreas": [
                    {
                        "id": "bed-1",
                        "name": "North bed",
                        "kind": "raised-bed",
                        "planPlacement": {"x": 1, "y": 1, "rotationDegrees": 0},
                        "layout": {
                            "widthMeters": 2,
                            "depthMeters": 1,
                            "boundary": [{"x": 0, "y": 0}, {"x": 2, "y": 0}, {"x": 0, "y": 1}],
                            "allocations": [{"id": "allocation-1", "label": "Tomato", "x": 0.5, "y": 0.5, "diameterMeters": 0.5}],
                        },
                    }
                ],
                "plantings": [
                    {
                        "id": "planting-1",
                        "commonName": "Tomatoes",
                        "cropFamily": "nightshade",
                        "quantity": 4,
                        "plantingDate": "2026-05-18",
                        "growingAreaId": "bed-1",
                        "isActive": True,
                    }
                ],
                "careEvents": [
                    {
                        "id": "event-1",
                        "type": "fertilizing",
                        "date": "2026-06-01",
                        "note": "Spring feed",
                        "targetScope": "plant-group",
                        "plantingRecordId": "planting-1",
                        "plantingRecordName": "Tomatoes · North bed",
                        "fertilizerProduct": "Compost tea",
                        "fertilizerAmount": 2,
                        "fertilizerUnit": "L",
                    }
                ],
                "careTasks": [
                    {
                        "id": "task-1",
                        "type": "watering",
                        "dueDate": "2026-06-04",
                        "note": "Check soil moisture",
                        "targetScope": "planting-area",
                        "growingAreaId": "bed-1",
                        "growingAreaName": "North bed",
                        "repeatIntervalDays": 3,
                    }
                ],
            }
        ],
    }


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_import_persists_and_retrieves_complete_workspace(client):
    payload = workspace_payload()

    imported = client.put("/workspaces/local-workspace-1/import", json=payload)

    assert imported.status_code == 201
    assert imported.json() == payload
    retrieved = client.get("/workspaces/local-workspace-1")
    assert retrieved.status_code == 200
    assert retrieved.json() == payload


def test_identical_import_retry_does_not_duplicate_rows(client):
    payload = workspace_payload()

    assert client.put("/workspaces/local-workspace-1/import", json=payload).status_code == 201
    assert client.put("/workspaces/local-workspace-1/import", json=payload).status_code == 201
    with database.SessionLocal() as session:
        assert session.scalar(select(func.count()).select_from(Workspace)) == 1
        assert session.scalar(select(func.count()).select_from(Garden)) == 1


def test_server_workspace_save_replaces_relational_records(client):
    payload = workspace_payload()
    assert client.put("/workspaces/local-workspace-1/import", json=payload).status_code == 201
    payload["gardens"][0]["name"] = "Updated garden"
    payload["gardens"][0]["plantings"] = []
    payload["gardens"][0]["careEvents"] = []

    saved = client.put("/workspaces/local-workspace-1", json=payload)

    assert saved.status_code == 200
    assert saved.json() == payload
    assert client.get("/workspaces/local-workspace-1").json() == payload


def test_server_workspace_save_requires_an_import(client):
    response = client.put("/workspaces/local-workspace-1", json=workspace_payload())

    assert response.status_code == 404


def test_invalid_import_returns_validation_error_and_persists_nothing(client):
    payload = deepcopy(workspace_payload())
    payload["gardens"][0]["plantings"][0]["growingAreaId"] = "missing-bed"

    response = client.put("/workspaces/local-workspace-1/import", json=payload)

    assert response.status_code == 422
    assert "same garden" in response.text
    assert client.get("/workspaces/local-workspace-1").status_code == 404


def test_rotation_guidance_returns_three_season_history_and_a_non_blocking_warning(client):
    payload = workspace_payload()
    payload["gardens"][0]["plantings"][0]["plantingDate"] = "2024-05-18"
    payload["gardens"][0]["plantings"].append(
        {
            "id": "planting-2",
            "commonName": "Bush beans",
            "cropFamily": "legume",
            "quantity": 4,
            "plantingDate": "2025-05-18",
            "growingAreaId": "bed-1",
            "isActive": False,
        }
    )
    assert client.put("/workspaces/local-workspace-1/import", json=payload).status_code == 201

    response = client.post(
        "/workspaces/local-workspace-1/gardens/garden-1/rotation-guidance",
        json={"growingAreaId": "bed-1", "cropFamily": "nightshade", "plantingDate": "2026-05-20"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "growingAreaId": "bed-1",
        "growingAreaKind": "raised-bed",
        "season": 2026,
        "history": [
            {"plantingId": "planting-2", "commonName": "Bush beans", "cropFamily": "legume", "plantingDate": "2025-05-18", "season": 2025},
            {"plantingId": "planting-1", "commonName": "Tomatoes", "cropFamily": "nightshade", "plantingDate": "2024-05-18", "season": 2024},
        ],
        "warning": {
            "cropFamily": "nightshade",
            "plantings": [{"plantingId": "planting-1", "commonName": "Tomatoes", "cropFamily": "nightshade", "plantingDate": "2024-05-18", "season": 2024}],
        },
        "automatedWarningSupported": True,
        "hasAutomaticCompatibilityConclusion": True,
        "rotationFriendlyCropFamilies": ["brassica", "cucurbit", "allium", "root", "leafy"],
    }


def test_rotation_guidance_rejects_invalid_persisted_references_and_input(client):
    assert client.put("/workspaces/local-workspace-1/import", json=workspace_payload()).status_code == 201
    path = "/workspaces/local-workspace-1/gardens/garden-1/rotation-guidance"
    valid = {"growingAreaId": "bed-1", "cropFamily": "nightshade", "plantingDate": "2026-05-20"}

    assert client.post("/workspaces/missing/gardens/garden-1/rotation-guidance", json=valid).status_code == 404
    assert client.post("/workspaces/local-workspace-1/gardens/missing/rotation-guidance", json=valid).status_code == 404
    area = client.post(path, json={**valid, "growingAreaId": "missing-bed"})
    assert area.status_code == 422
    assert "growingAreaId" in area.text
    assert client.post(path, json={**valid, "cropFamily": "fruit"}).status_code == 422
    assert client.post(path, json={**valid, "plantingDate": "2026-02-30"}).status_code == 422
    excluded = client.post(path, json={**valid, "excludePlantingId": "missing-planting"})
    assert excluded.status_code == 422
    assert "excludePlantingId" in excluded.text
