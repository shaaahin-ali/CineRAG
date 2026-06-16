import asyncio
from app.services.storage import SupabaseClient
from app.services.ingestion import extract_text_from_file, parse_screenplay_text, ml_parser

async def main():
    db = SupabaseClient()
    print("Downloading PDF...")
    try:
        # Download file
        res = db.storage.from_("screenplays").download("67ac8bb2-79c3-4971-a2a3-23a52b3f4988/SAMPLE_SCREENPLAY_ANIYAAN.pdf")
        print("Downloaded bytes:", len(res))
        
        text = extract_text_from_file(res, ".pdf")
        print("Extracted text length:", len(text))
        
        scenes = parse_screenplay_text(text, ml_parser)
        print("Parsed scenes:", len(scenes))
    except Exception as e:
        print("Error:", e)

asyncio.run(main())
