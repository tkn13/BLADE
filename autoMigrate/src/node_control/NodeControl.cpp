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
    bool has_pending_jobs = std::any_of(jobs.begin(), jobs.end(), [](const JobState& j) {
        return j.job_state == "PENDING";
    });

    // 1. Power On Logic (Reactive)
    if (has_pending_jobs) {
        std::vector<NodeState*> off_pool;
        for (auto& node : nodes) {
            // Check if node is in a non-working state (down, drained, powered_down, etc.)
            if (NODE_HOST_MAP.count(node.node_id) && 
                node.node_state != "idle" && 
                node.node_state != "mixed" && 
                node.node_state != "allocated") {
                off_pool.push_back(&node);
            }
        }

        if (!off_pool.empty()) {
            std::random_device rd;
            std::mt19937 gen(rd());
            std::uniform_int_distribution<> dis(0, off_pool.size() - 1);
            
            NodeState* selected = off_pool[dis(gen)];
            power_on_node(selected->node_id, NODE_HOST_MAP.at(selected->node_id));
        }
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
