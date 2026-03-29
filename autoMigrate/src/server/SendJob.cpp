#include <iostream>
#include <string>
#include <vector>
#include <sys/socket.h>
#include <unistd.h>
#include <cstring>

#include "SendJob.h"
#include "Migrator.h"
#include "NodeControl.h"

void send(std::vector<std::string> input) {

    std::string command = "sudo -i -u " + input[4] +
    " env PATH=$PATH sendJob" +
    " -j " + input[0] +
    " -a \"" + input[1] + "\" "
    " -n " + input[2] +
    " -p " + input[3] +
    " -t " + input[4];

    std::cout << "[EXEC]" << command << std::endl;
    system(command.c_str());

}

void send_job(int clientSocket) {
    std::vector<std::string> response_message_list = {
        "Enter Job Path: ",
        "Enter Argument of your program: ",
        "Enter number of nodes: ",
        "Enter number of processes: ",
        "Enter Job Name: ",
        "exit"
    };

    std::vector<std::string> input;

    char buffer[1024];
    size_t count = 0;

    while (count < response_message_list.size()) {
        const std::string& message = response_message_list[count];
        
        ssize_t bytes_sent = send(clientSocket, message.c_str(), message.length(), 0);
        if (bytes_sent <= 0) break;

        std::memset(buffer, 0, sizeof(buffer));
        ssize_t bytes_received = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        
        if (bytes_received <= 0) {
            std::cerr << "Client disconnected or error occurred.\n";
            break;
        }

        input.push_back(buffer);

        count++;
    }
    
    std::shared_lock<std::shared_mutex> lock(system_mutex, std::try_to_lock);

    if(!lock.owns_lock()){
        std::cout << "Migration in progress. Rejecting client.\r\n\r\n" << std::endl;
        std::string errorMsg = "migrate";
        send(clientSocket, errorMsg.c_str(), errorMsg.size(), 0);
    }
    else{
        std::cout << "[INFO] Sending job to slurm." << std::endl;
        send(input);
        std::cout << "[INFO] Job sent to slurm." << std::endl;
        //delay a bit to let slurm update the job state after submission
        sleep(5);
        std::cout << "[INFO] Node Control is triggered." << std::endl;
	    node_control();
        std::cout << "[INFO] Node Control is ended." << std::endl;

    }
    close(clientSocket);
}
