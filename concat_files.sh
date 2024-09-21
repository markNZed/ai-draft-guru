#!/bin/bash

# ============================================================
# Script: combine_files.sh
# Description: Concatenates all useful project files into a single file,
#              excluding specified directories, files, and file patterns (e.g., '*.svg').
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

# Array of directories to exclude
# Include specific paths and directory names to exclude anywhere
excluded_dirs=(
  ".gpt_engineer"                # Directory name to exclude anywhere
  ".git"                          # Directory name to exclude anywhere
  "node_modules"                  # Directory name to exclude anywhere
  "frontend/src/components/ui"  # Specific directory path to exclude
  "dead"
)

# Array of specific files to exclude
excluded_files=(
  "./combine_files.sh"    # Updated to match the script's name
  "bun.lockb"
  "package-lock.json"     # Exclude package-lock.json file
  ".env"
  "$output_file"          # Automatically exclude the output file from concatenation
  "concat_files.sh"
  ".gitignore"
)

# Array of file patterns (using wildcards, e.g., *.svg or *.png)
excluded_patterns=(
  "*.ico"
  "*.svg"
  "*.png"
)

# -------------------------------
# 3. Build the 'find' Exclusion Expression
# -------------------------------

# Initialize the find command as an array
find_command=(find .)

# Begin grouping excluded directories
find_command+=("(")

# Iterate over excluded_dirs to add exclusion patterns
for dir in "${excluded_dirs[@]}"; do
  if [[ "$dir" == */* ]]; then
    # If the directory contains a slash, treat it as a specific path
    find_command+=("-path" "./$dir" "-o")
  else
    # Otherwise, treat it as a directory name to exclude anywhere
    find_command+=("-name" "$dir" "-o")
  fi
done

# Remove the last "-o" if any directories were added
if [ "${#excluded_dirs[@]}" -gt 0 ]; then
  unset 'find_command[-1]'
fi

# Close the grouping and add -prune to exclude the directories
find_command+=(")" "-prune" "-o")

# Specify that we are interested in files only
find_command+=("-type" "f")

# Loop through each excluded file and add to the find command
for file in "${excluded_files[@]}"; do
  find_command+=("-not" "-name" "$(basename "$file")")
done

# Loop through each excluded file pattern (wildcards) and add to the find command
for pattern in "${excluded_patterns[@]}"; do
  find_command+=("-not" "-name" "$pattern")
done

# End the find expression to print only the files we need
find_command+=("-print")

# ---------------------------
# 4. Execute the 'find' Command and Concatenate Files
# ---------------------------

# Run the find command and process each file
# Use "IFS=" and "read -r" to correctly handle filenames with spaces or special characters
"${find_command[@]}" | while IFS= read -r file; do
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
