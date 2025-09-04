#!/bin/bash

# Check if matchId is provided
if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <matchId>"
    exit 1
fi

MATCH_ID="$1"
URL="https://transcendence.42.fr/api/game/move"

echo "Controlling game for match '$MATCH_ID'."
echo "Controls:"
echo "  ↑ / ↓ = Right paddle"
echo "  w / s = Left paddle"
echo "  q     = Quit"

while true; do
    read -rsn1 key
    if [[ $key == $'\e' ]]; then
        read -rsn2 key
        case "$key" in
            "[A") # Up arrow
                echo "RIGHT UP"
                curl -sk -X POST "$URL" \
                    -H "Content-Type: application/json" \
                    -d "{\"matchId\": \"$MATCH_ID\", \"side\": \"right\", \"dy\": -15}"
                ;;
            "[B") # Down arrow
                echo "RIGHT DOWN"
                curl -sk -X POST "$URL" \
                    -H "Content-Type: application/json" \
                    -d "{\"matchId\": \"$MATCH_ID\", \"side\": \"right\", \"dy\": 15}"
                ;;
        esac
    elif [[ $key == "w" ]]; then
        echo "LEFT UP"
        curl -sk -X POST "$URL" \
            -H "Content-Type: application/json" \
            -d "{\"matchId\": \"$MATCH_ID\", \"side\": \"left\", \"dy\": -15}"
    elif [[ $key == "s" ]]; then
        echo "LEFT DOWN"
        curl -sk -X POST "$URL" \
            -H "Content-Type: application/json" \
            -d "{\"matchId\": \"$MATCH_ID\", \"side\": \"left\", \"dy\": 15}"
    elif [[ $key == "q" ]]; then
        echo "Exiting..."
        break
    fi
done
