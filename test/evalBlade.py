import re

def detect_migration_events(log_file_path):
    """
    Parses a log file to detect and extract details of job migration events.
    """
    # Regular expressions to match the specific log lines
    # Matches the start of a migration evaluation and captures the timestamp
    triggered_re = re.compile(r'^(\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2}).*\[INFO\] Migration is triggered\.')
    
    # Matches the flag indicating that jobs will actually be moved
    needed_re = re.compile(r'\[INFO\] Migration needed\.')
    
    # Matches the job outcome line to capture Job ID, Source Node, and Destination Node
    job_outcome_re = re.compile(r'\[INFO\] Job ID: (\d+), CPUs: \d+, SrcNode: (blade-n\d+), DestNode: (blade-n\d+)')
    
    # Matches the end of a migration cycle
    ended_re = re.compile(r'\[INFO\] Migration is ended\.')
    
    migration_events = []
    current_event = None
    
    with open(log_file_path, 'r') as file:
        for line in file:
            line = line.strip()
            
            # 1. Check if a new migration cycle is starting
            triggered_match = triggered_re.search(line)
            if triggered_match:
                current_event = {
                    'timestamp': triggered_match.group(1),
                    'is_needed': False,
                    'migrated_jobs': [],
                    'remaining_jobs': []
                }
                continue
            
            # 2. Process lines within an active migration cycle
            if current_event:
                # Check if the cycle was flagged as needing migration
                if needed_re.search(line):
                    current_event['is_needed'] = True
                
                # Check for job movements
                job_match = job_outcome_re.search(line)
                if job_match:
                    job_id, src_node, dest_node = job_match.groups()
                    
                    if src_node == dest_node:
                        current_event['remaining_jobs'].append({'job_id': job_id, 'node': src_node})
                    else:
                        current_event['migrated_jobs'].append({
                            'job_id': job_id, 
                            'from_node': src_node, 
                            'to_node': dest_node
                        })
                
                # 3. Check if the cycle has ended
                if ended_re.search(line):
                    # Only save the event if an actual migration was needed/occurred
                    if current_event['is_needed']:
                        migration_events.append(current_event)
                    # Reset the tracker
                    current_event = None

    return migration_events

if __name__ == "__main__":
    # Ensure the log file is in the same directory or provide the full path
    log_file = "data/blade.log" 
    
    try:
        events = detect_migration_events(log_file)
        
        print(f"Found {len(events)} execution(s) where migration was needed.\n")
        
        for i, event in enumerate(events, 1):
            print(f"--- Event {i} @ {event['timestamp']} ---")
            
            if event['migrated_jobs']:
                print("Jobs Migrated:")
                for job in event['migrated_jobs']:
                    print(f"  - Job {job['job_id']}: Moved from {job['from_node']} -> {job['to_node']}")
            
            if event['remaining_jobs']:
                print("Jobs that Remained:")
                for job in event['remaining_jobs']:
                    print(f"  - Job {job['job_id']}: Stayed on {job['node']}")
            
            print() # Add empty line for readability

    except FileNotFoundError:
        print(f"Error: Could not find the file '{log_file}'. Please check the path.")