import sys
import asyncio
import os
import logging
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.storage import SupabaseClient
from app.services.scene_images import generate_images_for_project

logging.basicConfig(level=logging.INFO)

async def main():
    db = SupabaseClient()
    # Get all projects
    res = db.table('projects').select('id, title').execute()
    projects = res.data or []
    
    if not projects:
        print("No projects found.")
        return

    # Trigger for the most recently created projects (or all of them)
    # Actually let's just trigger for the last project to save their time
    # We will trigger for all projects that have scenes
    for p in projects:
        project_id = p['id']
        title = p['title']
        
        # Check how many images already generated
        img_res = db.table('scene_images').select('scene_number', count='exact').eq('project_id', project_id).execute()
        img_count = img_res.count or 0
        
        if img_count >= 10:
            print(f"Project '{title}' already has {img_count} images. Skipping.")
            continue
            
        print(f"\nFetching scenes for project '{title}' ({project_id})...")
        scenes_res = db.table('scenes').select('*').eq('project_id', project_id).order('scene_number').execute()
        scenes = scenes_res.data or []
        
        if not scenes:
            print(f"No scenes found for '{title}'.")
            continue
            
        # We need to filter scenes that don't have images yet
        # But actually `generate_images_for_project` uses upsert, so it's safe to just pass them all.
        # However, to be perfectly efficient, we only pass scenes that need generating if we want,
        # but generate_images_for_project processes scenes in order. Let's just pass all scenes.
        print(f"Triggering image generation for '{title}' (found {len(scenes)} scenes)")
        await generate_images_for_project(project_id, scenes)

if __name__ == "__main__":
    asyncio.run(main())
