#!/bin/bash

# ============================================================
# Script: combine_files.sh
# Description: Concatenates all useful project files into a single file,
#              excluding specified directories, files, and file patterns (e.g. '*.svg').
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
# 2. Define Excluded Directories, Files, and Patterns
# ---------------------------

# Array of directories to exclude (relative to the script's location)
excluded_dirs=(
  "./.gpt_engineer"
  "./.git"
  "./node_modules"
  "./src/components/ui"
  "./backend/node_modules"  # Add more directories to exclude as needed
)

# Array of specific files to exclude
excluded_files=(
  "./concat_files.sh"
  "./bun.lockb"
  "./package-lock.json"  # Exclude package-lock.json file
  ".env"
  "./combined_file.txt"
)

# Array of file patterns (using regex) to exclude, e.g., *.svg or *.png
excluded_patterns=(
  "*.ico"
  "*.svg"
  "*.png"
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

# Loop through each excluded file pattern (regex) and add to the find command
for pattern in "${excluded_patterns[@]}"; do
  find_command+=(-not -name "$pattern")
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
