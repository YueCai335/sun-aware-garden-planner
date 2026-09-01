import hashlib
import json

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .models import CareEvent, CareTask, Garden, GrowingArea, Planting, Workspace
from .schemas import WorkspaceImport


def import_fingerprint(workspace: WorkspaceImport) -> str:
    payload = workspace.model_dump(mode="json", by_alias=True, exclude_none=True)
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def load_workspace(session: Session, workspace_id: str) -> Workspace | None:
    return session.scalar(
        select(Workspace)
        .where(Workspace.id == workspace_id)
        .options(
            selectinload(Workspace.gardens).selectinload(Garden.growing_areas),
            selectinload(Workspace.gardens).selectinload(Garden.plantings),
            selectinload(Workspace.gardens).selectinload(Garden.care_events),
            selectinload(Workspace.gardens).selectinload(Garden.care_tasks),
        )
    )


def import_workspace(session: Session, payload: WorkspaceImport) -> Workspace:
    fingerprint = import_fingerprint(payload)
    existing = load_workspace(session, payload.workspace_id)
    if existing:
        if existing.import_hash == fingerprint:
            return existing
        raise HTTPException(
            status_code=409,
            detail="This workspace was already imported. Use the server-backed workflow for later changes.",
        )

    workspace = Workspace(
        id=payload.workspace_id,
        schema_version=payload.version,
        selected_garden_external_id=payload.selected_garden_id,
        import_hash=fingerprint,
    )
    session.add(workspace)
    for garden_position, garden_input in enumerate(payload.gardens):
        garden = Garden(
            external_id=garden_input.id,
            position=garden_position,
            name=garden_input.name,
            plan_width_meters=garden_input.plan.width_meters,
            plan_depth_meters=garden_input.plan.depth_meters,
        )
        workspace.gardens.append(garden)
        areas: dict[str, GrowingArea] = {}
        for position, area_input in enumerate(garden_input.growing_areas):
            area = GrowingArea(
                external_id=area_input.id,
                position=position,
                name=area_input.name,
                kind=area_input.kind,
                plan_x=area_input.plan_placement.x,
                plan_y=area_input.plan_placement.y,
                plan_rotation_degrees=area_input.plan_placement.rotation_degrees,
                layout=area_input.layout.model_dump(by_alias=True) if area_input.layout else None,
            )
            garden.growing_areas.append(area)
            areas[area_input.id] = area
        for position, planting_input in enumerate(garden_input.plantings):
            garden.plantings.append(
                Planting(
                    external_id=planting_input.id,
                    position=position,
                    common_name=planting_input.common_name,
                    crop_family=planting_input.crop_family,
                    quantity=planting_input.quantity,
                    planting_date=planting_input.planting_date,
                    is_active=planting_input.is_active,
                    growing_area=areas[planting_input.growing_area_id],
                )
            )
        for position, event_input in enumerate(garden_input.care_events):
            garden.care_events.append(
                CareEvent(
                    external_id=event_input.id,
                    position=position,
                    event_type=event_input.type,
                    occurred_on=event_input.date,
                    note=event_input.note,
                    fertilizer_product=event_input.fertilizer_product,
                    fertilizer_amount=event_input.fertilizer_amount,
                    fertilizer_unit=event_input.fertilizer_unit,
                    **target_fields(event_input),
                )
            )
        for position, task_input in enumerate(garden_input.care_tasks):
            garden.care_tasks.append(
                CareTask(
                    external_id=task_input.id,
                    position=position,
                    task_type=task_input.type,
                    due_date=task_input.due_date,
                    note=task_input.note,
                    repeat_interval_days=task_input.repeat_interval_days,
                    **target_fields(task_input),
                )
            )
    session.commit()
    return load_workspace(session, payload.workspace_id)  # type: ignore[return-value]


def target_fields(record):
    return {
        "target_scope": record.target_scope,
        "growing_area_external_id": record.growing_area_id,
        "growing_area_name_snapshot": record.growing_area_name,
        "target_area_deleted": record.target_area_deleted,
        "planting_external_id": record.planting_record_id,
        "planting_name_snapshot": record.planting_record_name,
        "target_planting_deleted": record.target_planting_record_deleted,
    }


def workspace_response(workspace: Workspace) -> dict:
    return {
        "workspaceId": workspace.id,
        "version": workspace.schema_version,
        "selectedGardenId": workspace.selected_garden_external_id,
        "gardens": [garden_response(garden) for garden in workspace.gardens],
    }


def garden_response(garden: Garden) -> dict:
    return {
        "id": garden.external_id,
        "name": garden.name,
        "plan": {"widthMeters": garden.plan_width_meters, "depthMeters": garden.plan_depth_meters},
        "growingAreas": [
            {
                "id": area.external_id,
                "name": area.name,
                "kind": area.kind,
                "planPlacement": {"x": area.plan_x, "y": area.plan_y, "rotationDegrees": area.plan_rotation_degrees},
                **({"layout": area.layout} if area.layout is not None else {}),
            }
            for area in garden.growing_areas
        ],
        "plantings": [
            {
                "id": planting.external_id,
                "commonName": planting.common_name,
                "cropFamily": planting.crop_family,
                "quantity": planting.quantity,
                "plantingDate": planting.planting_date.isoformat(),
                "growingAreaId": planting.growing_area.external_id,
                "isActive": planting.is_active,
            }
            for planting in garden.plantings
        ],
        "careEvents": [care_event_response(event) for event in garden.care_events],
        "careTasks": [care_task_response(task) for task in garden.care_tasks],
    }


def target_response(record) -> dict:
    fields = {"targetScope": record.target_scope}
    if record.growing_area_external_id is not None:
        fields.update(
            {
                "growingAreaId": record.growing_area_external_id,
                "growingAreaName": record.growing_area_name_snapshot,
                **({"targetAreaDeleted": record.target_area_deleted} if record.target_area_deleted is not None else {}),
            }
        )
    if record.planting_external_id is not None:
        fields.update(
            {
                "plantingRecordId": record.planting_external_id,
                "plantingRecordName": record.planting_name_snapshot,
                **({"targetPlantingRecordDeleted": record.target_planting_deleted} if record.target_planting_deleted is not None else {}),
            }
        )
    return fields


def care_event_response(event: CareEvent) -> dict:
    return {
        "id": event.external_id,
        "type": event.event_type,
        "date": event.occurred_on.isoformat(),
        "note": event.note,
        **target_response(event),
        **({"fertilizerProduct": event.fertilizer_product} if event.fertilizer_product is not None else {}),
        **({"fertilizerAmount": event.fertilizer_amount} if event.fertilizer_amount is not None else {}),
        **({"fertilizerUnit": event.fertilizer_unit} if event.fertilizer_unit is not None else {}),
    }


def care_task_response(task: CareTask) -> dict:
    return {
        "id": task.external_id,
        "type": task.task_type,
        "dueDate": task.due_date.isoformat(),
        "note": task.note,
        **target_response(task),
        **({"repeatIntervalDays": task.repeat_interval_days} if task.repeat_interval_days is not None else {}),
    }
