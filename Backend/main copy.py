from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import json
from datetime import datetime
import uvicorn

app = FastAPI()

# -----------------------------------
# CORS
# -----------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------
# DIRECTORIES
# -----------------------------------

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

FLOWS_DIR = os.path.join(
    BASE_DIR,
    "flows"
)

DRAFTS_DIR = os.path.join(
    BASE_DIR,
    "drafts"
)

os.makedirs(FLOWS_DIR, exist_ok=True)
os.makedirs(DRAFTS_DIR, exist_ok=True)

# -----------------------------------
# MODELS
# -----------------------------------

class FlowPayload(BaseModel):
    name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

# -----------------------------------
# SAVE DRAFT
# -----------------------------------

@app.post("/api/flows/draft")
async def save_draft(flow: FlowPayload):

    draft_path = os.path.join(
        DRAFTS_DIR,
        f"{flow.name}.json"
    )

    payload = {
        "name": flow.name,
        "savedAt": datetime.utcnow().isoformat(),
        "nodes": flow.nodes,
        "edges": flow.edges,
    }

    with open(draft_path, "w") as f:
        json.dump(payload, f, indent=2)

    return {
        "success": True,
        "message": "Draft saved"
    }

# -----------------------------------
# PUBLISH FLOW
# -----------------------------------

@app.post("/api/flows/publish")
async def publish_flow(flow: FlowPayload):

    file_path = os.path.join(
        FLOWS_DIR,
        f"{flow.name}.json"
    )

    payload = {
        "name": flow.name,
        "publishedAt": datetime.utcnow().isoformat(),
        "nodes": flow.nodes,
        "edges": flow.edges,
    }

    with open(file_path, "w") as f:
        json.dump(payload, f, indent=2)

    return {
        "success": True,
        "message": "Flow published"
    }

# -----------------------------------
# GET ALL FLOWS
# -----------------------------------

@app.get("/api/flows")
async def get_flows():

    files = [
        file
        for file in os.listdir(FLOWS_DIR)
        if file.endswith(".json")
    ]

    return {
        "files": files
    }

# -----------------------------------
# LOAD FLOW
# -----------------------------------

@app.get("/api/flows/{file_name}")
async def load_flow(file_name: str):

    file_path = os.path.join(
        FLOWS_DIR,
        file_name
    )

    if not os.path.exists(file_path):
        return {
            "success": False,
            "message": "Flow not found"
        }

    with open(file_path, "r") as f:
        data = json.load(f)

    return data

# -----------------------------------
# DELETE FLOW
# -----------------------------------

@app.delete("/api/flows/{file_name}")
async def delete_flow(file_name: str):

    file_path = os.path.join(
        FLOWS_DIR,
        file_name
    )

    if os.path.exists(file_path):
        os.remove(file_path)

    return {
        "success": True,
        "message": "Flow deleted"
    }

# -----------------------------------
# ROOT
# -----------------------------------

@app.get("/")
async def root():
    return {
        "message": "Workflow API Running"
    }

# -----------------------------------
# RUN SERVER
# -----------------------------------

if __name__ == "__main__":

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=True
    )