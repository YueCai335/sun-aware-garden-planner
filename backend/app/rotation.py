from dataclasses import dataclass
from datetime import date


KNOWN_CROP_FAMILIES = (
    "nightshade",
    "brassica",
    "cucurbit",
    "legume",
    "allium",
    "root",
    "leafy",
)
ROTATION_GROWING_AREA_KINDS = {"raised-bed", "in-ground", "container"}


@dataclass(frozen=True)
class RotationPlanting:
    id: str
    common_name: str
    crop_family: str
    planting_date: date


def evaluate_rotation(
    *,
    growing_area_kind: str,
    crop_family: str,
    planting_date: date,
    plantings: list[RotationPlanting],
) -> dict:
    earliest_year = planting_date.year - 3
    history = sorted(
        (
            planting
            for planting in plantings
            if earliest_year <= planting.planting_date.year < planting_date.year
        ),
        key=lambda planting: (planting.planting_date, planting.id),
        reverse=True,
    )
    repeated_plantings = [
        planting for planting in history if crop_family != "other" and planting.crop_family == crop_family
    ]
    warning = (
        growing_area_kind in ROTATION_GROWING_AREA_KINDS
        and crop_family != "other"
        and bool(repeated_plantings)
    )
    occupied_families = {planting.crop_family for planting in history if planting.crop_family in KNOWN_CROP_FAMILIES}
    return {
        "history": history,
        "warning": warning,
        "warning_plantings": repeated_plantings,
        "rotation_friendly_crop_families": [
            family for family in KNOWN_CROP_FAMILIES if family not in occupied_families
        ],
        "has_automatic_compatibility_conclusion": crop_family != "other",
    }
