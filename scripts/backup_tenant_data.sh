#!/bin/bash
# DVT Talent AI — Multi-Tenant Backup Script
# Usage: ./backup_tenant_data.sh <tenant_id>

TENANT_ID=$1
BACKUP_DIR="./backups/tenants/${TENANT_ID}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

if [ -z "$TENANT_ID" ]; then
    echo "Error: Tenant ID is required."
    exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Initiating isolated backup for Tenant: ${TENANT_ID}..."

# Dump only data associated with the tenant_id
# We use pg_dump with a WHERE clause via a temporary view or table strategy
# For better efficiency in production, use a tenant-per-schema model

pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --table=companies --table=leads --table=candidates --table=jobs \
    --data-only \
    --column-inserts \
    -f "$OUTPUT_FILE"

# Filtering the dump for the specific tenant (Simplified logic for demonstration)
grep -E "INSERT INTO .* VALUES .*'${TENANT_ID}'" "$OUTPUT_FILE" > "${OUTPUT_FILE}.filtered"
mv "${OUTPUT_FILE}.filtered" "$OUTPUT_FILE"

echo "Backup completed: ${OUTPUT_FILE}"

# [OPTIONAL] Upload to Cloud Storage (S3/GCS)
# aws s3 cp "$OUTPUT_FILE" "s3://dvt-backups/tenants/${TENANT_ID}/"
