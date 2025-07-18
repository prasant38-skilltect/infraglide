#!/bin/bash
if [ -f "main.tf.json" ]; then
    echo "File exists"
    if grep -q "aws_s3_bucket" main.tf.json; then
        echo "Found aws_s3_bucket"
        while read -r bucket_name; do
            echo "Processing bucket: $bucket_name"
        done < <(grep -o '"bucket":[[:space:]]*"[^"]*"' main.tf.json | sed 's/"bucket":[[:space:]]*"\([^"]*\)"/\1/')
    else
        echo "No aws_s3_bucket found"
    fi
else
    echo "File doesn't exist"
fi
