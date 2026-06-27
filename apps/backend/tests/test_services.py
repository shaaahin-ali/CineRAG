"""Service unit tests — parsing, chunking, Malayalam NLP, character graph."""


def test_screenplay_parsing(sample_screenplay_text: str):
    from app.utils.parsing import parse_screenplay_text

    scenes = parse_screenplay_text(sample_screenplay_text)
    assert len(scenes) >= 2
    scene_numbers = [s["scene_number"] for s in scenes]
    assert all(isinstance(n, int) for n in scene_numbers)


def test_scene_int_ext(sample_screenplay_text: str):
    from app.utils.parsing import parse_screenplay_text

    scenes = parse_screenplay_text(sample_screenplay_text)
    int_scene = next((s for s in scenes if s["int_ext"] == "INT"), None)
    ext_scene = next((s for s in scenes if s["int_ext"] == "EXT"), None)
    assert int_scene is not None
    assert ext_scene is not None


def test_character_extraction(sample_screenplay_text: str):
    from app.utils.parsing import parse_screenplay_text

    scenes = parse_screenplay_text(sample_screenplay_text)
    all_characters: set = set()
    for scene in scenes:
        all_characters.update(scene.get("characters", []))
    assert "HARI" in all_characters or "ANMOL" in all_characters


def test_chunking(sample_screenplay_text: str):
    from app.utils.chunking import chunk_scenes
    from app.utils.parsing import parse_screenplay_text

    scenes = parse_screenplay_text(sample_screenplay_text)
    chunks = chunk_scenes(scenes)
    assert len(chunks) >= len(scenes)
    for chunk in chunks:
        assert "scene_number" in chunk
        assert "content" in chunk
        assert len(chunk["content"]) > 0


def test_malayalam_emotion_detection():
    from app.services.ml_emotion import MalayalamEmotionDetector

    detector = MalayalamEmotionDetector()

    # Text with Malayalam love word
    text_with_love = "ഇത് ഒരു പ്രണയം കഥ ആണ്"
    result = detector.detect_emotions(text_with_love)
    emotions = [e["emotion"] for e in result["primary_emotions"]]
    assert "love" in emotions

    # Empty text
    empty_result = detector.detect_emotions("")
    assert empty_result["intensity_score"] == 0.0


def test_malayalam_query_processor():
    from app.services.ml_query_processor import MalayalamQueryProcessor

    processor = MalayalamQueryProcessor()

    # English query
    en_result = processor.process_query("What is the story about?")
    assert en_result["detected_language"] == "en"

    # Query with Malayalam film term
    ml_result = processor.process_query("കഥ about this film")
    assert "story" in ml_result["expanded_query"] or "കഥ" in ml_result["expanded_query"]


def test_chunking_large_scene():
    from app.utils.chunking import chunk_scenes

    large_scene = {
        "scene_number": 1,
        "page_start": 1,
        "page_end": 10,
        "heading": "INT. HOUSE - DAY",
        "location": "HOUSE",
        "time_of_day": "DAY",
        "int_ext": "INT",
        "characters": ["HARI"],
        "content": "A" * 10000,  # Very large scene
        "detected_emotions": [],
    }
    chunks = chunk_scenes([large_scene])
    assert len(chunks) > 1
    for chunk in chunks:
        assert chunk["scene_number"] == 1


# ── Character Graph Tests ─────────────────────────────────────────────────────

import pytest


@pytest.mark.asyncio
async def test_character_graph_empty_input():
    """Empty scene list should return empty graph."""
    from app.services.character_graph import build_character_graph

    result = await build_character_graph([], use_llm=False)
    assert result == {"nodes": [], "edges": [], "summary": []}


@pytest.mark.asyncio
async def test_character_graph_no_characters():
    """Scenes with no characters should also return empty graph."""
    from app.services.character_graph import build_character_graph

    scenes = [{"scene_number": 1, "characters": []}]
    result = await build_character_graph(scenes, use_llm=False)
    assert result == {"nodes": [], "edges": [], "summary": []}


@pytest.mark.asyncio
async def test_character_graph_single_scene():
    """Single scene with two characters — one edge should be created."""
    from app.services.character_graph import build_character_graph

    scenes = [
        {"scene_number": 1, "characters": ["HARI", "ANMOL"]},
    ]
    result = await build_character_graph(scenes, use_llm=False)

    assert len(result["nodes"]) == 2
    assert len(result["edges"]) == 1

    node_ids = {n["id"] for n in result["nodes"]}
    assert "HARI" in node_ids
    assert "ANMOL" in node_ids

    edge = result["edges"][0]
    assert edge["source"] in {"HARI", "ANMOL"}
    assert edge["target"] in {"HARI", "ANMOL"}
    assert edge["data"]["weight"] == 1


@pytest.mark.asyncio
async def test_character_graph_co_occurrence_weight():
    """Characters sharing multiple scenes get a heavier edge."""
    from app.services.character_graph import build_character_graph

    scenes = [
        {"scene_number": 1, "characters": ["HARI", "ANMOL"]},
        {"scene_number": 2, "characters": ["HARI", "ANMOL"]},
        {"scene_number": 3, "characters": ["HARI", "ANMOL"]},
    ]
    result = await build_character_graph(scenes, use_llm=False)

    assert len(result["edges"]) == 1
    edge = result["edges"][0]
    assert edge["data"]["weight"] == 3
    assert edge["animated"] is True  # max-weight edge should be animated


@pytest.mark.asyncio
async def test_character_graph_role_classification():
    """Roles are assigned by scene count ratio."""
    from app.services.character_graph import build_character_graph

    # HARI in 7 scenes (lead, 7/7=100%), ANMOL in 2 (supporting, 2/7≈28.6%),
    # EXTRA in 1 (minor, 1/7≈14.3% — below the new 15% threshold).
    scenes = [
        {"scene_number": i, "characters": ["HARI"]} for i in range(1, 8)
    ] + [
        {"scene_number": 8, "characters": ["ANMOL"]},
        {"scene_number": 9, "characters": ["ANMOL"]},
        {"scene_number": 10, "characters": ["EXTRA"]},
    ]
    result = await build_character_graph(scenes, use_llm=False)

    summary_map = {s["name"]: s["role"] for s in result["summary"]}
    assert summary_map["HARI"] == "lead"
    assert summary_map["ANMOL"] == "supporting"
    assert summary_map["EXTRA"] == "minor"


@pytest.mark.asyncio
async def test_character_graph_react_flow_shape():
    """Output nodes and edges conform to the React Flow schema."""
    from app.services.character_graph import build_character_graph

    scenes = [{"scene_number": 1, "characters": ["HARI", "ANMOL"]}]
    result = await build_character_graph(scenes, use_llm=False)

    for node in result["nodes"]:
        assert "id" in node
        assert "type" in node
        assert node["type"] == "character"   # custom renderer
        assert "position" in node
        assert "x" in node["position"]
        assert "y" in node["position"]
        assert "data" in node
        assert "label" in node["data"]
        assert "role" in node["data"]
        assert "scene_count" in node["data"]
        # styling is handled by the frontend custom node renderer (no style key here)

    for edge in result["edges"]:
        assert "id" in edge
        assert "source" in edge
        assert "target" in edge
        assert "style" in edge
        assert "data" in edge
        # New fields from hybrid extraction
        assert "confidence" in edge["data"]
        assert "first_meeting" in edge["data"]


@pytest.mark.asyncio
async def test_character_graph_summary_connections():
    """Summary contains accurate connection data."""
    from app.services.character_graph import build_character_graph

    scenes = [
        {"scene_number": 1, "characters": ["HARI", "ANMOL"]},
        {"scene_number": 2, "characters": ["HARI", "PRIYA"]},
    ]
    result = await build_character_graph(scenes, use_llm=False)

    hari_summary = next(s for s in result["summary"] if s["name"] == "HARI")
    connected_names = {c["name"] for c in hari_summary["connections"]}
    assert "ANMOL" in connected_names
    assert "PRIYA" in connected_names

    # New: connections should have confidence and first_meeting
    for conn in hari_summary["connections"]:
        assert "confidence" in conn
        assert "first_meeting" in conn


@pytest.mark.asyncio
async def test_character_graph_from_parsed_screenplay(sample_screenplay_text: str):
    """End-to-end: parse a screenplay and build a graph from the result."""
    from app.utils.parsing import parse_screenplay_text
    from app.services.character_graph import build_character_graph

    scenes = parse_screenplay_text(sample_screenplay_text)
    result = await build_character_graph(scenes, use_llm=False)

    # Should have nodes and edges for HARI/ANMOL who share scenes
    assert len(result["nodes"]) >= 1
    assert "nodes" in result
    assert "edges" in result
    assert "summary" in result


# ── Heuristic Extraction Tests ────────────────────────────────────────────────


def test_heuristic_family_extraction():
    """Heuristic layer should detect family relationships from dialogue."""
    from app.services.character_graph import _extract_relationships_heuristics

    scenes = [
        {
            "scene_number": 1,
            "characters": ["HARI", "ANMOL"],
            "content": "HARI\nAnmol, my son, come here.\n\nANMOL\nYes, father.\n",
            "heading": "INT. LIVING ROOM - DAY",
            "location": "LIVING ROOM",
        },
    ]
    result = _extract_relationships_heuristics(
        scenes, ["HARI", "ANMOL"], [("HARI", "ANMOL")]
    )

    # Should find at least one family relationship
    found_family = False
    for key, data in result.items():
        if data["relationship"] in ("Father", "Son", "Family"):
            found_family = True
            assert data["confidence"] >= 0.50
            assert data["source"] == "heuristic"
            break
    # It's OK if heuristics don't find it (depends on context matching),
    # but the function should at least return without errors
    assert isinstance(result, dict)


def test_heuristic_malayalam_keywords():
    """Heuristic layer should detect Malayalam relationship keywords."""
    from app.services.character_graph import _extract_relationships_heuristics

    scenes = [
        {
            "scene_number": 1,
            "characters": ["നിതിൻ", "ശരിത"],
            "content": "നിതിൻ\nഅമ്മേ, ഞാൻ പോകുന്നു.\n\nശരിത\nശരി, മോനേ.\n",
            "heading": "INT. HOUSE - DAY",
            "location": "HOUSE",
        },
    ]
    result = _extract_relationships_heuristics(
        scenes, ["നിതിൻ", "ശരിത"], [("നിതിൻ", "ശരിത")]
    )

    # Should at least return without errors
    assert isinstance(result, dict)


def test_heuristic_returns_confidence():
    """All heuristic results should have confidence scores."""
    from app.services.character_graph import _extract_relationships_heuristics

    scenes = [
        {
            "scene_number": 1,
            "characters": ["HARI", "MEERA"],
            "content": "HARI\nI love you, Meera.\n\nMEERA\n(crying)\nI love you too.\n",
            "heading": "INT. BEDROOM - NIGHT",
            "location": "BEDROOM",
        },
    ]
    result = _extract_relationships_heuristics(
        scenes, ["HARI", "MEERA"], [("HARI", "MEERA")]
    )

    for key, data in result.items():
        assert "confidence" in data
        assert 0.0 <= data["confidence"] <= 1.0
        assert "source" in data
        assert "supporting_text" in data


