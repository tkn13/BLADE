find_package(Threads REQUIRED)

add_library(migrator_lib
    Migrator.cpp
    MigratorConfig.cpp
    Node.cpp
    NodeList.cpp
    SlurmInterface.cpp
    JobPacker.cpp
)

configure_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/migrator.conf
    ${CMAKE_CURRENT_BINARY_DIR}/migrator.conf
    COPYONLY
)

target_compile_definitions(migrator_lib
    PRIVATE MIGRATOR_CONFIG_PATH="${CMAKE_CURRENT_BINARY_DIR}/migrator.conf"
)

target_include_directories(migrator_lib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(migrator_lib 
    PRIVATE 
    Threads::Threads
    node_control_lib
)

add_executable(migrator_bin main.cpp)
target_link_libraries(migrator_bin PRIVATE migrator_lib)