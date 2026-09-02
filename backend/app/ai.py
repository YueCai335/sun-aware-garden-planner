import json
import os
from datetime import date
from typing import Protocol
from urllib.request import Request, urlopen

from .schemas import CareNoteExtraction, HealthAssessment, HealthSeverity


class CareNoteExtractor(Protocol):
    def extract(self, note: str, garden_context: dict[str, object]) -> CareNoteExtraction: ...


class PlantHealthAssessor(Protocol):
    def assess(
        self,
        symptoms: str,
        severity: HealthSeverity,
        photo_count: int,
        garden_context: dict[str, object],
    ) -> HealthAssessment: ...


class CareNoteProviderError(RuntimeError):
    pass


def complete_known_care_note_fields(
    extraction: CareNoteExtraction,
    note: str,
    garden_context: dict[str, object],
    today: date | None = None,
) -> CareNoteExtraction:
    """Fill only unambiguous care details stated directly in a note."""
    normalized_note = note.casefold()
    today = today or date.today()
    updates: dict[str, object] = {}

    if extraction.type is None:
        if any(term in normalized_note for term in ("fertiliz", "fertilis", "施肥", "追肥", "肥料", "肥")):
            updates["type"] = "fertilizing"
        elif any(term in normalized_note for term in ("water", "浇水", "浇了", "浇灌")):
            updates["type"] = "watering"

    if extraction.date is None and any(term in normalized_note for term in ("today", "今天")):
        updates["date"] = today

    if extraction.target_scope is None:
        target = known_target_from_note(normalized_note, garden_context)
        if target is not None:
            updates["target_scope"] = target[0]
            updates["target_name"] = target[1]

    return extraction.model_copy(update=updates)


def known_target_from_note(note: str, garden_context: dict[str, object]) -> tuple[str, str | None] | None:
    if any(term in note for term in ("all gardens", "every garden", "所有花园", "全部花园")):
        return ("all-gardens", None)
    garden_wide_terms = (
        "whole garden",
        "entire garden",
        "all garden beds",
        "all beds",
        "整个花园",
        "所有菜床",
        "全院",
    )
    if any(term in note for term in garden_wide_terms) or ("所有" in note and "菜床" in note):
        return ("garden", None)

    for name in garden_context.get("plantingAreas", []):
        if isinstance(name, str) and name.casefold() in note:
            return ("planting-area", name)
    for name in garden_context.get("plantGroups", []):
        if isinstance(name, str) and name.casefold() in note:
            return ("plant-group", name)
    return None


class OpenAICareNoteExtractor:
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def extract(self, note: str, garden_context: dict[str, object]) -> CareNoteExtraction:
        try:
            from openai import OpenAI

            response = OpenAI(api_key=self.api_key).responses.create(
                model=self.model,
                store=False,
                instructions=(
                    "Extract one completed watering or fertilizing event from a gardener's "
                    "Chinese or English note. Return null for information the note does not "
                    "state. Match a target name only from the supplied garden context. Never "
                    "invent a date, fertilizer, amount, unit, or target. Treat 'today' and "
                    "'今天' as the supplied today date. A note stating that all garden beds were "
                    "watered targets the whole garden."
                ),
                input=json.dumps(
                    {"today": date.today().isoformat(), "note": note, "garden": garden_context},
                    ensure_ascii=False,
                ),
                text={
                    "format": {
                        "type": "json_schema",
                        "name": "care_note_extraction",
                        "strict": True,
                        "schema": CareNoteExtraction.model_json_schema(by_alias=True),
                    }
                },
            )
            if not response.output_text:
                raise ValueError("The AI response did not include a structured draft.")
            return CareNoteExtraction.model_validate_json(response.output_text)
        except Exception as error:
            raise CareNoteProviderError("The AI service could not create a care draft.") from error


class OllamaCareNoteExtractor:
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def extract(self, note: str, garden_context: dict[str, object]) -> CareNoteExtraction:
        try:
            prompt = json.dumps(
                {"today": date.today().isoformat(), "note": note, "garden": garden_context},
                ensure_ascii=False,
            )
            request = Request(
                f"{self.base_url}/api/chat",
                data=json.dumps(
                    {
                        "model": self.model,
                        "stream": False,
                        "think": False,
                        "format": CareNoteExtraction.model_json_schema(by_alias=True),
                        "options": {"temperature": 0},
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "Extract one completed watering or fertilizing event from a gardener's "
                                    "Chinese or English note. Return null for information the note does not "
                                    "state. Match a target name only from the supplied garden context. Never "
                                    "invent a date, fertilizer, amount, unit, or target. Return JSON matching "
                                    "the supplied schema. Treat 'today' and '今天' as the supplied today date. "
                                    "For '今天给所有后院菜床浇了水', return type watering, the supplied today date, "
                                    "and targetScope garden. For 'Watered all garden beds today', return the same. "
                                    "A note can contain only one care event."
                                ),
                            },
                            {"role": "user", "content": prompt},
                        ],
                    },
                    ensure_ascii=False,
                ).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(request, timeout=90) as response:
                content = json.loads(response.read())["message"]["content"]
            return CareNoteExtraction.model_validate_json(content)
        except Exception as error:
            raise CareNoteProviderError(
                "Local Ollama could not create a care draft. Start Ollama and download the configured model."
            ) from error


def configured_care_note_extractor() -> CareNoteExtractor:
    provider = os.getenv("AI_PROVIDER", "ollama").lower()
    if provider == "ollama":
        return OllamaCareNoteExtractor(
            os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            os.getenv("OLLAMA_MODEL", "qwen3:4b"),
        )
    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise CareNoteProviderError("Set OPENAI_API_KEY before creating an AI garden note.")
        return OpenAICareNoteExtractor(api_key, os.getenv("OPENAI_MODEL", "gpt-5.6-luna"))
    raise CareNoteProviderError("Set AI_PROVIDER to ollama or openai.")


class OpenAIPlantHealthAssessor:
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def assess(self, symptoms: str, severity: HealthSeverity, photo_count: int, garden_context: dict[str, object]) -> HealthAssessment:
        try:
            from openai import OpenAI

            response = OpenAI(api_key=self.api_key).responses.create(
                model=self.model,
                store=False,
                instructions=plant_health_instructions(),
                input=json.dumps(
                    {"symptoms": symptoms, "severity": severity, "photoCount": photo_count, "garden": garden_context},
                    ensure_ascii=False,
                ),
                text={"format": {"type": "json_schema", "name": "plant_health_assessment", "strict": True, "schema": HealthAssessment.model_json_schema(by_alias=True)}},
            )
            if not response.output_text:
                raise ValueError("The AI response did not include an assessment.")
            return HealthAssessment.model_validate_json(response.output_text)
        except Exception as error:
            raise CareNoteProviderError("The AI service could not create a plant-health assessment.") from error


class OllamaPlantHealthAssessor:
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def assess(self, symptoms: str, severity: HealthSeverity, photo_count: int, garden_context: dict[str, object]) -> HealthAssessment:
        try:
            request = Request(
                f"{self.base_url}/api/chat",
                data=json.dumps(
                    {
                        "model": self.model,
                        "stream": False,
                        "think": False,
                        "format": HealthAssessment.model_json_schema(by_alias=True),
                        "options": {"temperature": 0},
                        "messages": [
                            {"role": "system", "content": plant_health_instructions()},
                            {"role": "user", "content": json.dumps({"symptoms": symptoms, "severity": severity, "photoCount": photo_count, "garden": garden_context}, ensure_ascii=False)},
                        ],
                    },
                    ensure_ascii=False,
                ).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(request, timeout=90) as response:
                content = json.loads(response.read())["message"]["content"]
            return HealthAssessment.model_validate_json(content)
        except Exception as error:
            raise CareNoteProviderError("Local Ollama could not create a plant-health assessment. Start Ollama and download the configured model.") from error


def configured_plant_health_assessor() -> PlantHealthAssessor:
    provider = os.getenv("AI_PROVIDER", "ollama").lower()
    if provider == "ollama":
        return OllamaPlantHealthAssessor(
            os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            os.getenv("OLLAMA_MODEL", "qwen3:4b"),
        )
    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise CareNoteProviderError("Set OPENAI_API_KEY before creating an AI plant-health assessment.")
        return OpenAIPlantHealthAssessor(api_key, os.getenv("OPENAI_MODEL", "gpt-5.6-luna"))
    raise CareNoteProviderError("Set AI_PROVIDER to ollama or openai.")


def plant_health_instructions() -> str:
    return (
        "Create a cautious plant-health observation from a Chinese or English gardener note. "
        "Return JSON matching the schema. Use possibleIssues for at most three possibilities, not a diagnosis. "
        "Use low confidence when symptoms are incomplete. Give low-risk observation, hygiene, isolation, or monitoring steps only. "
        "Do not recommend pesticides, fungicides, brands, doses, or claim certainty. Photos are attached evidence but this text-only model cannot inspect them; "
        "ask for close-up photos when relevant. Keep each list concise."
    )
