import subprocess
from schema.Job import JobResponse, JobDetailResponse

def get_list_of_job_state():
    
    result = subprocess.run(["squeue", "-h", "-o", '%i %j %u %M %T %C %N'], capture_output=True, text=True)
    
    ##output e.g
    #1634 test thaksin 0:00 PENDING 2
    #1635 test thaksin 0:00 PENDING 2
    #1636 test thaksin 0:00 PENDING 2
    #1626 test thaksin 14:08 RUNNING 1 blade-n2
    #1627 test thaksin 1:03 RUNNING 2 blade-n1
    #1628 test thaksin 1:00 RUNNING 2 blade-n3

    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return JobResponse(
            jobTotal=0,
            runningJob=0,
            pendingJob=0,
            jobDetail=[]
        )

    line = result.stdout.strip().splitlines()
    jobTotal = len(line)
    runningJob = 0
    pendingJob = 0
    jobDetail = []
    for l in line:
        data = l.split()
        jobId = data[0]
        jobStatus = data[4]
        time = data[3]
        if jobStatus == "RUNNING":
            runningJob += 1
            nodeAlloc = data[6] if len(data) > 6 else "N/A"
            cpuAlloc = int(data[5]) if len(data) > 5 else 0
            jobDetail.append(JobDetailResponse(
                jobId=jobId,
                jobStatus=jobStatus,
                nodeAlloc=nodeAlloc,
                cpuAlloc=cpuAlloc,
                time=time
            ))
        elif jobStatus == "PENDING":
            pendingJob += 1
            jobDetail.append(JobDetailResponse(
                jobId=jobId,
                jobStatus=jobStatus,
                nodeAlloc="N/A",
                cpuAlloc=0,
                time=time
            ))
    return JobResponse(
        jobTotal=jobTotal,
        runningJob=runningJob,
        pendingJob=pendingJob,
        jobDetail=jobDetail
    )
            