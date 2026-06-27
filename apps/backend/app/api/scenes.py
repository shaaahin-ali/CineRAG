"""
Scenes API — list scenes and characters for a project.

Routes:
  GET /api/v1/projects/{id}/scenes      List all scenes
  GET /api/v1/projects/{id}/characters  List all characters with scene counts
"""

import logging
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

from app.core.security import extract_token, get_current_user_id
from app.models.scene import CharacterOut, SceneImageOut, SceneOut
from app.services.scene_images import MAX_SCENES_TO_GENERATE, get_image_progress
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/projects/{project_id}/scenes", response_model=List[SceneOut])
async def list_scenes(
    request: Request,
    project_id: UUID,
    location: str | None = None,
    int_ext: str | None = None,
    character: str | None = None,
) -> List[SceneOut]:
    """
    List scenes for a project, with optional filters.
    - location: filter by location name
    - int_ext: 'INT', 'EXT', or 'INT/EXT'
    - character: filter scenes containing this character name
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = SupabaseClient()
    query = db.table("scenes").select("*").eq("project_id", str(project_id))

    if location:
        query = query.ilike("location", f"%{location}%")
    if int_ext:
        query = query.eq("int_ext", int_ext.upper())
    if character:
        query = query.contains("characters", [character])

    result = query.order("scene_number").execute()
    return [SceneOut(**s) for s in (result.data or [])]


@router.get("/projects/{project_id}/characters", response_model=List[CharacterOut])
async def list_characters(request: Request, project_id: UUID) -> List[CharacterOut]:
    """
    Return all unique characters in the project with scene count and scene numbers.
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = SupabaseClient()
    result = db.table("scenes").select("scene_number,characters").eq(
        "project_id", str(project_id)
    ).execute()

    # Aggregate character → scene list
    char_map: dict[str, list[int]] = {}
    for scene in result.data or []:
        for char in scene.get("characters", []):
            char_map.setdefault(char, []).append(scene["scene_number"])

    return [
        CharacterOut(name=name, scene_count=len(scenes), scenes=sorted(scenes))
        for name, scenes in sorted(char_map.items())
    ]


@router.get("/projects/{project_id}/scene-images", response_model=List[SceneImageOut])
async def list_scene_images(
    request: Request,
    project_id: UUID,
) -> List[SceneImageOut]:
    """
    Return all AI-generated scene images for a project.
    Images are generated in background after screenplay upload.
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = SupabaseClient()
    result = (
        db.table("scene_images")
        .select("scene_number,image_url,image_prompt,generated_at")
        .eq("project_id", str(project_id))
        .order("scene_number")
        .execute()
    )

    return [SceneImageOut(**row) for row in (result.data or [])]


@router.get("/projects/{project_id}/image-progress")
async def get_image_generation_progress(
    request: Request,
    project_id: UUID,
) -> Dict[str, Any]:
    """
    Return real-time image generation progress for this project.
    Response: { generated: int, total: int, status: 'generating'|'complete'|'error' }
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get total scene count for this project
    db = SupabaseClient()
    proj = db.table("projects").select("scene_count").eq("id", str(project_id)).execute()
    total_scenes: int = 0
    if proj.data:
        total_scenes = proj.data[0].get("scene_count") or 0

    return get_image_progress(str(project_id), total_scenes)
