#!/bin/bash

# Set the directory path
if [ $# -eq 0 ]; then
    dir_path="."
else
    dir_path="$1"
fi

# Output file name (you can change this if you want)
output_file="concatenated_output.mjs"

# Check if the directory exists
if [ ! -d "$dir_path" ]; then
    echo "Directory does not exist: $dir_path"
    exit 1
fi

# Change to the specified directory
cd "$dir_path" || exit

# Remove the output file if it already exists
rm -f "$output_file"

# Check if there are any .mjs files
mjs_files=$(ls -1 *.mjs 2>/dev/null)
if [ -z "$mjs_files" ]; then
    echo "No .mjs files found in $dir_path"
    exit 0
fi

# Loop through all .mjs files in the directory, sort them alphabetically
for file in $(echo "$mjs_files" | sort); do
    # Add a comment with the file name
    echo "// File: $file" >> "$output_file"
    
    # Concatenate the file content
    cat "$file" >> "$output_file"
    
    # Add a newline for separation
    echo "" >> "$output_file"
done

echo "Successfully concatenated .mjs files into $output_file"