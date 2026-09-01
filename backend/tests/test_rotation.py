from datetime import date

from app.rotation import RotationPlanting, evaluate_rotation


def planting(id: str, family: str, year: int) -> RotationPlanting:
    return RotationPlanting(id=id, common_name=id.title(), crop_family=family, planting_date=date(year, 5, 20))


def test_soil_rotation_warns_for_a_repeated_family_in_the_three_preceding_seasons():
    result = evaluate_rotation(
        growing_area_kind="raised-bed",
        crop_family="nightshade",
        planting_date=date(2026, 5, 20),
        plantings=[planting("tomatoes", "nightshade", 2024), planting("beans", "legume", 2025), planting("old-kale", "brassica", 2022)],
    )

    assert result["warning"] is True
    assert [record.id for record in result["history"]] == ["beans", "tomatoes"]
    assert [record.id for record in result["warning_plantings"]] == ["tomatoes"]
    assert "nightshade" not in result["rotation_friendly_crop_families"]
    assert "brassica" in result["rotation_friendly_crop_families"]


def test_other_and_non_soil_areas_keep_history_without_an_automated_warning():
    plantings = [planting("tomatoes", "nightshade", 2025)]

    container = evaluate_rotation(
        growing_area_kind="container", crop_family="nightshade", planting_date=date(2026, 5, 20), plantings=plantings
    )
    unknown = evaluate_rotation(
        growing_area_kind="in-ground", crop_family="other", planting_date=date(2026, 5, 20), plantings=plantings
    )

    assert container["warning"] is False
    assert [record.id for record in container["history"]] == ["tomatoes"]
    assert unknown["warning"] is False
    assert unknown["has_automatic_compatibility_conclusion"] is False
