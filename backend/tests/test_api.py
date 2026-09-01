import json
from copy import deepcopy
from datetime import date

from sqlalchemy import func, select

from app import database
from app.ai import OllamaCareNoteExtractor, complete_known_care_note_fields, configured_care_note_extractor
from app.main import app, get_care_note_extractor
from app.models import Garden, Workspace
from app.schemas import CareNoteExtraction


def workspace_payload():
    return {
        "workspaceId": "local-workspace-1",
        "version": 9,
        "selectedGardenId": "garden-1",
        "careEvents": [],
        "careTasks": [],
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
                            "allocations": [{"id": "allocation-1", "label": "Tomato", "plantType": "Tomato", "color": "#d9534f", "x": 0.5, "y": 0.5, "diameterMeters": 0.5}],
                        },
                    }
                ],
                "plantings": [
                    {
                        "id": "planting-1",
                        "commonName": "Tomatoes",
                        "plantType": "Tomato",
                        "variety": "Sun Gold",
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


def test_workspace_care_records_round_trip_separately_from_one_garden(client):
    payload = workspace_payload()
    payload["careEvents"] = [
        {
            "id": "global-event-1",
            "type": "watering",
            "date": "2026-09-01",
            "note": "Watered every garden.",
            "targetScope": "all-gardens",
        }
    ]
    payload["careTasks"] = [
        {
            "id": "global-task-1",
            "type": "fertilizing",
            "dueDate": "2026-09-07",
            "note": "Feed every garden.",
            "targetScope": "all-gardens",
        }
    ]

    imported = client.put("/workspaces/local-workspace-1/import", json=payload)

    assert imported.status_code == 201
    assert imported.json() == payload
    assert client.get("/workspaces/local-workspace-1").json() == payload


def test_garden_care_record_cannot_target_all_gardens(client):
    payload = workspace_payload()
    payload["gardens"][0]["careEvents"][0]["targetScope"] = "all-gardens"
    payload["gardens"][0]["careEvents"][0].pop("plantingRecordId")
    payload["gardens"][0]["careEvents"][0].pop("plantingRecordName")

    response = client.put("/workspaces/local-workspace-1/import", json=payload)

    assert response.status_code == 422
    assert "garden care records" in response.text


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


def test_import_rejects_an_invalid_plant_allocation_color(client):
    payload = deepcopy(workspace_payload())
    payload["gardens"][0]["growingAreas"][0]["layout"]["allocations"][0]["color"] = "tomato-red"

    response = client.put("/workspaces/local-workspace-1/import", json=payload)

    assert response.status_code == 422
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


class FakeCareNoteExtractor:
    def __init__(self, extraction: CareNoteExtraction):
        self.extraction = extraction
        self.context: dict[str, object] | None = None

    def extract(self, note: str, garden_context: dict[str, object]) -> CareNoteExtraction:
        self.context = garden_context
        return self.extraction


def test_ai_care_note_returns_a_reviewable_draft_for_a_chinese_note(client):
    assert client.put("/workspaces/local-workspace-1/import", json=workspace_payload()).status_code == 201
    extractor = FakeCareNoteExtractor(
        CareNoteExtraction(
            type="fertilizing",
            date=date(2026, 8, 31),
            targetScope="planting-area",
            targetName="North bed",
            fertilizerProduct="fish fertilizer",
            fertilizerAmount=10,
            fertilizerUnit="mL",
        )
    )
    app.dependency_overrides[get_care_note_extractor] = lambda: extractor

    response = client.post(
        "/workspaces/local-workspace-1/gardens/garden-1/ai/care-note-draft",
        json={"note": "昨天给 North bed 的番茄浇水，还施了 10 mL 鱼肥。"},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json() == {
        "type": "fertilizing",
        "date": "2026-08-31",
        "note": "昨天给 North bed 的番茄浇水，还施了 10 mL 鱼肥。",
        "targetScope": "planting-area",
        "growingAreaId": "bed-1",
        "growingAreaName": "North bed",
        "plantingRecordId": None,
        "plantingRecordName": None,
        "fertilizerProduct": "fish fertilizer",
        "fertilizerAmount": 10,
        "fertilizerUnit": "mL",
        "reviewNotes": [],
    }
    assert extractor.context == {
        "name": "Home garden",
        "plantingAreas": ["North bed"],
        "plantGroups": ["Tomatoes"],
    }


def test_ai_care_note_falls_back_to_the_garden_when_target_does_not_match(client):
    assert client.put("/workspaces/local-workspace-1/import", json=workspace_payload()).status_code == 201
    app.dependency_overrides[get_care_note_extractor] = lambda: FakeCareNoteExtractor(
        CareNoteExtraction(type="watering", date=date(2026, 8, 30), targetScope="planting-area", targetName="Patio")
    )

    response = client.post(
        "/workspaces/local-workspace-1/gardens/garden-1/ai/care-note-draft",
        json={"note": "Watered the patio."},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["targetScope"] == "garden"
    assert response.json()["reviewNotes"] == ["Choose a target because the note did not match one garden item."]


def test_ai_care_note_completes_clear_chinese_watering_details_when_the_model_returns_empty_fields(client):
    assert client.put("/workspaces/local-workspace-1/import", json=workspace_payload()).status_code == 201
    app.dependency_overrides[get_care_note_extractor] = lambda: FakeCareNoteExtractor(CareNoteExtraction())

    response = client.post(
        "/workspaces/local-workspace-1/gardens/garden-1/ai/care-note-draft",
        json={"note": "今天给所有后院菜床浇了水。"},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["type"] == "watering"
    assert response.json()["date"] == date.today().isoformat()
    assert response.json()["targetScope"] == "garden"
    assert response.json()["reviewNotes"] == []


def test_ai_care_note_completion_uses_a_known_named_bed_and_leaves_unknown_fields_empty():
    extraction = complete_known_care_note_fields(
        CareNoteExtraction(),
        "Watered North bed today.",
        {"name": "Home garden", "plantingAreas": ["North bed"], "plantGroups": ["Tomatoes"]},
        today=date(2026, 9, 1),
    )

    assert extraction == CareNoteExtraction(
        type="watering",
        date=date(2026, 9, 1),
        targetScope="planting-area",
        targetName="North bed",
    )


def test_ai_care_note_requires_a_configured_api_key_when_openai_is_selected(client, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    response = client.post(
        "/workspaces/local-workspace-1/gardens/garden-1/ai/care-note-draft",
        json={"note": "Watered tomatoes."},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Set OPENAI_API_KEY before creating an AI garden note."


def test_ollama_care_note_extractor_requests_schema_validated_json(monkeypatch):
    requests: list[dict] = []

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

        def read(self):
            return json.dumps(
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "type": "watering",
                                "date": "2026-08-30",
                                "targetScope": "garden",
                                "targetName": None,
                                "fertilizerProduct": None,
                                "fertilizerAmount": None,
                                "fertilizerUnit": None,
                            }
                        )
                    }
                }
            ).encode()

    def fake_urlopen(request, timeout):
        assert timeout == 90
        requests.append(json.loads(request.data))
        return FakeResponse()

    monkeypatch.setattr("app.ai.urlopen", fake_urlopen)
    extraction = OllamaCareNoteExtractor("http://ollama.local", "qwen3:4b").extract(
        "Watered the garden yesterday.",
        {"name": "Home garden", "plantingAreas": [], "plantGroups": []},
    )

    assert extraction.type == "watering"
    assert extraction.date == date(2026, 8, 30)
    assert requests[0]["model"] == "qwen3:4b"
    assert requests[0]["stream"] is False
    assert requests[0]["think"] is False
    assert requests[0]["format"]["type"] == "object"


def test_ollama_is_the_default_ai_provider(monkeypatch):
    monkeypatch.delenv("AI_PROVIDER", raising=False)

    extractor = configured_care_note_extractor()

    assert isinstance(extractor, OllamaCareNoteExtractor)
    assert extractor.model == "qwen3:4b"
