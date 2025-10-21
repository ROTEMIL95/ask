"""
Code Output Validator - Post-generation validation
Validates generated code examples before returning to frontend
"""
import re
from typing import Dict, List, Any


class CodeValidationError:
    """Structured code validation error"""
    def __init__(self, language: str, code: str, message: str):
        self.language = language
        self.code = code
        self.message = message

    def to_dict(self):
        return {
            'language': self.language,
            'code': self.code,
            'message': self.message
        }


class CodeOutputValidator:
    """Validator for generated code output"""

    def __init__(self):
        self.errors: List[CodeValidationError] = []
        self.warnings: List[CodeValidationError] = []

    def validate(self, generated_answer: str, snippets: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Validate generated code output

        Args:
            generated_answer: The full text response from LLM
            snippets: Optional dictionary of extracted code snippets by language

        Returns:
            Dictionary with validation results: {'valid': bool, 'errors': List[dict], 'warnings': List[dict]}
        """
        self.errors = []
        self.warnings = []

        # If snippets provided, validate each
        if snippets:
            for language, code in snippets.items():
                self._validate_code_snippet(language, code)

        # Also scan the full answer for common issues
        self._validate_answer_text(generated_answer)

        return {
            'valid': len(self.errors) == 0,
            'errors': [error.to_dict() for error in self.errors],
            'warnings': [warning.to_dict() for warning in self.warnings]
        }

    def _validate_code_snippet(self, language: str, code: str):
        """Validate individual code snippet"""
        if not code or not isinstance(code, str):
            return

        language_lower = language.lower()

        # 1. Check for "undefined" or "null" in URLs
        self._check_malformed_urls(language_lower, code)

        # 2. Check date formats
        self._check_date_formats(language_lower, code)

        # 3. Check authentication implementation
        self._check_auth_implementation(language_lower, code)

        # 4. Check for placeholder URLs
        self._check_placeholder_urls(language_lower, code)

        # 5. Check required headers
        self._check_required_headers(language_lower, code)

    def _check_malformed_urls(self, language: str, code: str):
        """Check for 'undefined' or 'null' strings in URLs"""
        # Pattern to find URLs with undefined/null
        url_patterns = [
            r'https?://[^"\'\s]*undefined[^"\'\s]*',
            r'https?://[^"\'\s]*null[^"\'\s]*',
            r'["\']https?://[^"\']*/(undefined|null)/',
            r'/by-id/(undefined|null)',
            r'/(undefined|null)/resource'
        ]

        for pattern in url_patterns:
            matches = re.findall(pattern, code, re.IGNORECASE)
            if matches:
                self.errors.append(CodeValidationError(
                    language,
                    'malformed_url',
                    f'Generated code contains malformed URL with "undefined" or "null": {matches[0]}'
                ))
                break

    def _check_date_formats(self, language: str, code: str):
        """Check that date values follow YYYY-MM-DD format and use correct year"""
        from datetime import datetime
        current_year = datetime.now().year

        # Look for date-related variables and their values
        date_patterns = [
            r'(checkIn|checkOut|startDate|endDate|date)["\']?\s*[:=]\s*["\'](\d{4}-\d{2}-\d{2})["\']',
            r'"(checkIn|checkOut|startDate|endDate|date)":\s*"(\d{4}-\d{2}-\d{2})"'
        ]

        # Check for invalid date formats
        invalid_date_patterns = [
            r'(checkIn|checkOut|startDate|endDate|date)["\']?\s*[:=]\s*["\'](\d{2}/\d{2}/\d{4})["\']',  # MM/DD/YYYY
            r'(checkIn|checkOut|startDate|endDate|date)["\']?\s*[:=]\s*["\'](\d{2}-\d{2}-\d{4})["\']',  # DD-MM-YYYY
        ]

        for pattern in invalid_date_patterns:
            matches = re.findall(pattern, code, re.IGNORECASE)
            if matches:
                self.warnings.append(CodeValidationError(
                    language,
                    'invalid_date_format',
                    f'Date should use YYYY-MM-DD format, found: {matches[0][1]}'
                ))

        # Check for dates with incorrect years (2023, 2024 when current year is different)
        old_year_pattern = r'["\'](202[0-4])-(\d{2})-(\d{2})["\']'
        old_year_matches = re.findall(old_year_pattern, code)
        for match in old_year_matches:
            year = int(match[0])
            if year < current_year:
                self.errors.append(CodeValidationError(
                    language,
                    'outdated_year_in_date',
                    f'Date uses outdated year {year}. Current year is {current_year}. Use {current_year} instead of {year}.'
                ))

    def _check_auth_implementation(self, language: str, code: str):
        """Check for proper authentication implementation"""
        # Check for Basic Auth encoding
        if 'basic' in code.lower():
            if language == 'javascript':
                # Should use btoa()
                if 'btoa' not in code:
                    self.warnings.append(CodeValidationError(
                        language,
                        'missing_basic_auth_encoding',
                        'Basic authentication should use btoa() for encoding in JavaScript'
                    ))
                # Check for proper usage: btoa(`${username}:${password}`)
                elif re.search(r'btoa\(["\']', code):
                    self.errors.append(CodeValidationError(
                        language,
                        'incorrect_btoa_usage',
                        'btoa() should use template literals with variables, not hardcoded strings'
                    ))

            elif language == 'python':
                # Should use base64
                if 'base64' not in code:
                    self.warnings.append(CodeValidationError(
                        language,
                        'missing_basic_auth_encoding',
                        'Basic authentication should use base64 encoding in Python'
                    ))

            elif language in ['curl', 'bash']:
                # Should use -u flag
                if '-u' not in code and 'Authorization: Basic' not in code:
                    self.warnings.append(CodeValidationError(
                        language,
                        'missing_basic_auth',
                        'cURL should use -u flag or Authorization header for basic auth'
                    ))

    def _check_placeholder_urls(self, language: str, code: str):
        """Check for generic placeholder URLs"""
        placeholder_patterns = [
            r'https?://api\.example\.com',
            r'https?://example\.com',
            r'http://localhost(?!:[0-9])',  # localhost without port is suspicious
        ]

        for pattern in placeholder_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                self.warnings.append(CodeValidationError(
                    language,
                    'placeholder_url',
                    'Code contains placeholder URL (example.com) - should use actual API endpoint'
                ))
                break

    def _check_required_headers(self, language: str, code: str):
        """Check that required headers are present for appropriate methods"""
        # Look for POST/PUT/PATCH methods
        has_post_put_patch = any(method in code.upper() for method in ['POST', 'PUT', 'PATCH'])

        if has_post_put_patch:
            # Should have Content-Type header
            if 'content-type' not in code.lower() and 'content_type' not in code.lower():
                self.warnings.append(CodeValidationError(
                    language,
                    'missing_content_type',
                    'POST/PUT/PATCH requests should include Content-Type header'
                ))

    def _validate_answer_text(self, answer: str):
        """Validate the full answer text for common issues"""
        if not answer:
            self.errors.append(CodeValidationError(
                'general',
                'empty_response',
                'Generated answer is empty'
            ))
            return

        # Check if answer contains code blocks
        if '```' not in answer:
            self.warnings.append(CodeValidationError(
                'general',
                'no_code_blocks',
                'Response does not contain properly formatted code blocks'
            ))

        # Check for minimum expected languages
        has_javascript = '```javascript' in answer.lower() or '```js' in answer.lower()
        has_python = '```python' in answer.lower() or '```py' in answer.lower()
        has_curl = '```bash' in answer.lower() or '```curl' in answer.lower() or '```sh' in answer.lower()

        if not (has_javascript or has_python or has_curl):
            self.warnings.append(CodeValidationError(
                'general',
                'missing_code_examples',
                'Response should include code examples in JavaScript, Python, and cURL'
            ))


def validate_generated_code(generated_answer: str, snippets: Dict[str, str] = None) -> Dict[str, Any]:
    """
    Validate generated code output

    Args:
        generated_answer: The full text response from LLM
        snippets: Optional dictionary of extracted code snippets by language

    Returns:
        Dictionary with validation results: {'valid': bool, 'errors': List[dict], 'warnings': List[dict]}
    """
    validator = CodeOutputValidator()
    return validator.validate(generated_answer, snippets)
