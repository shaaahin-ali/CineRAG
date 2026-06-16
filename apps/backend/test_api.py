import urllib.request
import json
import base64

payload_b64 = base64.urlsafe_b64encode(b'{"sub":"test-user-123","email":"test@test.com"}').rstrip(b'=').decode('ascii')
fake_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + payload_b64 + '.fakesig'

req = urllib.request.Request('http://localhost:8000/api/v1/projects', 
    data=json.dumps({'title': 'Test Project', 'description': 'Test'}).encode('utf-8'),
    headers={'Authorization': 'Bearer ' + fake_token, 'Content-Type': 'application/json'},
    method='POST'
)
try:
    with urllib.request.urlopen(req) as response:
        print('Status:', response.status)
        print('Response:', response.read().decode())
except urllib.error.HTTPError as e:
    print('HTTPError Status:', e.code)
    print('HTTPError Response:', e.read().decode())
except Exception as e:
    print('Error:', e)
