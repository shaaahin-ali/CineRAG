import asyncio
from app.services.embedding import embed_texts

async def main():
    try:
        embeddings = await embed_texts(["Hello world"])
        print("Success! Dimensions:", len(embeddings[0]))
    except Exception as e:
        print("Embedding failed:")
        import traceback
        traceback.print_exc()

asyncio.run(main())
