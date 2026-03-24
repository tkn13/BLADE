import subprocess
import os
from dataclasses import dataclass
from pathlib import Path

@dataclass
class NodeListResponse:
    idleNode: list[str]
    busyNode: list[str]
    downNode: list[str]
    errorNode: list[str]

def get_list_of_node_state() -> NodeListResponse:
   
    idleKeywords = ["idle", "npc", "power_down", "powered_down", "powering_up"]
    busyKeywords = ["alloc", "allocated", "mix", "mixed", "comp", "completing", "resv", "reserved"]
    downKeywords = ["down", "drain", "draining", "drained", "fail", "maint", "reboot_issued", "reboot_requested", "unk", "unknown", "no_respond", "blocked", "powering_down", "future", "futr", "planned", "perfctrs"]

    powerOffReasons = ["Auto Power off by Blade"]

    result = subprocess.run(["sinfo", "-h", "-o", "%n %T %E"], capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return NodeListResponse([], [], [], []) 
    
    idle, busy, down, error = [], [], [], []

    line = result.stdout.strip().splitlines()
    for l in line:
        data = l.split()
        nodeName = data[0]
        nodeState = data[1].lower()
        nodeReason = " ".join(data[2:]) if len(data) > 2 else ""

        if nodeState in idleKeywords:
            idle.append(nodeName)
        elif nodeState in busyKeywords:
            busy.append(nodeName)
        elif nodeState in downKeywords:
            if nodeReason in powerOffReasons:
                down.append(nodeName)
            else:
                error.append(nodeName)


    
# Utility to get a node's status as a string: 'up', 'alloc', or 'dead'
def get_node_status(node_id: str) -> str:
    states = get_list_of_node_state()
    if node_id in states.idleNode:
        return "Up"
    elif node_id in states.busyNode:
        return "Busy"
    elif node_id in states.downNode:
        return "Down"
    elif node_id in states.errorNode:
        return "Error"
    else:
        return "Unknown"
