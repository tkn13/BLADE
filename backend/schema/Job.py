from pydantic import BaseModel

class JobResponse(BaseModel):
    jobTotal: int
    runningJob: int
    pendingJob: int
    jobDetail: list[JobDetailResponse]

class JobDetailResponse(BaseModel):
    jobId: str
    jobStatus: str
    nodeAlloc: str
    cpuAlloc: int
    time: str

