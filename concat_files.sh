#!/bin/bash

# ============================================================
# Script: combine_files.sh
# Description: Concatenates all useful project files into a single file,
#              excluding specified directories and files like 'node_modules', 'src/components/ui', 'package-lock.json'.
# Usage: ./combine_files.sh [output_file.txt]
# If no output file is specified, defaults to 'combined_file.txt'.
# ============================================================

# ---------------------
# 1. Setup Output File
# ---------------------

# Default output file name
output_file="combined_file.txt"

# If an output file is provided as an argument, use it
if [ "$1" ]; then
  output_file="$1"
fi

# Clear the output file if it already exists
> "$output_file"

# ---------------------------
# 2. Define Excluded Directories and Files
# ---------------------------

# Array of directories to exclude (relative to the script's location)
excluded_dirs=(
  "./node_modules"
  "./src/components/ui"
  "./backend/node_modules"  # Add more directories to exclude as needed
)

# Array of files to exclude
excluded_files=(
  "./package-lock.json"  # Exclude package-lock.json file
)

# -------------------------------
# 3. Build the 'find' Exclusion Expression
# -------------------------------

# Initialize the find command with the current directory
find_command=(find .)

# Loop through each excluded directory and add to the find command
for dir in "${excluded_dirs[@]}"; do
  find_command+=(-path "$dir" -prune -o)
done

# Loop through each excluded file and add to the find command
for file in "${excluded_files[@]}"; do
  find_command+=(-not -name "$(basename "$file")")
done

# Specify that we are interested in files only
find_command+=(-type f -print)

# ---------------------------
# 4. Execute the 'find' Command and Concatenate Files
# ---------------------------

# Run the find command and process each file
"${find_command[@]}" | while read -r file; do
  # Add a header with the file name
  echo "==== $file ====" >> "$output_file"
  
  # Append the file's content
  cat "$file" >> "$output_file"
  
  # Add a newline for readability between files
  echo "" >> "$output_file"
done

# ---------------------
# 5. Completion Message
# ---------------------

echo "All files have been concatenated into $output_file"
