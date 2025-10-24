#!/usr/bin/env bash
# Use this script to start a local PostgreSQL database using Docker (via OrbStack)

# TO RUN ON WINDOWS:
# 1. Install WSL (Windows Subsystem for Linux) - https://learn.microsoft.com/en-us/windows/wsl/install
# 2. Install Docker Desktop (or another engine). OrbStack is macOS only.
# 3. Open WSL - `wsl`
# 4. Run this script - `./start-database.sh`

# On macOS we recommend OrbStack (https://orbstack.dev). Ensure it is running before executing this script.
# On Linux you can run this script directly - `./start-database.sh`

# import env variables from .env
set -a
source .env

DB_USER=$(echo "$DATABASE_URL" | sed -E 's#^[^:]+://([^:@]+).*#\1#')
DB_PASSWORD=$(echo "$DATABASE_URL" | awk -F':' '{print $3}' | awk -F'@' '{print $1}')
DB_PORT=$(echo "$DATABASE_URL" | awk -F':' '{print $4}' | awk -F'\/' '{print $1}')
DB_NAME=$(echo "$DATABASE_URL" | awk -F'/' '{print $4}')
DB_CONTAINER_NAME="$DB_NAME-postgres"

if [ -z "$DB_USER" ] || [ "$DB_USER" = "$DATABASE_URL" ]; then
  DB_USER="postgres"
fi

ORBSTACK_BIN=$(command -v orbctl || command -v orbstack)

if ! command -v docker >/dev/null 2>&1; then
  if [ -n "$ORBSTACK_BIN" ]; then
    echo "OrbStack detected but Docker CLI is not available. Ensure OrbStack's Docker integration is enabled."
  else
    echo -e "Docker is not installed. macOS users can install OrbStack (https://orbstack.dev) which provides a drop-in Docker engine."
  fi
  exit 1
fi

# ensure OrbStack is running if available
if [ -n "$ORBSTACK_BIN" ]; then
  if ! $ORBSTACK_BIN status >/dev/null 2>&1; then
    echo "OrbStack daemon not running. Attempting to start OrbStack..."
    if ! $ORBSTACK_BIN start >/dev/null 2>&1; then
      echo "Unable to start OrbStack automatically. Please open the OrbStack app and try again."
      exit 1
    fi
  fi
fi

DOCKER_CMD="docker"

if ! $DOCKER_CMD info >/dev/null 2>&1; then
  echo "Docker daemon is not running. If you are using OrbStack, open the OrbStack app and ensure Docker support is enabled."
  exit 1
fi

if command -v nc >/dev/null 2>&1; then
  if nc -z localhost "$DB_PORT" 2>/dev/null; then
    echo "Port $DB_PORT is already in use."
    exit 1
  fi
else
  echo "Warning: Unable to check if port $DB_PORT is already in use (netcat not installed)"
  read -p "Do you want to continue anyway? [y/N]: " -r REPLY
  if ! [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 1
  fi
fi

if [ "$($DOCKER_CMD ps -q -f name=$DB_CONTAINER_NAME)" ]; then
  echo "Database container '$DB_CONTAINER_NAME' already running"
  exit 0
fi

if [ "$($DOCKER_CMD ps -q -a -f name=$DB_CONTAINER_NAME)" ]; then
  $DOCKER_CMD start "$DB_CONTAINER_NAME"
  echo "Existing database container '$DB_CONTAINER_NAME' started"
  exit 0
fi

if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "password" ]; then
  echo "You are using the default database password"
  read -p "Should we generate a random password for you? [y/N]: " -r REPLY
  if ! [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Please change the default password in the .env file and try again"
    exit 1
  fi
  # Generate a random URL-safe password
  DB_PASSWORD=$(openssl rand -base64 12 | tr '+/' '-_')
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s#://${DB_USER}:.*@#://${DB_USER}:$DB_PASSWORD@#" .env
  else
    sed -i "s#://${DB_USER}:.*@#://${DB_USER}:$DB_PASSWORD@#" .env
  fi
fi

$DOCKER_CMD run -d \
  --name $DB_CONTAINER_NAME \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -e POSTGRES_DB="$DB_NAME" \
  -p "$DB_PORT":5432 \
  docker.io/postgres && echo "Database container '$DB_CONTAINER_NAME' was successfully created"
