#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <random>
#include "SlurmInterface.h"

void node_control(std::vector<NodeState> nodes, std::vector<JobState> jobs) {
    // 1. Identify if there are PENDING jobs
    bool has_pending_jobs = std::any_of(jobs.begin(), jobs.end(), [](const JobState& j) {
        return j.job_state == "PENDING";
    });

    // 2. Power On Logic
    if (has_pending_jobs) {
        std::vector<NodeState*> power_on_pool;

        for (auto& node : nodes) {
            // Check if node is NOT in IDLE, MIXED, or ALLOCATED
            if (node.node_state != "idle" && 
                node.node_state != "mixed" && 
                node.node_state != "allocated") {
                power_on_pool.push_back(&node);
            }
        }

        if (!power_on_pool.empty()) {
            // Select a random node from the pool
            std::random_device rd;
            std::mt19937 gen(rd());
            std::uniform_int_distribution<> dis(0, power_on_pool.size() - 1);
            
            NodeState* selected_node = power_on_pool[dis(gen)];
            std::cout << "power on node triggered " << selected_node->node_id << std::endl;
        }
    }

    // 3. Power Off Logic
    for (const auto& node : nodes) {
        if (node.node_state == "idle") {
            std::cout << "power off node triggered " << node.node_id << std::endl;
        }
    }
}
int main(){

    std::vector<JobState> output = get_job_state();
    std::vector<NodeState> nodeState = get_node_state();

        for(JobState j : output){
            std::cout << j.job_id << " " << j.job_state << std::endl;
        }

        for(NodeState n : nodeState){
            std::cout << n.node_id << " " << n.node_state << std::endl;
        }
	
	node_control(nodeState, output);

    return 0;
}
