import subprocess
import os
from dataclasses import dataclass
from pathlib import Path

@dataclass
class NodeListResponse:
    idleNode: list[str]
    busyNode: list[str]
    downNode: list[str]

def get_list_of_node_state() -> NodeListResponse:
    # 1. Resolve path relative to THIS file
    base_path = Path(__file__).parent.resolve()
    script_path = base_path / ".." / "process" / "listnode.sh"

    # 2. Check if the script exists and is executable
    if not script_path.exists():
        print(f"Error: Script not found at {script_path}")
        return NodeListResponse([], [], [])

    try:
        # 3. Use 'executable="/bin/bash"' if the script lacks a shebang
        result = subprocess.run(
            [str(script_path)], 
            capture_output=True, 
            text=True, 
            check=True
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Execution failed: {e}")
        return NodeListResponse([], [], [])

    idle, busy, down = [], [], []

    # 4. Optimized Parsing
    for line in result.stdout.splitlines():
        if ":" not in line:
            continue
            
        state_part, nodes_part = line.split(":", 1)
        state = state_part.strip().lower()
        # Clean up nodes, filtering out empty strings
        nodes = [n.strip() for n in nodes_part.split(",") if n.strip()]

        if state == "idle":
            idle.extend(nodes)
        elif state == "busy":
            busy.extend(nodes)
        else:
            down.extend(nodes)

    return NodeListResponse(idle, busy, down)

# Utility to get a node's status as a string: 'up', 'alloc', or 'dead'
def get_node_status(node_id: str) -> str:
    states = get_list_of_node_state()
    if node_id in states.idleNode:
        return "up"
    elif node_id in states.busyNode:
        return "alloc"
    elif node_id in states.downNode:
        return "dead"
    else:
        return "unknown"
