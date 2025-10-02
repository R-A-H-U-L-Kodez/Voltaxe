# In: services/mock_ingestion_server/main.py
from fastapi import FastAPI, Request
import json

app = FastAPI()

# This endpoint will listen for POST requests at the "/ingest" URL
@app.post("/ingest")
async def receive_data(request: Request):
    # We get the raw JSON data sent by the Sentinel
    data = await request.json()

    # Print a success message and the data to the console
    print("\n✅ --- Data Received from a Sentinel Agent --- ✅")
    # Use json.dumps for pretty-printing the received JSON
    print(json.dumps(data, indent=2))
    print("--------------------------------------------------\n")

    return {"status": "success", "message": "Data received"}