#ifndef SLURMINTERFACE_H
#define SLURMINTERFACE_H

#include <string>
#include <vector>

class JobState {
    public:
        std::string job_id;
        std::string job_state;
    
        JobState() : job_id(""), job_state("") {}
};

class NodeState{
    public:
        std::string node_id;
        std::string node_state;

        NodeState() : node_id(""), node_state("") {}
};

std::string get_slurm_output(char* args[]);
std::vector<JobState> get_job_state();
std::vector<NodeState> get_node_state();

#endif