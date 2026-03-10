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

void execute_remote_command(const std::string& hostname, const std::string& command) {
    std::string ssh_cmd = "ssh " + hostname + " " + command;
    std::cout << "Executing: " << ssh_cmd << std::endl;
    // system(ssh_cmd.c_str()); // Uncomment this to actually run the commands
}

void check_node_control(std::vector<NodeState> nodes, std::vector<JobState> jobs) {
    bool has_pending_jobs = std::any_of(jobs.begin(), jobs.end(), [](const JobState& j) {
        return j.job_state == "PENDING";
    });

    // 1. Power On Logic
    if (has_pending_jobs) {
        std::vector<NodeState*> power_on_pool;

        for (auto& node : nodes) {
            // Only consider nodes we actually have in our host map
            if (NODE_HOST_MAP.count(node.node_id) && 
                node.node_state != "idle" && 
                node.node_state != "mixed" && 
                node.node_state != "allocated") {
                power_on_pool.push_back(&node);
            }
        }

        if (!power_on_pool.empty()) {
            std::random_device rd;
            std::mt19937 gen(rd());
            std::uniform_int_distribution<> dis(0, power_on_pool.size() - 1);
            
            NodeState* selected = power_on_pool[dis(gen)];
            std::string host = NODE_HOST_MAP.at(selected->node_id);
            
            // Execute: ssh $hostname sudo virsh start $nodename
            execute_remote_command(host, "sudo virsh start " + selected->node_id);
        }
    }

    // 2. Power Off Logic
    for (const auto& node : nodes) {
        if (node.node_state == "idle" && NODE_HOST_MAP.count(node.node_id)) {
            std::string host = NODE_HOST_MAP.at(node.node_id);
            
            // Execute: ssh $hostname sudo virsh destroy $nodename
            execute_remote_command(host, "sudo virsh destroy " + node.node_id);
        }
    }
}

void node_control() {
    std::cout << "Checking node states and controlling power accordingly..." << std::endl;
    // Standard Slurm data retrieval
    std::vector<JobState> jobState = get_job_state();
    std::vector<NodeState> nodeState = get_node_state();

    check_node_control(nodeState, jobState);
}