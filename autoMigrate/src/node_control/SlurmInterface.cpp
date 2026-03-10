#include <string>
#include <vector>
#include <sstream>
#include <vector>
#include <unistd.h>
#include <sys/wait.h>

#include "SlurmInterface.h"

std::string get_slurm_output(char* args[]) {
    int pipefd[2];
    if (pipe(pipefd) == -1) {
        perror("pipe");
        return "";
    }

    pid_t pid = fork();
    if (pid == -1) {
        perror("fork");
        close(pipefd[0]);
        close(pipefd[1]);
        return nullptr;
    }

    if (pid == 0) {
        close(pipefd[0]);
        dup2(pipefd[1], STDOUT_FILENO);
        close(pipefd[1]);

       
        execvp(args[0], args);
        
        perror("execvp");
        _exit(1); 
    } else {
        close(pipefd[1]);

        std::string output = "";
        char buffer[4096];
        ssize_t bytesRead;

        while ((bytesRead = read(pipefd[0], buffer, sizeof(buffer))) > 0) {
            output.append(buffer, bytesRead);
        }

        close(pipefd[0]);
        waitpid(pid, nullptr, 0);

        return output;
    }
}

std::vector<JobState> get_job_state(){

    std::vector<JobState> Job_State;

    char* args[] = {
            (char*)"squeue", 
            (char*)"-h", 
            (char*)"-o", 
            (char*)"%i %T", 
            nullptr
        };
    
    std::string raw_data = get_slurm_output(args);

    if(raw_data.empty()) return Job_State;

    std::stringstream ss(raw_data);
    std::string line;

    while(std::getline(ss, line)){

        if(!line.empty()){

            std::stringstream lineStream(line);
            std::string job_id;
            std::string job_state;

            lineStream >> job_id >> job_state;

            JobState js;
            js.job_id = job_id;
            js.job_state = job_state;

            Job_State.push_back(js);

        }

    }

    return Job_State;
}

std::vector<NodeState> get_node_state(){

    std::vector<NodeState> Node_State;

    char* args[] = {
            (char*)"sinfo", 
            (char*)"-h", 
            (char*)"-o", 
            (char*)"%n %T", 
            nullptr
        };
    
    std::string raw_data = get_slurm_output(args);

    if(raw_data.empty()) return Node_State;

    std::stringstream ss(raw_data);
    std::string line;

    while(std::getline(ss, line)){

        if(!line.empty()){

            std::stringstream lineStream(line);
            std::string node_id;
            std::string node_state;

            lineStream >> node_id >> node_state;

            NodeState ns;
            ns.node_id = node_id;
            ns.node_state = node_state;

            Node_State.push_back(ns);

        }

    }

    return Node_State;
}

