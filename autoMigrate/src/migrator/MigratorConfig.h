#ifndef MIGRATORCONFIG_H
#define MIGRATORCONFIG_H

struct MigratorConfig {
    unsigned int postMigrationSleepSeconds = 5;
    unsigned int migrationIntervalSeconds = 60;
};

MigratorConfig loadMigratorConfig();

#endif
