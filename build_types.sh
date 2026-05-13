#!/bin/bash

# Compile Python
echo "Compiling Python..."
python -m grpc_tools.protoc -I packages/types \
    --python_out=packages/types/python/generated \
    packages/types/data.proto

# Compile TypeScript
echo "Compiling TypeScript..."
# Find the ts-proto plugin
TS_PROTO_PATH=$(which protoc-gen-ts_proto)
python -m grpc_tools.protoc -I packages/types \
    --plugin=protoc-gen-ts_proto=$TS_PROTO_PATH \
    --ts_proto_out=packages/types/typescript/generated \
    packages/types/data.proto

echo "✅ Types compiled successfully!"
