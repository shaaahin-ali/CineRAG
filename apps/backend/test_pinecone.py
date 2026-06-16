import os
from pinecone import Pinecone
from app.core.config import settings

def test_pinecone():
    print("Connecting to Pinecone...")
    try:
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        index = pc.Index(settings.PINECONE_INDEX_NAME)
        stats = index.describe_index_stats()
        print("Pinecone stats:", stats)
    except Exception as e:
        print("Pinecone failed:", e)

if __name__ == "__main__":
    test_pinecone()
