#include <iostream>
#include "SlurmInterface.h"

int main(){

    std::vector<JobState> output = get_job_state();
    std::vector<NodeState> nodeState = get_node_state();

        for(JobState j : output){
            std::cout << j.job_id << " " << j.job_state << std::endl;
        }

        for(NodeState n : nodeState){
            std::cout << n.node_id << " " << n.node_state << std::endl;
        }

    return 0;
}