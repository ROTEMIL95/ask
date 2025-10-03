"""
File Processing Routes - File upload and processing functionality
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from limiter_config import get_limiter
import tempfile
import os
import pandas as pd
from docx import Document
from openpyxl import load_workbook
from pptx import Presentation
import pdfplumber
import re
import io

# Create blueprint
file_bp = Blueprint('file', __name__)

# Get limiter instance
limiter = get_limiter(None)  # Will be configured in main app

def process_pdf_file(file_data, filename):
    """
    Process PDF file using pdfplumber and extract filtered API-focused text with highlights
    """
    # API-related keywords to search for (case-insensitive)
    api_keywords = [
        "authentication", "authorization", "token", "API key", "endpoint", 
        "base URL", "GET", "POST", "PUT", "DELETE", "parameters", "response", 
        "status code", "example", "error", "request", "header", "body"
    ]
    
    # Extended API-related patterns for filtering
    api_patterns = [
        r'\b(GET|POST|PUT|DELETE|PATCH)\b',  # HTTP methods
        r'curl',  # curl commands
        r'api|url|http|https',  # API/URL terms
        r'endpoint|parameter|request|response',  # API concepts
        r'status|code|error|success|fail',  # Status codes
        r'json|xml|format|type',  # Data formats
        r'header|body|content-type',  # Request/response parts
        r'example|usage|documentation',  # Documentation terms
        r'[{}()[\]<>]',  # Code brackets
        r'["\']\w+["\']\s*:',  # JSON-like structures
    ]
    
    try:
        print(f"🔍 PDF Debug: Starting PDF processing...")
        print(f"🔍 PDF Debug: File data size: {len(file_data)} bytes")
        print(f"🔍 PDF Debug: Filename: {filename}")
        
        # Get file extension
        file_extension = filename.lower().split('.')[-1] if '.' in filename else ''
        
        # Create a temporary file with appropriate extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as temp_file:
            temp_file.write(file_data)
            temp_file_path = temp_file.name
        
        print(f"✅ PDF Debug: Temporary file created: {temp_file_path}")
        
        # Try to extract text from the file
        filtered_text = ""
        highlighted_lines = []
        total_lines = 0
        kept_lines = 0
        
        try:
            with pdfplumber.open(temp_file_path) as pdf:
                print(f"🔍 PDF Debug: File opened successfully, pages: {len(pdf.pages)}")
                
                for page_num, page in enumerate(pdf.pages):
                    print(f"🔍 PDF Debug: Processing page {page_num + 1}")
                    page_text = page.extract_text()
                    if page_text:
                        # Split page text into lines and filter
                        lines = page_text.split('\n')
                        page_filtered_lines = []
                        
                        for line_num, line in enumerate(lines):
                            line = line.strip()
                            total_lines += 1
                            
                            # Skip empty lines
                            if not line:
                                continue
                            
                            # Skip very short lines (less than 10 characters)
                            if len(line) < 10:
                                continue
                            
                            # Check if line contains API-related content
                            line_lower = line.lower()
                            is_api_related = False
                            
                            # Check API keywords
                            for keyword in api_keywords:
                                if keyword.lower() in line_lower:
                                    is_api_related = True
                                    break
                            
                            # Check API patterns
                            if not is_api_related:
                                for pattern in api_patterns:
                                    if re.search(pattern, line, re.IGNORECASE):
                                        is_api_related = True
                                        break
                            
                            # If line is API-related, keep it
                            if is_api_related:
                                page_filtered_lines.append(line)
                                kept_lines += 1
                                print(f"  ✅ KEPT: '{line[:100]}...'")
                                
                                # Add to highlights if it contains API keywords
                                for keyword in api_keywords:
                                    if keyword.lower() in line_lower:
                                        highlighted_line = f"Page {page_num + 1}, Line {line_num + 1}: {line}"
                                        if highlighted_line not in highlighted_lines:
                                            highlighted_lines.append(highlighted_line)
                                        break
                            else:
                                print(f"  ❌ FILTERED: '{line[:100]}...'")
                        
                        # Add filtered lines to extracted text
                        if page_filtered_lines:
                            page_filtered_text = '\n'.join(page_filtered_lines)
                            filtered_text += page_filtered_text + "\n"
                            print(f"✅ PDF Debug: Page {page_num + 1} filtered text extracted: {len(page_filtered_text)} characters")
                            print(f"🔍 PDF Debug: Page {page_num + 1} kept {len(page_filtered_lines)} lines out of {len(lines)} total lines")
                        else:
                            print(f"⚠️ PDF Debug: Page {page_num + 1} - no API-related content found")
                    else:
                        print(f"⚠️ PDF Debug: Page {page_num + 1} - no text found")
        except Exception as pdf_error:
            print(f"❌ PDF Debug: Failed to process as PDF: {pdf_error}")
            if file_extension != 'pdf':
                return {"error": f"This file type ({file_extension.upper()}) cannot be processed. Please upload a PDF file."}
            else:
                return {"error": f"PDF processing failed: {str(pdf_error)}. Please try with a different file."}
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        print(f"✅ PDF Debug: Temporary file cleaned up")
        
        if filtered_text.strip():
            print(f"✅ PDF Debug: Text filtering successful")
            print(f"🔍 PDF Debug: Total lines processed: {total_lines}")
            print(f"🔍 PDF Debug: Lines kept: {kept_lines}")
            print(f"🔍 PDF Debug: Filtering ratio: {kept_lines}/{total_lines} = {kept_lines/total_lines*100:.1f}%")
            print(f"🔍 PDF Debug: Filtered text length: {len(filtered_text)} characters")
            print(f"🔍 PDF Debug: First 200 characters: {filtered_text[:200]}...")
            print(f"🔍 PDF Debug: Found {len(highlighted_lines)} highlighted lines with API keywords")
            print(f"📊 PDF Debug: Final result - Filtered API-focused text with highlights")
            
            return {
                "text": filtered_text.strip(), 
                "success": True,
                "highlights": highlighted_lines
            }
        else:
            print(f"❌ PDF Debug: No API-related text found after filtering")
            return {"error": "No API-related content could be extracted from the file. Please try with a different file."}
            
    except Exception as e:
        print(f"❌ PDF Debug: Exception occurred: {str(e)}")
        # Clean up temporary file if it exists
        try:
            if 'temp_file_path' in locals():
                os.unlink(temp_file_path)
        except:
            pass
        return {"error": f"File processing error: {str(e)}. Please try again later."}

def process_docx_file(file_data, filename):
    """Process Word documents (.docx) and extract text"""
    try:
        print(f"🔍 DOCX Debug: Processing Word document: {filename}")
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
            temp_file.write(file_data)
            temp_file_path = temp_file.name
        
        # Read the document
        doc = Document(temp_file_path)
        
        # Extract text from all paragraphs
        text_content = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_content.append(paragraph.text.strip())
        
        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    if cell.text.strip():
                        row_text.append(cell.text.strip())
                if row_text:
                    text_content.append(' | '.join(row_text))
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        full_text = '\n'.join(text_content)
        print(f"✅ DOCX Debug: Extracted {len(full_text)} characters from Word document")
        
        return {
            "text": full_text,
            "success": True
        }
        
    except Exception as e:
        print(f"❌ DOCX Debug: Error processing Word document: {str(e)}")
        return {"error": f"Failed to process Word document: {str(e)}"}

def process_excel_file(file_data, filename):
    """Process Excel files (.xlsx, .xls) and extract text"""
    try:
        print(f"🔍 Excel Debug: Processing Excel file: {filename}")
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
            temp_file.write(file_data)
            temp_file_path = temp_file.name
        
        # Read the Excel file
        workbook = load_workbook(temp_file_path, data_only=True)
        
        text_content = []
        
        # Process each sheet
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            text_content.append(f"\n--- Sheet: {sheet_name} ---\n")
            
            # Get all values from the sheet
            for row in sheet.iter_rows(values_only=True):
                row_data = []
                for cell_value in row:
                    if cell_value is not None:
                        row_data.append(str(cell_value))
                if row_data:
                    text_content.append(' | '.join(row_data))
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        full_text = '\n'.join(text_content)
        print(f"✅ Excel Debug: Extracted {len(full_text)} characters from Excel file")
        
        return {
            "text": full_text,
            "success": True
        }
        
    except Exception as e:
        print(f"❌ Excel Debug: Error processing Excel file: {str(e)}")
        return {"error": f"Failed to process Excel file: {str(e)}"}

def process_pptx_file(file_data, filename):
    """Process PowerPoint files (.pptx) and extract text"""
    try:
        print(f"🔍 PPTX Debug: Processing PowerPoint file: {filename}")
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pptx') as temp_file:
            temp_file.write(file_data)
            temp_file_path = temp_file.name
        
        # Read the presentation
        presentation = Presentation(temp_file_path)
        
        text_content = []
        
        # Process each slide
        for slide_num, slide in enumerate(presentation.slides, 1):
            text_content.append(f"\n--- Slide {slide_num} ---\n")
            
            # Extract text from shapes
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    text_content.append(shape.text.strip())
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        full_text = '\n'.join(text_content)
        print(f"✅ PPTX Debug: Extracted {len(full_text)} characters from PowerPoint file")
        
        return {
            "text": full_text,
            "success": True
        }
        
    except Exception as e:
        print(f"❌ PPTX Debug: Error processing PowerPoint file: {str(e)}")
        return {"error": f"Failed to process PowerPoint file: {str(e)}"}

def process_csv_file(file_data, filename):
    """Process CSV files and extract text"""
    try:
        print(f"🔍 CSV Debug: Processing CSV file: {filename}")
        
        # Decode the file data
        text_content = file_data.decode('utf-8')
        
        # Try to parse as CSV and convert to readable format
        try:
            df = pd.read_csv(io.StringIO(text_content))
            # Convert DataFrame to string representation
            csv_text = df.to_string(index=False)
            print(f"✅ CSV Debug: Extracted {len(csv_text)} characters from CSV file")
            return {
                "text": csv_text,
                "success": True
            }
        except Exception as csv_error:
            # If pandas fails, return the raw text
            print(f"⚠️ CSV Debug: Pandas parsing failed, using raw text: {csv_error}")
            return {
                "text": text_content,
                "success": True
            }
        
    except Exception as e:
        print(f"❌ CSV Debug: Error processing CSV file: {str(e)}")
        return {"error": f"Failed to process CSV file: {str(e)}"}

def process_text_file(file_data, filename):
    """Process text files (.txt, .md, .json, .xml, .rtf) and extract text"""
    try:
        print(f"🔍 Text Debug: Processing text file: {filename}")
        
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                text_content = file_data.decode(encoding)
                print(f"✅ Text Debug: Successfully decoded with {encoding} encoding")
                print(f"✅ Text Debug: Extracted {len(text_content)} characters from text file")
                return {
                    "text": text_content,
                    "success": True
                }
            except UnicodeDecodeError:
                continue
        
        # If all encodings fail, try with error handling
        text_content = file_data.decode('utf-8', errors='ignore')
        print(f"⚠️ Text Debug: Used fallback decoding with error handling")
        print(f"✅ Text Debug: Extracted {len(text_content)} characters from text file")
        return {
            "text": text_content,
            "success": True
        }
        
    except Exception as e:
        print(f"❌ Text Debug: Error processing text file: {str(e)}")
        return {"error": f"Failed to process text file: {str(e)}"}

@file_bp.route('/file-to-text', methods=['POST', 'OPTIONS'])
def file_to_text_endpoint():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 204
    
    # For POST requests, call the rate-limited function
    return file_to_text_post()

@limiter.limit("10 per minute")
def file_to_text_post():
    """
    Process uploaded files and extract text (PDF, images, etc.)
    """
    try:
        print(f"🔍 File-to-Text Debug: Received file-to-text request")
        print(f"🔍 File-to-Text Debug: Request method: {request.method}")
        print(f"🔍 File-to-Text Debug: Request headers: {dict(request.headers)}")
        print(f"🔍 File-to-Text Debug: Request files: {list(request.files.keys())}")
        
        # Check if file was uploaded
        if 'file' not in request.files:
            print(f"❌ File-to-Text Debug: No file in request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        print(f"🔍 File-to-Text Debug: File received: {file.filename}")
        print(f"🔍 File-to-Text Debug: File content type: {file.content_type}")
        
        # Check if file is empty
        if file.filename == '':
            print(f"❌ File-to-Text Debug: Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file data
        file_data = file.read()
        print(f"🔍 File-to-Text Debug: File data read: {len(file_data)} bytes")
        
        # Determine file type and process accordingly
        file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
        print(f"🔍 File-to-Text Debug: File extension: {file_extension}")
        
        if file_extension == 'pdf':
            # Process PDF with pdfplumber
            print(f"🔍 File-to-Text Debug: Processing as PDF with pdfplumber")
            result = process_pdf_file(file_data, file.filename)
        elif file_extension in ['docx', 'doc']:
            # Process Word documents
            print(f"🔍 File-to-Text Debug: Processing as Word document")
            result = process_docx_file(file_data, file.filename)
        elif file_extension in ['xlsx', 'xls']:
            # Process Excel files
            print(f"🔍 File-to-Text Debug: Processing as Excel file")
            result = process_excel_file(file_data, file.filename)
        elif file_extension in ['pptx', 'ppt']:
            # Process PowerPoint files
            print(f"🔍 File-to-Text Debug: Processing as PowerPoint file")
            result = process_pptx_file(file_data, file.filename)
        elif file_extension == 'csv':
            # Process CSV files
            print(f"🔍 File-to-Text Debug: Processing as CSV file")
            result = process_csv_file(file_data, file.filename)
        elif file_extension in ['txt', 'md', 'json', 'xml', 'rtf']:
            # Process text files
            print(f"🔍 File-to-Text Debug: Processing as text file")
            result = process_text_file(file_data, file.filename)
        else:
            print(f"❌ File-to-Text Debug: Unsupported file type: {file_extension}")
            return jsonify({'error': f'Unsupported file type: {file_extension}. Supported formats: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV, and text files (.txt, .md, .json, .xml, .rtf).'}), 400
        
        print(f"🔍 File-to-Text Debug: Processing result: {result}")
        
        if result.get('success'):
            print(f"✅ File-to-Text Debug: Processing successful, returning text and highlights")
            response_data = {
                'success': True,
                'text': result['text'],
                'message': f'Text extracted successfully from {file_extension.upper()} file'
            }
            
            # Add highlights if available
            if 'highlights' in result:
                response_data['highlights'] = result['highlights']
                print(f"🔍 File-to-Text Debug: Found {len(result['highlights'])} highlighted lines")
            
            return jsonify(response_data)
        else:
            print(f"❌ File-to-Text Debug: Processing failed: {result.get('error')}")
            return jsonify({
                'success': False,
                'error': result.get('error', 'Unknown error occurred')
            }), 400
            
    except Exception as e:
        print(f"❌ File-to-Text Debug: Exception in endpoint: {str(e)}")
        print(f"🔍 File-to-Text Debug: Exception type: {type(e).__name__}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500