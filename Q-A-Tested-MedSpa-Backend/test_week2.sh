#!/bin/bash
BASE_URL="http://127.0.0.1:8000/api"

# -------- LOGIN CLIENT --------    
CLIENT_TOKEN=$(curl -s -X POST $BASE_URL/login \
-H "Content-Type: application/json" \
-d '{
  "email": "client@example.com",
  "password": "password"
}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "Client Token: $CLIENT_TOKEN"

# -------- CREATE APPOINTMENT --------  
curl -s -X POST $BASE_URL/client/appointments \
-H "Authorization: Bearer $CLIENT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "staff_id": 2,
  "location_id": 1,
  "appointment_time": "2025-10-01 14:00:00",
  "notes": "First test appointment"
}'

echo -e "\n---- Created Appointment ----"

# -------- VIEW CLIENT APPOINTMENTS --------
curl -s -X GET $BASE_URL/client/appointments \
-H "Authorization: Bearer $CLIENT_TOKEN"

echo -e "\n---- Client Appointments ----"

# -------- CANCEL CLIENT APPOINTMENT --------
curl -s -X DELETE $BASE_URL/client/appointments/1 \
-H "Authorization: Bearer $CLIENT_TOKEN"

echo -e "\n✅ Client appointment tests done."

