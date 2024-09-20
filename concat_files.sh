#!/bin/bash

# Check if the output file is specified
output_file="combined_file.txt"

# If an output file is passed as an argument, use it
if [ "$1" ]; then
  output_file="$1"
fi

# Clear the output file if it exists
> "$output_file"

# Find all files in the src directory recursively
find src -type f | while read -r file; do
  echo "==== $file ====" >> "$output_file"
  cat "$file" >> "$output_file"
  echo "" >> "$output_file"  # Add a newline between files
done

echo "All files have been concatenated into $output_file"
