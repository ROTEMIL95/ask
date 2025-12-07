#!/usr/bin/env python3
"""
Script to remove logger.info, logger.debug, and print() statements from Python files
while keeping logger.error and logger.warning for critical errors.
"""

import re
import sys
from pathlib import Path


def remove_logging_statements(content):
    """
    Remove logger.info, logger.debug, and print statements.
    Keep logger.error and logger.warning.
    """
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Check if this line is a logger.info or logger.debug or print statement
        # Also check for app.logger.info (Flask logging)
        if (stripped.startswith('logger.info(') or
            stripped.startswith('logger.debug(') or
            stripped.startswith('app.logger.info(') or
            stripped.startswith('app.logger.debug(') or
            stripped.startswith('print(')):

            # Check if it's a single-line statement
            if stripped.endswith(')') or ');' in stripped:
                # Skip this line
                i += 1
                continue
            else:
                # Multi-line statement - count parentheses
                open_parens = line.count('(')
                close_parens = line.count(')')
                depth = open_parens - close_parens

                # Skip until we find closing parenthesis
                i += 1
                while i < len(lines) and depth > 0:
                    next_line = lines[i]
                    open_parens = next_line.count('(')
                    close_parens = next_line.count(')')
                    depth += open_parens - close_parens
                    i += 1
                continue

        result.append(line)
        i += 1

    return '\n'.join(result)


def process_file(file_path):
    """Process a single Python file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        cleaned_content = remove_logging_statements(content)

        if cleaned_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(cleaned_content)

            original_lines = len(original_content.split('\n'))
            cleaned_lines = len(cleaned_content.split('\n'))
            removed = original_lines - cleaned_lines

            print(f"OK {file_path}: Removed {removed} lines")
            return removed
        else:
            print(f"NO CHANGE {file_path}: No logging statements to remove")
            return 0

    except Exception as e:
        print(f"ERROR processing {file_path}: {e}")
        return 0


def main():
    # Files to process
    files_to_process = [
        'Backend/services/payment_service.py',
        'Backend/services/billing_service.py',
        'Backend/routes/proxy_routes.py',
        'Backend/routes/file_routes.py',
        'Backend/routes/api_routes.py',
        'Backend/routes/auth_routes.py',
        'Backend/routes/payment_routes.py',
        'Backend/routes/ocr_routes.py',
        'Backend/routes/contact_routes.py',
        'Backend/routes/payments_webhook.py',
        'Backend/routes/payment_complete.py',
        'Backend/supabase_client.py',
        'Backend/app.py',
        'Backend/limiter_config.py',
    ]

    print('Starting backend log removal...\n')

    total_removed = 0
    base_path = Path(__file__).parent

    for file_rel_path in files_to_process:
        file_path = base_path / file_rel_path
        if file_path.exists():
            total_removed += process_file(file_path)
        else:
            print(f"WARNING: File not found: {file_rel_path}")

    print(f'\nTotal lines removed: {total_removed}')


if __name__ == '__main__':
    main()
