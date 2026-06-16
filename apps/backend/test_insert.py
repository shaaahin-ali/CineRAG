import asyncio
from app.services.storage import SupabaseClient
from app.services.ingestion import extract_text_from_file, parse_screenplay_text, ml_parser

async def main():
    db = SupabaseClient()
    project_id = "67ac8bb2-79c3-4971-a2a3-23a52b3f4988"
    print("Downloading PDF...")
    try:
        res = db.storage.from_("screenplays").download(f"{project_id}/SAMPLE_SCREENPLAY_ANIYAAN.pdf")
        text = extract_text_from_file(res, ".pdf")
        scenes = parse_screenplay_text(text, ml_parser)
        print("Parsed scenes:", len(scenes))
        
        scene_records = [
            {
                "project_id": project_id,
                "scene_number": s["scene_number"],
                "page_start": s["page_start"],
                "page_end": s["page_end"],
                "heading": s["heading"],
                "location": s["location"],
                "content": s["content"],
            }
            for s in scenes
        ]
        
        print("Inserting to Supabase...")
        db.table("scenes").insert(scene_records).execute()
        print("Success!")
    except Exception as e:
        print("Error during insert:", e)

asyncio.run(main())
