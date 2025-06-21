# IlseDeLangeRecords Migration Repository

This repository contains all migration scripts and documentation used to migrate the IlseDeLangeRecords website from the old format to the new modern web application.

## Contents

- **migration_scripts/**: Python scripts used for data extraction, conversion, and migration
- **migration_data/**: Extracted content, reports, and validation data from the migration process
- **prisma/migrations/**: Database migration files for the Prisma ORM
- **docs/**: Additional migration documentation

## Migration Documentation

- [MIGRATION.md](MIGRATION.md): Main migration documentation and process overview
- [MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md): Completion report and final status

## Scripts Overview

### Core Migration Scripts
- **complete_repository_migrator.py**: Main migration orchestrator
- **content_converter.py**: Converts old content format to new structure
- **content_parser.py**: Parses and extracts content from old website
- **github_migrator.py**: Handles GitHub repository migration
- **advanced_migrator.py**: Advanced migration features and optimizations

### Utility Scripts
- **cleanup_albums.py**: Cleans up album data inconsistencies
- **clone_and_extract.py**: Clones and extracts content from old repository
- **migration_tester.py**: Tests migration process and validates results
- **migration_validator.py**: Validates migrated content integrity

## Migration Data

The migration_data directory contains:
- **extracted_content/**: Raw extracted content (albums, lyrics, images)
- **reports/**: Migration reports and validation results
- **structure/**: Repository structure analysis and mapping

## Database Migrations

Prisma migration files for setting up the normalized database schema used by the new website.

## Usage

This repository is primarily for historical reference and documentation. The migration process has been completed and the website is now running on the new architecture.

For the live website, see: [ilsedelangerecords_web](https://github.com/ilsedelangerecords/ilsedelangerecords_web)
