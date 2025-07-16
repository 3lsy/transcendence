#!/bin/bash

# Start Elasticsearch in the background
/usr/share/elasticsearch/bin/elasticsearch &

# Wait for Elasticsearch to be ready (simple loop with curl)
echo "Waiting for Elasticsearch to start..."
until curl -s -k https://localhost:9200 >/dev/null; do
  sleep 1
done

# Reset password non-interactively
output=$(/usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic --batch)

# Extract and print password
password=$(echo "$output" | grep 'New value' | awk -F': ' '{print $2}')
echo "########################################"
echo "# Elastic user password: $password"
echo "########################################"

# TODO : Instead of printing the password in the logs, send it to vault. !!!

# Bring Elasticsearch back to foreground (optional: tail logs)
wait
