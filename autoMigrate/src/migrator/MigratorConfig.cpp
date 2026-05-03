#include "MigratorConfig.h"

#include <fstream>
#include <iostream>
#include <string>

#ifndef MIGRATOR_CONFIG_PATH
#define MIGRATOR_CONFIG_PATH "migrator.conf"
#endif

namespace {

std::string trim(const std::string& input) {
    const auto start = input.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) {
        return "";
    }

    const auto end = input.find_last_not_of(" \t\r\n");
    return input.substr(start, end - start + 1);
}

} // namespace

MigratorConfig loadMigratorConfig() {
    MigratorConfig config;

    std::ifstream in(MIGRATOR_CONFIG_PATH);
    if (!in.is_open()) {
        std::cout << "[WARN] Could not open config file: " << MIGRATOR_CONFIG_PATH
                  << ". Using defaults." << std::endl;
        return config;
    }

    std::string line;
    while (std::getline(in, line)) {
        const std::string cleaned = trim(line);
        if (cleaned.empty() || cleaned[0] == '#') {
            continue;
        }

        const auto equalPos = cleaned.find('=');
        if (equalPos == std::string::npos) {
            continue;
        }

        const std::string key = trim(cleaned.substr(0, equalPos));
        const std::string value = trim(cleaned.substr(equalPos + 1));

        if (key == "post_migration_sleep_seconds") {
            try {
                const int parsed = std::stoi(value);
                if (parsed > 0) {
                    config.postMigrationSleepSeconds = static_cast<unsigned int>(parsed);
                } else {
                    std::cout << "[WARN] Invalid post_migration_sleep_seconds: " << value
                              << ". Keeping default." << std::endl;
                }
            } catch (...) {
                std::cout << "[WARN] Failed to parse post_migration_sleep_seconds: " << value
                          << ". Keeping default." << std::endl;
            }
        }
        else if (key == "migration_interval_seconds") {
            try {
                const int parsed = std::stoi(value);
                if (parsed > 0) {
                    config.migrationIntervalSeconds = static_cast<unsigned int>(parsed);
                } else {
                    std::cout << "[WARN] Invalid migration_interval_seconds: " << value
                              << ". Keeping default." << std::endl;
                }
            } catch (...) {
                std::cout << "[WARN] Failed to parse migration_interval_seconds: " << value
                          << ". Keeping default." << std::endl;
            }
        }
    }

    std::cout << "[INFO] Config loaded. post_migration_sleep_seconds="
              << config.postMigrationSleepSeconds << std::endl;

    return config;
}
