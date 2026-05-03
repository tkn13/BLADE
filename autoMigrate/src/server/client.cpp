#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <sys/types.h>
#include <pwd.h>
#include <cstring>
#include <iostream>
#include <string>

#include "client.h"


char* get_username() {
    // Get the effective user ID
    uid_t uid = geteuid(); 

    // Get the password structure entry for the UID
    struct passwd *pw = getpwuid(uid); 

    // Return the username if found, otherwise a nullptr or an error message
    return (pw == nullptr) ? nullptr : pw->pw_name; 
}

int handleJobSubmission(int clientSocket, const char* initialMessage) {
    char buffer[1024];
    
    // 1. Send the initial service selection message
    if (send(clientSocket, initialMessage, strlen(initialMessage), 0) == -1) {
        return -1;
    }

    while(true){
        std::memset(buffer, 0, sizeof(buffer));
        
        // Wait for the server to ask a question (e.g., "Enter Job Path: ")
        ssize_t bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesReceived <= 0) {
            std::cout << "\nServer closed the connection early." << std::endl;
            return -1;
        }

        if (std::strcmp(buffer, "exit") == 0) {
            std::cout << "Task sent!" << std::endl;
            char* username = get_username();
            send(clientSocket, username, sizeof(username)/sizeof(username[0]), 0);
            return 0;
        }
        else if(std::strcmp(buffer, "migrate") == 0){
            std::cout << "[ERROR] Migration is happend right now please try again later." << std::endl;
        };

        // Display the prompt to the user
        std::cout << buffer << std::flush;

        // Get user typing
        std::string userInput;
        if (!std::getline(std::cin, userInput)) break;

        // Send user's answer back to server
        if (send(clientSocket, userInput.c_str(), userInput.length(), 0) == -1) {
            return -1;
        }
    }
    return 0;
}

int main(int argc, char* argv[]) {
    const char* serviceMessage = (argc > 1) ? argv[1] : "TEST";

    int clientSocket = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(WEB_CONFIG::PORT);
    serverAddr.sin_addr.s_addr = INADDR_ANY; 

    if (connect(clientSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == -1) {
        perror("Failed to connect");
        return -1;
    }

    // Enter the interactive loop
    if (handleJobSubmission(clientSocket, serviceMessage) == -1) {
        std::cerr << "Communication error." << std::endl;
    }

    close(clientSocket);
    return 0;
}