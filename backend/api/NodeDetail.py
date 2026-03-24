import influxdb_client, os, asyncio
from influxdb_client import InfluxDBClient
from schema.query_generator import get_query_text_node_cpu, get_query_text_node_mem
from typing import Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import re
import subprocess

from api.NodeList import get_node_status


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
    total_mem: Optional[int] = None

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
    


    tables = query_api.query(query,org=org)

    #From tables quert have 2 messurement cpu usage_system and usage_user
    #we need to sum them up to get total cpu usage
    #and return list of MetricUnit with timestamp and total cpu usage

    cpu_usage_dict: Dict[datetime, float] = {}
    cpu_usage_system_dict: Dict[datetime, float] = {}
    
    return_value: list[MetricUnit] = []

    for table in tables:
        for record in table.records:
            if record['_field'] == 'usage_system':
                cpu_usage_system_dict[record['_time']] = record['_value']
            elif record['_field'] == 'usage_user':
                cpu_usage_dict[record['_time']] = record['_value']
    
    for timestamp in set(cpu_usage_dict.keys()).union(cpu_usage_system_dict.keys()):
        user_cpu = cpu_usage_dict.get(timestamp, 0)
        system_cpu = cpu_usage_system_dict.get(timestamp, 0)
        total_cpu = user_cpu + system_cpu
        return_value.append(MetricUnit(timestamp, total_cpu))

    return return_value


#Convert byte to GB with 2 decimal places
def byte_to_gb(byte_value: float) -> float:
    return round(byte_value / (1024 ** 3), 2)

async def get_node_mem(
    node_id: str,
    time_delta: Optional[str] = "-1h",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
    ) -> list[MetricUnit]:
    query = get_query_text_node_mem(node_id, time_delta, start_time, end_time)

    tables = query_api.query(query, org=org)

    return_value: list[MetricUnit] = []

    ##Focus only _field used
    for table in tables:
        for record in table.records:
            if record['_field'] == 'used':
                return_value.append(MetricUnit(record['_time'], byte_to_gb(record['_value'])))
    
    ##Get Total mem from _field total
    total_mem = None
    for table in tables:
        for record in table.records:
            if record['_field'] == 'total':
                total_mem = byte_to_gb(record['_value'])
                break
        if total_mem is not None:
            break

    return return_value, total_mem

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
    time_delta: Optional[str] = "-5m",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
    ):
    
    node_status = get_node_status(node_id)
    if node_status == "Down" or node_status == "Error":
        return NodeMetricResponse(
            node_id=node_id, 
            node_status=node_status, 
            current_job=[], 
            resource_usage=ResourceUsage(start_time=None, end_time=None, data_amount=0, data=[])
            )

    cpu = await get_node_cpu(node_id, time_delta, start_time, end_time)
    mem, total = await get_node_mem(node_id, time_delta, start_time, end_time)
    

    merge: Dict[str, Metric] = {}
    
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
        resource_usage=ResourceUsage(
        start_time=None,
        end_time=None,
        data_amount=0,
        data=[]
        )
    
    return_val = NodeMetricResponse(
        node_id=node_id, 
        node_status=node_status, 
        current_job=get_running_job(node_id),
        resource_usage=resource_usage,
        total_mem=total)

    
    ##preprocess resource usage data by aggregating into 5s intervals using average and sliding window of 5s
    
    if return_val.resource_usage.data:
        aggregated_data = []
        window_size = 5  # seconds
        current_window_start = resource_usage.data[0].timestamp
        current_window_end = current_window_start + timedelta(seconds=window_size)
        current_window_values = []

        for metric in resource_usage.data:
            while metric.timestamp >= current_window_end:
                if current_window_values:
                    avg_cpu = sum(m.cpu for m in current_window_values if m.cpu is not None) / len(current_window_values)
                    avg_mem = sum(m.mem for m in current_window_values if m.mem is not None) / len(current_window_values)
                    aggregated_data.append(Metric(timestamp=current_window_start, cpu=avg_cpu, mem=avg_mem))
                else:
                    aggregated_data.append(Metric(timestamp=current_window_start, cpu=None, mem=None))

                current_window_start = current_window_end
                current_window_end += timedelta(seconds=window_size)
                current_window_values = []

            current_window_values.append(metric)

        # Handle the last window
        if current_window_values:
            avg_cpu = sum(m.cpu for m in current_window_values if m.cpu is not None) / len(current_window_values)
            avg_mem = sum(m.mem for m in current_window_values if m.mem is not None) / len(current_window_values)
            aggregated_data.append(Metric(timestamp=current_window_start, cpu=avg_cpu, mem=avg_mem))
        else:
            aggregated_data.append(Metric(timestamp=current_window_start, cpu=None, mem=None))

        return_val.resource_usage.data = aggregated_data
    
    return_val.resource_usage.data_amount = len(return_val.resource_usage.data) if return_val.resource_usage else 0
    
    return return_val

async def get_nodes_metric(
    node_ids: list[str],
    time_delta: Optional[str] = "-5m",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
    ) -> list[NodeMetricResponse]:
    
    tasks = [get_node_metric(node_id, time_delta, start_time, end_time) for node_id in node_ids]
    return await asyncio.gather(*tasks)
