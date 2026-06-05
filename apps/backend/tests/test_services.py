"""Service unit tests — parsing, chunking, Malayalam NLP."""


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
