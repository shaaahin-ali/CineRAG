import traceback
from fastapi.testclient import TestClient
from main import app
import base64
from uuid import uuid4

client = TestClient(app)

# Use a valid UUID for sub
user_id = str(uuid4())
payload_b64 = base64.urlsafe_b64encode(f'{{"sub":"{user_id}","email":"test@test.com"}}'.encode()).rstrip(b'=').decode('ascii')
fake_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + payload_b64 + '.fakesig'

try:
    project_id = "67ac8bb2-79c3-4971-a2a3-23a52b3f4988"
    print("Testing upload for project:", project_id)
    # create a dummy file
    file_content = b"This is a dummy text file"
    files = {"file": ("test.txt", file_content, "text/plain")}
    
    response = client.post(
        f"/api/v1/projects/{project_id}/upload",
        headers={"Authorization": f"Bearer {fake_token}"},
        files=files
    )
    print("Status code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Exception occurred:")
    traceback.print_exc()
