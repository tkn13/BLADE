import influxdb_client, os, asyncio
from influxdb_client import InfluxDBClient
from schema.query_generator import get_query_text_node_cpu, get_query_text_node_mem
from typing import Optional
from dataclasses import dataclass
from datetime import datetime
from dotenv import load_dotenv
import os
import re
import subprocess


load_dotenv()
token = os.getenv("INFLUXDB_TOKEN")
dataPath = os.getenv("DATA_PATH")
org = "blade"
url = "http://127.0.0.1:8086"

client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)

query_api = client.query_api()

@dataclass
class Metric:
    timestamp: datetime
    cpu: Optional[float] = None
    mem: Optional[float] = None

@dataclass
class ResourceUsage:
    start_time: datetime
    end_time: datetime
    data_amount: int
    data: list[Metric]

@dataclass
class NodeMetricResponse:
    node_id: str
    node_status: str
    current_job: list[str]
    resource_usage: ResourceUsage

class MetricUnit:
    def __init__(self, timestamp, value):
        self.timestamp = timestamp
        self.value = value


async def get_node_cpu(
    node_id: str,
    time_delta: Optional[str] = "-1h",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
    ) -> list[MetricUnit]:
    query = get_query_text_node_cpu(node_id, time_delta, start_time, end_time)
    
    print(query)

    tables = query_api.query(query,org=org)
    
    return_value: list[MetricUnit] = []

    for table in tables:
        for record in table.records:
            return_value.append(MetricUnit(record['_time'], record['_value']))
    return return_value

async def get_node_mem(
    node_id: str,
    time_delta: Optional[str] = "-1h",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
    ) -> list[MetricUnit]:
    query = get_query_text_node_mem(node_id, time_delta, start_time, end_time)

    tables = query_api.query(query, org=org)

    return_value: list[MetricUnit] = []

    for table in tables:
        for record in table.records:
            return_value.append(MetricUnit(record['_time'], record['_value']))
    return return_value

def extract(data, target_num):
    job_ids = []
    # Pattern looks for 'blade-n' followed by a number OR bracketed ranges
    pattern = r"blade-n(?:(\d+)|\[([^\]]+)\])"

    for line in data.strip().splitlines():
        # Split the line to separate Job ID from the blade string
        parts = line.split(',', 1)
        if len(parts) < 2:
            continue

        job_id = parts[0]
        blade_info = parts[1]

        match = re.search(pattern, blade_info)
        if match:
            simple_num, bracket_content = match.groups()

            # Case 1: Simple number (e.g., blade-n1)
            if simple_num and int(simple_num) == target_num:
                job_ids.append(job_id)

            # Case 2: Bracketed ranges (e.g., [2-4,6])
            elif bracket_content:
                sub_parts = bracket_content.split(',')
                for p in sub_parts:
                    if '-' in p:
                        start, end = map(int, p.split('-'))
                        if start <= target_num <= end:
                            job_ids.append(job_id)
                            break
                    elif int(p) == target_num:
                        job_ids.append(job_id)
                        break

    return job_ids

def get_job_id_by_node(node_id):

    result = subprocess.run(["squeue", "-h", "-o", "%A,%N"], capture_output=True, text=True)

    if result.returncode == 0:
        output = extract(result.stdout, node_id)
        return output
    return []

def get_running_job(
    node_id: str) -> list[str]:

    return_value = get_job_id_by_node(int(node_id.replace("blade-n", "")))
    
    return return_value

async def get_node_metric(
    node_id: str,
    time_delta: Optional[str] = "-1h",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
    ):
    
    print(f"api was called {start_time}, {end_time}")

    cpu = await get_node_cpu(node_id, time_delta, start_time, end_time)
    mem = await get_node_mem(node_id, time_delta, start_time, end_time)

    merge: Dict[str, Metric] = {}
    
    print(cpu)

    for item in cpu:
        merge[item.timestamp] = Metric(timestamp=item.timestamp, cpu=item.value)

    for item in mem:
        if item.timestamp in merge:
            merge[item.timestamp].mem = item.value
        else:
            merge[item.timestamp] = Metric(timestamp=item.timestamp, mem=item.value)

    resource_data = sorted(merge.values(), key=lambda x: x.timestamp)
    
    if len(resource_data) > 0:
        resource_usage=ResourceUsage(
        start_time=resource_data[0].timestamp, 
        end_time=resource_data[-1].timestamp,
        data_amount=len(resource_data),
        data=resource_data)
    else:
        resource_usage=None
    
    return (NodeMetricResponse(
        node_id=node_id, 
        node_status="up", 
        current_job=get_running_job(node_id),
        resource_usage=resource_usage))
