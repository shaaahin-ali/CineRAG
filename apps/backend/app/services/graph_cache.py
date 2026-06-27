import json
import logging
from typing import Any, Dict, Optional

from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)

BUCKET_NAME = "artifacts"

def get_cached_graph(project_id: str) -> Optional[Dict[str, Any]]:
    db = SupabaseClient()
    path = f"graphs/{project_id}.json"
    try:
        response = db.storage.from_(BUCKET_NAME).download(path)
        return json.loads(response.decode("utf-8"))
    except Exception as e:
        # Expected if the file doesn't exist yet
        logger.debug(f"Cache miss for {project_id} in Supabase: {e}")
    return None

def set_cached_graph(project_id: str, data: Dict[str, Any]) -> None:
    db = SupabaseClient()
    path = f"graphs/{project_id}.json"
    try:
        json_data = json.dumps(data, ensure_ascii=False).encode("utf-8")
        # Upsert ensures it overwrites existing cache
        db.storage.from_(BUCKET_NAME).upload(
            file=json_data,
            path=path,
            file_options={"upsert": "true", "content-type": "application/json"}
        )
        logger.info(f"Successfully cached graph to Supabase for project {project_id}")
    except Exception as e:
        logger.warning(f"Failed to write graph cache for {project_id} to Supabase: {e}")

def clear_cached_graph(project_id: str) -> None:
    db = SupabaseClient()
    path = f"graphs/{project_id}.json"
    try:
        db.storage.from_(BUCKET_NAME).remove([path])
        logger.info(f"Cleared Supabase graph cache for project {project_id}")
    except Exception as e:
        logger.warning(f"Failed to delete graph cache for {project_id} from Supabase: {e}")
