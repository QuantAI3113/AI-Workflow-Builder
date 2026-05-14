from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import httpx
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
# CONFIG
# -----------------------------------

OPENAI_API_KEY = "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"

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


class GeneratePayload(BaseModel):
    flow_name: str
    paragraph: str

# -----------------------------------
# OPENAI HELPER
# -----------------------------------

async def call_openai(messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer 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",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "messages": messages,
                "temperature": 0.7,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

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
# GENERATE FLOW FROM PARAGRAPH
# -----------------------------------

SYSTEM_PROMPT = """You are a workflow architect. Given a plain-English description, generate a JSON workflow.

Postion the node correctly with x and y parameters.

Return ONLY raw JSON — no markdown fences, no explanation, no preamble.

The JSON must follow this exact schema:
{
  "nodes": [
    {
      "id": "<unique string>",
      "type": "workflow",
      "position": { "x": <number>, "y": <number> },
      "data": {
        "fieldNode": "<short node name / identifier>",
        "instructions": "<what this node does>",
        "responseFields": [
          { "key": "<field key>", "value": "<field description>" }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "<unique edge id>",
      "source": "<source node id>",
      "target": "<target node id>"
    }
  ]
}

Rules:
- Create between 2 and 8 nodes that represent logical steps in the workflow.
- Position nodes in a left-to-right flow: x starts at 100, increments by 280. y is centered around 250 with slight variation.
- Connect nodes with edges that follow the logical order of execution.
- fieldNode should be a concise snake_case identifier (e.g. "parse_input", "extract_entities").
- instructions should be a clear 1–2 sentence description of what the node does.
- responseFields should list 1–4 key/value pairs representing expected outputs of the node.
- Edge ids should be like "e1-2", "e2-3", etc.
- All node ids should be simple strings like "1", "2", "3".
Node Layout Rules:

- Arrange the main workflow left to right in a zig-zag pattern.
- Increase X by ~500 for each next node.
- Alternate Y between positive and negative values.

Example:
Node 1 → x: 0, y: 250
Node 2 → x: 500, y: -180
Node 3 → x: 1000, y: 250
Node 4 → x: 1500, y: -180

Branching Rules:
- If a node has multiple branches (yes/no, success/failure), place branch nodes vertically separated on the right side.
- Example:
  - Yes branch → x: 2000, y: -400
  - No branch → x: 2000, y: 100
- Continue child nodes in their respective branch lanes.
- If branches merge back, place the merge node centered between branches.

Rules:
- Avoid overlapping nodes and edge crossings.
- Keep spacing clean and readable.
- positionAbsolute must exactly match position.
- width:
  - 300 if no responseFields
  - 340 if responseFields exist
- Increase height based on responseFields count.
"""


@app.post("/api/flows/generate")
async def generate_flow(payload: GeneratePayload):
    """
    Accepts a flow_name and a paragraph description.
    Calls OpenAI to generate a structured flow JSON.
    Saves (or overrides) the result in the flows/ directory.
    """

    file_name = payload.flow_name.strip().replace(" ", "-") or "generated-flow"

    if file_name.endswith(".json"):
        file_name = file_name[:-5]

    file_path = os.path.join(FLOWS_DIR, f"{file_name}.json")
    
    existing_flow_context = ""

    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as f:
                existing_flow = json.load(f)

            existing_flow_context = (
                "\n\nExisting flow JSON already present:\n"
                f"{json.dumps(existing_flow, indent=2)}\n\n"
                "Modify or extend this existing flow instead of creating from scratch."
            )

        except Exception as e:
            print(f"Failed to read existing flow: {e}")

    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not set on the server."
        )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Flow name: {payload.flow_name}\n\n"
                f"Description:\n{payload.paragraph}"
                f"{existing_flow_context}"
            ),
        },
    ]

    try:
        raw = await call_openai(messages)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI API error: {e.response.status_code} — {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to reach OpenAI: {str(e)}"
        )

    # ── parse the response ──
    # Strip accidental markdown fences if the model adds them anyway
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = "\n".join(cleaned.split("\n")[1:])
    if cleaned.endswith("```"):
        cleaned = "\n".join(cleaned.split("\n")[:-1])
    cleaned = cleaned.strip()

    try:
        flow_data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=422,
            detail=f"OpenAI returned invalid JSON: {str(e)}\n\nRaw response:\n{raw[:500]}"
        )

    # ── sanitise: strip handler functions that exist only in the React layer ──
    for node in flow_data.get("nodes", []):
        node_data = node.get("data", {})
        for fn_key in ("onChange", "onChangeResponseField", "onAddResponseField",
                       "onRemoveResponseField", "onDelete"):
            node_data.pop(fn_key, None)

    # ── build the final payload ──
    file_name = payload.flow_name.strip().replace(" ", "-") or "generated-flow"
    # Ensure it doesn't already have .json
    if file_name.endswith(".json"):
        file_name = file_name[:-5]

    save_payload = {
        "name": file_name,
        "generatedAt": datetime.utcnow().isoformat(),
        "sourcePrompt": payload.paragraph,
        "nodes": flow_data.get("nodes", []),
        "edges": flow_data.get("edges", []),
    }

    # ── save / override in flows/ ──
    file_path = os.path.join(FLOWS_DIR, f"{file_name}.json")
    with open(file_path, "w") as f:
        json.dump(save_payload, f, indent=2)

    return {
        "success": True,
        "message": f"Flow '{file_name}' generated and saved",
        "file": f"{file_name}.json",
        "nodes": save_payload["nodes"],
        "edges": save_payload["edges"],
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

@app.get("/session")
async def get_session(workflowName: str):
    try:

        file_name = workflowName.strip()[:-5]

        flow_path = f"./flows/{file_name}.json"

        instructions = "Start with the workflow below. Never ask how can I assist you"

        # Check if workflow file exists
        if os.path.exists(flow_path):
            try:
                with open(flow_path, "r") as f:
                    workflow_json = json.load(f)

                instructions += f"""

                    Follow this workflow strictly during the conversation.

                    Workflow JSON:
                    {json.dumps(workflow_json, indent=2)}

                """

            except Exception as e:
                return {
                    "success": False,
                    "message": f"Failed to read workflow file: {str(e)}"
                }

        else:
            return {
                "success": False,
                "message": "Workflow file not found"
            }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/realtime/sessions",
                    headers={
                        "Authorization": f"Bearer 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",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-realtime",
                        "voice": "shimmer",
                        "instructions": instructions,
                    }
                )                

                return response.json()
            
            except Exception as e:
                print("Error occured in gpt", str(e))

    except Exception as e:
        print("Error occured in /session", str(e))

if __name__ == "__main__":

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=True
    )