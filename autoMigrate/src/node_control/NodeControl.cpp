#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <random>
#include <map>
#include <cstdlib> // For system()
#include "SlurmInterface.h"

// Global map linking Node Names to their physical VM Hosts
const std::map<std::string, std::string> NODE_HOST_MAP = {
    {"blade-n1", "cs-wk01"}, {"blade-n2", "cs-wk01"},
    {"blade-n3", "cs-wk02"}, {"blade-n4", "cs-wk02"},
    {"blade-n5", "cs-wk03"}, {"blade-n6", "cs-wk03"},
    {"blade-n7", "cs-wk04"}, {"blade-n8", "cs-wk04"}
};

// Helper to execute shell commands
void run_cmd(const std::string& cmd) {
    std::cout << "[EXEC] " << cmd << std::endl;
    std::system(cmd.c_str());
}

void power_on_node(const std::string& nodename, const std::string& host) {
    // 1. Physical/VM Power On
    run_cmd("ssh " + host + " sudo virsh start " + nodename);
    
    // 2. Slurm State Update: Set to IDLE so it can accept jobs
    run_cmd("sudo scontrol update NodeName=" + nodename + " State=IDLE");
}

void power_off_node(const std::string& nodename, const std::string& host) {
    // 1. Physical/VM Power Off
    run_cmd("ssh " + host + " sudo virsh shutdown " + nodename);
    
    // 2. Slurm State Update: Set to DOWN with a reason
    run_cmd("sudo scontrol update NodeName=" + nodename + " State=DOWN Reason=\"Auto Power off by Blade\"");
}

void check_node_control(std::vector<NodeState> nodes, std::vector<JobState> jobs) {

    // 1. Power On Logic (Conservative)
    // check if any job is pending and this job to queue
    //calulate the total cpu request of the job in the queue
    // open node until the total cpu request is satisfied
    // node is open randomly to balance the load
    int total_cpu_request = 0;
    for (const auto& job : jobs) {
        if (job.job_state == "PENDING") {
            total_cpu_request += job.job_cpus;
        }
    }

    //each node have 2 cpus, so we need to open total_cpu_request / 2 nodes
    int nodes_to_open = (total_cpu_request + 1) / 2; //round up
    std::vector<std::string> down_nodes;
    for (const auto& node : nodes) {
        if (node.node_state != "idle" && NODE_HOST_MAP.count(node.node_id)) {
            down_nodes.push_back(node.node_id);
        }
    }

    std::random_device rd;
    std::mt19937 g(rd());
    std::shuffle(down_nodes.begin(), down_nodes.end(), g);
    for(int i = 0; i < std::min(nodes_to_open, (int)down_nodes.size()); i++){
        power_on_node(down_nodes[i], NODE_HOST_MAP.at(down_nodes[i]));
    }


    // 2. Power Off Logic (Aggressive)
    for (const auto& node : nodes) {
        if (node.node_state == "idle" && NODE_HOST_MAP.count(node.node_id)) {
            power_off_node(node.node_id, NODE_HOST_MAP.at(node.node_id));
        }
    }
    
}

void node_control() {
    // Standard Slurm data retrieval
    std::vector<JobState> jobState = get_job_state();
    std::vector<NodeState> nodeState = get_node_state();

    check_node_control(nodeState, jobState);
}
