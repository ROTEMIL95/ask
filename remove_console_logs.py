#!/usr/bin/env python3
"""
Script to remove all console.log/warn/error/info/debug statements from JS/JSX files
while preserving the file structure and functionality.
"""

import re
import sys
from pathlib import Path


def remove_console_logs(content):
    """
    Remove console.* statements from JavaScript/JSX content.
    Handles:
    - Single line console statements
    - Multi-line console statements
    - Console statements as standalone lines or within blocks
    """

    # Pattern to match console.log/warn/error/info/debug statements
    # This handles both single-line and multi-line console calls
    patterns = [
        # Single line console statements (complete line)
        r'^\s*console\.(log|warn|error|info|debug)\([^;]*\);?\s*$',

        # Console statements within code blocks (not at start of line)
        r'\s*console\.(log|warn|error|info|debug)\([^)]*\);?',

        # Multi-line console statements
        r'console\.(log|warn|error|info|debug)\s*\([^)]*\)',
    ]

    lines = content.split('\n')
    result_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if this line contains a console statement
        if re.search(r'console\.(log|warn|error|info|debug)', line):
            # Check if it's a complete statement on one line
            if ';' in line or line.strip().endswith(')'):
                # Skip this line entirely
                i += 1
                continue
            else:
                # Multi-line console statement - skip until we find the closing
                depth = line.count('(') - line.count(')')
                i += 1
                while i < len(lines) and depth > 0:
                    depth += lines[i].count('(') - lines[i].count(')')
                    i += 1
                continue

        result_lines.append(line)
        i += 1

    return '\n'.join(result_lines)


def process_file(file_path):
    """Process a single file to remove console logs."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        cleaned_content = remove_console_logs(content)

        if cleaned_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(cleaned_content)

            # Count removed lines
            original_lines = len(original_content.split('\n'))
            cleaned_lines = len(cleaned_content.split('\n'))
            removed = original_lines - cleaned_lines

            print(f"✅ {file_path}: Removed {removed} console log lines")
            return removed
        else:
            print(f"⚪ {file_path}: No console logs found")
            return 0

    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return 0


def main():
    if len(sys.argv) < 2:
        print("Usage: python remove_console_logs.py <file_or_directory>")
        sys.exit(1)

    path = Path(sys.argv[1])

    if not path.exists():
        print(f"❌ Path does not exist: {path}")
        sys.exit(1)

    total_removed = 0

    if path.is_file():
        total_removed = process_file(path)
    elif path.is_dir():
        # Process all .js and .jsx files in directory
        for file_path in path.rglob('*.jsx'):
            total_removed += process_file(file_path)
        for file_path in path.rglob('*.js'):
            if 'node_modules' not in str(file_path):
                total_removed += process_file(file_path)

    print(f"\n🎉 Total console log lines removed: {total_removed}")


if __name__ == '__main__':
    main()
