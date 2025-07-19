#!/bin/bash

# Start Kibana in the background
/usr/share/kibana/bin/kibana &

# Wait for Kibana to be ready (simple loop with curl)
echo "Waiting for Kibana to start..."
until curl -s -k https://localhost:5601 >/dev/null; do
  sleep 1
done

# Print enrollment token for Kibana
echo "########################################"
echo "# Kibana is ready!"
bin/elasticsearch-create-enrollment-token --scope kibana
echo "########################################"

# Extract and print password
password=$(echo "$output" | grep 'New value' | awk -F': ' '{print $2}')
echo "########################################"
echo "# Elastic user password: $password"
echo "########################################"

# TODO : Instead of printing the password in the logs, send it to vault. !!!

# Bring Elasticsearch back to foreground (optional: tail logs)
wait
