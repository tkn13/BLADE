find_package(Threads REQUIRED)

add_library(migrator_lib
    Migrator.cpp
    Node.cpp
    NodeList.cpp
    SlurmInterface.cpp
    JobPacker.cpp
)

target_include_directories(migrator_lib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(migrator_lib 
    PRIVATE 
    Threads::Threads
    node_control_lib
)

add_executable(migrator_bin main.cpp)
target_link_libraries(migrator_bin PRIVATE migrator_lib)