import traceback
from fastapi.testclient import TestClient
from main import app
import base64

client = TestClient(app)

payload_b64 = base64.urlsafe_b64encode(b'{"sub":"test-user-123","email":"test@test.com"}').rstrip(b'=').decode('ascii')
fake_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + payload_b64 + '.fakesig'

try:
    response = client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {fake_token}"},
        json={"title": "Test Title", "description": "Desc"}
    )
    print("Status code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Exception occurred:")
    traceback.print_exc()
