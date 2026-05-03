import json
import os
from datetime import datetime, timedelta

class Test:
    def __init__(self, tsetName, startTime, endTime):
        self.tsetName = tsetName
        self.startTime = startTime
        self.endTime = endTime

test = 'with_blade'

if(test == 'without_blade'):
    base_filename = 'withoutblade\\blade-n'
elif(test == 'with_blade'):
    base_filename = 'withblade\\blade-n'

#each test take 1 hour and rest 30 minutes
    #first test start at 2026-03-15T09:07:00+00:00 and end at 2026-03-15T12:30:00+00:00
test_list_without_blade = [
    Test("load_25", "2026-03-28T13:45:00+00:00", "2026-03-28T14:45:00+00:00"),
    Test("load_50", "2026-03-28T15:15:00+00:00", "2026-03-28T16:15:00+00:00"),
    Test("load_75", "2026-03-28T16:45:00+00:00", "2026-03-28T17:45:00+00:00"),
    Test("load_100", "2026-03-28T18:15:00+00:00", "2026-03-28T19:15:00+00:00")
]
test_list_without_blade_2 = [
    Test("load_25", "2026-03-28T19:30:00+00:00", "2026-03-28T20:30:00+00:00"),
    Test("load_50", "2026-03-28T21:00:00+00:00", "2026-03-28T22:00:00+00:00"),
    Test("load_75", "2026-03-28T22:30:00+00:00", "2026-03-28T23:30:00+00:00"),
    Test("load_100", "2026-03-29T00:00:00+00:00", "2026-03-29T01:00:00+00:00")
]
    
    #test list with blade start at 2026-03-15T14:00:00+00:00 and end at 2026-03-15T19:30:00+00:00
test_list_blade = [
    Test("load_25", "2026-03-28T06:30:00+00:00", "2026-03-28T07:30:00+00:00"),
    Test("load_50", "2026-03-28T08:00:00+00:00", "2026-03-28T09:00:00+00:00"),
    Test("load_75", "2026-03-28T09:30:00+00:00", "2026-03-28T10:30:00+00:00"),
    Test("load_100", "2026-03-28T11:00:00+00:00", "2026-03-28T12:00:00+00:00")
]
    
if(test == 'without_blade'):
    test_list = test_list_without_blade_2
elif(test == 'with_blade'):
    test_list = test_list_blade 

def read_node_data(filename):
    """Reads JSON data from the ./data/ directory."""
    filepath = os.path.join('.', 'data', filename)
    with open(filepath, 'r') as f:
        return json.load(f)

def write_node_data(filename, data):
    """Writes JSON data to the ./data/ directory."""
    filepath = os.path.join('.', 'data', filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)


def process_metrics(data, start_time_str, end_time_str, step_minutes):
    """
    Processes metrics based on a time range and minute step.
    If a calculated step timestamp is missing in the input, values are set to 0.
    """
    # Parse input strings to datetime objects
    start_dt = datetime.fromisoformat(start_time_str)
    end_dt = datetime.fromisoformat(end_time_str)
    
    # Map existing data for quick O(1) lookup
    # Input format uses ISO strings; we normalize them to ensure matches
    metrics_map = {
        entry['timestamp']: entry 
        for entry in data['resource_usage']['data']
    }
    
    output = []
    current_dt = start_dt
    
    while current_dt <= end_dt:
        # Convert current step back to ISO string format used in JSON
        # Note: Adjusting format if your JSON uses specific offsets (e.g., +00:00)
        ts_str = current_dt.isoformat(timespec='seconds').replace('Z', '+00:00')
        if '+00:00' not in ts_str:
            ts_str += '+00:00'

        if ts_str in metrics_map:
            entry = metrics_map[ts_str]
            output.append({
                "timestamp": ts_str,
                "cpu": entry['cpu'] if entry['cpu'] is not None else 0,
                "mem": entry['mem'] if entry['mem'] is not None else 0
            })
        else:
            # Mark as 0 if the specific step is missing from input data
            output.append({
                "timestamp": ts_str,
                "cpu": 0,
                "mem": 0
            })
        
        # Increment by the defined step
        current_dt += timedelta(minutes=step_minutes)
        
    return output

def power_used(cpu_utilization):
    # ref 10.1145/1273440.1250665
    P_IDLE = 27
    P_MAX = 84
    r = 1.4
    cpu_percentage = cpu_utilization / 100
    return P_IDLE + (P_MAX - P_IDLE) * (2*cpu_percentage - cpu_percentage**r)

def summarize_metrics(test_name):

    n = 8

    datalist = []
    for i in range(1, n + 1):
        input_filename = f"{base_filename}{i}_{test_name}_processed.json"
        data = read_node_data(input_filename)
        datalist.append(data['resource_usage']['data'])
    
    # Now datalist contains 8 lists of metrics data, one for each node
    
    # this section hardcode the duration of the test, 
    #which is 1 hour, and the step, 
    #which is 1 minute, 
    #so we have 60 data points for each node

    print(f"--- Summary for {test_name} ---")

    ## Calculate raw CPU data
    utilization_data = []
    power_data = []
    for i in range(60):
        cpu_sum = 0
        power_sum = 0
        node_count = 0
        for node_data in datalist:
            ## if cpu and mem are 0 assume that this node in power off
            if node_data[i]['cpu'] == 0 and node_data[i]['mem'] == 0:
                continue
            cpu_sum += node_data[i]['cpu']
            power_sum += power_used(node_data[i]['cpu'])
            node_count += 1
        utilization = (cpu_sum / (node_count * 100)) * 100 if node_count > 0 else 0
        utilization_data.append(utilization)
        power_data.append(power_sum)
        #print(f"Timestamp: {node_data[i]['timestamp']}, Total CPU: {cpu_sum}, Node Count: {node_count}, Utilization: {utilization:.2f}%")
    avg_utilization = sum(utilization_data) / len(utilization_data) if utilization_data else 0
    print(f"Average CPU Utilization: {avg_utilization:.2f}% \nAverage Power Used: {sum(power_data) / len(power_data) if power_data else 0:.2f} Watts")
    

    ##Calculate Processed CPU data
    ## Test subject have 2 cores cpu
    ## if raw cpu is about 40% < x < 60% we can assume that the test subject is running 1 core job
    ## if raw cpu is about 80% < x < 100% we can assume that the test subject is running 2 cores job
    processed_utilization_data = []
    for i in range(60):
        cpu_total = 0
        node_count = 0
        for node_data in datalist:
            if node_data[i]['cpu'] == 0 and node_data[i]['mem'] == 0:
                continue
            if 40 < node_data[i]['cpu'] < 60:
                cpu_total += 1
            elif 80 < node_data[i]['cpu'] < 100:
                cpu_total += 2
            node_count += 1
        processed_utilization = (cpu_total / (node_count * 2)) * 100 if node_count > 0 else 0
        processed_utilization_data.append(processed_utilization)
        #print(f"Timestamp: {node_data[i]['timestamp']}, Total CPU Cores: {cpu_total}, Node Count: {node_count}, Processed Utilization: {processed_utilization:.2f}%")
    avg_processed_utilization = sum(processed_utilization_data) / len(processed_utilization_data) if processed_utilization_data else 0
    print(f"Average Processed CPU Utilization: {avg_processed_utilization:.2f}%")
        

def generate_test_data():
    n = 8
    for test in test_list:
        for i in range(1, n + 1):
            input_filename = f"{base_filename}{i}.json"
            output_filename = f"{base_filename}{i}_{test.tsetName}_processed.json"
            
            # Read the input data
            data = read_node_data(input_filename)
            
            # Process the metrics with a step of 5 minutes
            processed_data = process_metrics(data, test.startTime, test.endTime, step_minutes=1)
            
            # Write the processed data to the output file
            write_node_data(output_filename, {"resource_usage": {"data": processed_data}})

def main():
    generate_test_data()
    test_names = ["load_25", "load_50", "load_75", "load_100"]
    for test_name in test_names:
        summarize_metrics(test_name)

if __name__ == "__main__":
    main()