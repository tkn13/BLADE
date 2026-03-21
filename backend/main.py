import sys
import os

from typing import Annotated, Union

from fastapi import FastAPI, Request, Header 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from middleware import isPass
from api.NodeDetail import get_node_metric
from api.NodeDetail import get_nodes_metric
from api.NodeList import get_list_of_node_state
from api.Job import get_list_of_job_state
from api.JobDetail import get_job_detail

from schema.Job import JobResponse
from schema.Job import JobDetailResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommonHeaders(BaseModel):
    apikey: str

@app.middleware("http")
async def checkApiKey(request: Request, call_next):
    
    if request.method == "OPTIONS" or request.url.path in ["/docs", "/redoc", "/openapi.json"]:
        response = await call_next(request)
        return response

    if not(isPass(request.headers.get("apikey"))):
        return JSONResponse(
            status_code=401, 
            content={"detail": "API KEY is missing or invalid"}
        )
    response = await call_next(request)
    return response


@app.get("/")
async def root(headers: Annotated[CommonHeaders, Header()]):
    return headers

@app.get("/api/metrics/cluster/summary")
async def clusterSummary(headers: Annotated[CommonHeaders, Header()]):
    return JSONResponse(
        status_code=201,
        content={"message": "/metrics/cluster/summary"}
    )

@app.get("/api/metrics/node")
async def nodeAll(headers: Annotated[CommonHeaders, Header()]):
    return get_list_of_node_state()

@app.get("/api/metrics/node/batch")
async def nodeBatch(headers: Annotated[CommonHeaders, Header()],
    node_ids: str, 
    time_delta: Union[str, None] = "-5m", 
    start_time: Union[str, None] = None, 
    end_time: Union[str, None] = None):
    
    node_id_list = node_ids.split(",")
    return await get_nodes_metric(node_id_list, time_delta=time_delta, start_time=start_time, end_time=end_time)

@app.get("/api/metrics/node/{node_id}")
async def nodeById(headers: Annotated[CommonHeaders, Header()],
    node_id: str, 
    time_delta: Union[str, None] = "-5m", 
    start_time: Union[str, None] = None, 
    end_time: Union[str, None] = None):
    return await get_node_metric(node_id, time_delta=time_delta, start_time=start_time, end_time=end_time)

@app.get("/api/metrics/job", response_model=JobResponse)
async def jobAll(headers: Annotated[CommonHeaders, Header()]):
    return get_list_of_job_state()
 
@app.get("/api/metrics/job/{job_id}", response_model=JobDetailResponse)
async def jobById(job_id, headers: Annotated[CommonHeaders, Header()]):
    return get_job_detail(job_id)
