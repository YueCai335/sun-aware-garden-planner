from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class SeedKnowledgeCard:
    source_key: str
    title: str
    publisher: str
    source_url: str
    reviewed_on: date
    content: str
    tags: list[str]


SEED_KNOWLEDGE_CARDS = [
    SeedKnowledgeCard(
        source_key="umn-tomato-home-gardens",
        title="Growing tomatoes in home gardens",
        publisher="University of Minnesota Extension",
        source_url="https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-tomatoes",
        reviewed_on=date(2026, 9, 1),
        content=(
            "Tomato leaf and fruit changes can come from environment, disease, insects, or wildlife. "
            "Home gardeners can reduce disease pressure by rotating tomato-family crops across growing areas and by observing symptoms over time. "
            "Tomato disorders such as blossom-end rot, cracking, leaf roll, and sunscald have different causes, so visible symptoms alone may not identify one cause."
        ),
        tags=["tomato", "番茄", "leaf", "fruit", "disease", "diagnosis", "rotation"],
    ),
    SeedKnowledgeCard(
        source_key="umn-summer-squash-zucchini",
        title="Growing summer squash and zucchini in home gardens",
        publisher="University of Minnesota Extension",
        source_url="https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-summer-squash-and-zucchini",
        reviewed_on=date(2026, 9, 1),
        content=(
            "Summer squash and zucchini can develop powdery mildew, which appears as powdery white spots on leaves and vines. "
            "Other cucurbit leaf problems can have different appearances, so gardeners should note whether the coating is on the upper or lower leaf surface, how it spreads, and whether leaves have yellowing, distortion, or spots. "
            "Avoid overhead watering and record recent weather and watering when gathering more information."
        ),
        tags=["squash", "zucchini", "西葫芦", "南瓜", "cucurbit", "powdery mildew", "白粉病", "white powder"],
    ),
    SeedKnowledgeCard(
        source_key="umn-preventing-plant-diseases",
        title="Preventing plant diseases in the garden",
        publisher="University of Minnesota Extension",
        source_url="https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/yard-and-garden-problems/preventing-plant-diseases-in-the-garden",
        reviewed_on=date(2026, 9, 1),
        content=(
            "Garden disease prevention includes clean seed, tool sanitation, crop rotation, soil-level watering, airflow, and removal of infected plant material when conditions are dry. "
            "A plant disease clinic can help when symptoms need confirmation. These actions reduce disease pressure and do not confirm a specific diagnosis."
        ),
        tags=["disease", "病害", "prevention", "sanitation", "watering", "rotation", "airflow"],
    ),
    SeedKnowledgeCard(
        source_key="umn-garden-diagnosis",
        title="What is wrong with my plant?",
        publisher="University of Minnesota Extension",
        source_url="https://apps.extension.umn.edu/garden/diagnose/plant/",
        reviewed_on=date(2026, 9, 1),
        content=(
            "Garden problems can be caused by insects, diseases, and nonliving environmental factors. "
            "A useful observation records the plant type, the affected part, symptom appearance, timing, recent weather, watering, and whether nearby plants show the same change."
        ),
        tags=["diagnosis", "诊断", "insect", "disease", "environment", "symptoms"],
    ),
    SeedKnowledgeCard(
        source_key="cfia-plant-diseases",
        title="Plant diseases",
        publisher="Canadian Food Inspection Agency",
        source_url="https://inspection.canada.ca/en/plant-health/invasive-pests-and-plants/plant-diseases",
        reviewed_on=date(2026, 9, 1),
        content=(
            "Canadian plant-health resources track regulated and invasive plant diseases. Gardeners should consult current official guidance when a potentially regulated disease or invasive pest is suspected."
        ),
        tags=["canada", "加拿大", "plant health", "invasive", "regulated", "disease"],
    ),
]
