#!/bin/bash


TARGET_PATH="./packages/"
PYTHONPATH_VAR=":$PYTHONPATH:"

if [[ "$PYTHONPATH_VAR" != *":$TARGET_PATH:"* ]]; then
	echo "NOT FOUND"
	export PYTHONPATH=$PYTHONPATH:$(pwd)/packages
fi

echo "Starting the server..."

./packages/bin/uvicorn main:app --host 0.0.0.0 --port 8001 --reload
