
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Bot, FileText, Code, Upload, Copy, CheckCheck, Zap, AlertTriangle, Terminal, Star } from 'lucide-react';
import { UsageDisplay, UpgradeModal } from '@/components/UsageTracker';
import { FeedbackPopup } from '@/components/FeedbackPopup';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PublicApiSelector from '../components/PublicApiSelector';
import { useAskApi, processImageOCR, processFileToText } from '@/api/askApi';
import { proxyApiCall } from '@/api/proxyApi';
import { fixApiUrl, validateApiUrl } from '@/utils/testApiUrl';

// Constants
const INITIAL_CODE_STATE = {
    javascript: '',
    python: '',
    curl: '',
    csharp: '',
    java: '',
    go: ''
};

const createClaudeApiPrompt = (text) => `Use this fixed JSON schema and output ONLY a JSON object (no prose, no markdown):

{
  "has_api": boolean,
  "base_urls": [ "string" ],
  "endpoints": [
    { "method": "GET|POST|PUT|DELETE|null", "path": "string", "summary": "string|null" }
  ],
  "api_type": "REST|GraphQL|SOAP|Unknown",
  "parameters": [
    { "name": "string", "in": "path|query|header|body", "type": "string|number|boolean|object|array|Unknown", "required": true|false, "applies_to": "string" }
  ],
  "auth": { "type": "Bearer|API Key|OAuth2|Basic|Unknown", "headers": ["string"] },
  "responses": { "format": "JSON|XML|Other|Unknown", "status_codes": [ { "code": 200, "meaning": "OK" } ] },
  "notes": [ "string" ]
}

Rules:
- Only API facts (endpoints, methods, params, auth, response format, status codes).
- If the text doesn't specify an item, set it to null/[].
- Do not invent, infer conservatively.
- Output must be valid JSON. No explanations.

TEXT:
<<<
${text}
>>>`;

const SUPPORTED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'json', 'xml', 'csv', 'md', 'rtf', 'odt', 'ods', 'odp', 'ppt', 'pptx'];

// Utility functions
const createCopyToClipboard = (setText, timeout = 2000) => {
    return async (content) => {
        if (!content) return;
        try {
            await navigator.clipboard.writeText(content);
            setText(true);
            setTimeout(() => setText(false), timeout);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };
};

const hasAnyGeneratedCode = (codeObj) => {
    return Object.values(codeObj).some(code => Boolean(code));
};

const validateApiKey = (key) => {
    return key && key.trim() !== '' && key !== 'YOUR_API_KEY';
};

const isFileSupported = (filename) => {
    const extension = filename.toLowerCase().split('.').pop();
    return SUPPORTED_FILE_EXTENSIONS.includes(extension);
};

const handleError = (context, error, showAlert = false) => {
    console.error(`❌ ${context}:`, error);
    if (showAlert) {
        alert(`${context}: ${error.message || error}`);
    }
};

const SAMPLE_API_DOC = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Simple Hotel API",
    "version": "1.0.0"
  },
  "paths": {
    "/hotels/search": {
      "get": {
        "summary": "Search for hotels",
        "parameters": [
          {
            "name": "city",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          },
          {
            "name": "checkInDate",
            "in": "query",
            "schema": { "type": "string", "format": "date" }
          }
        ]
      }
    }
  }
}`;

const faqData = [
    {
        question: "How does TalkAPI work?",
        answer: "TalkAPI is an AI-powered tool that understands your API documentation in any format — text, link, or even an image. You can simply paste a URL, upload a screenshot, or type your docs, then ask natural questions like \"Get all users from my CRM\" or \"Create a booking for next week.\" TalkAPI uses Anthropic Claude to read, understand, and run your API requests instantly."
    },
    {
        question: "What type of documentation does TalkAPI support?",
        answer: "TalkAPI supports multiple formats including: Direct URLs to your API documentation, Plain text or code blocks, and Uploaded screenshots (OCR). There's no need for Swagger or Postman — any readable API doc will work."
    },
    {
        question: "Is my API documentation and data secure?",
        answer: "Yes. TalkAPI processes your data in memory and never stores it unless you enable history on a Pro or Enterprise plan. All communication is encrypted in transit and at rest using industry standards. Your API keys are session-based and are never shared or logged."
    }
];

function HeroSection() {
    const scrollToTool = () => {
        document.getElementById('api-tool')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    return (
        <div className="text-center py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent leading-tight">
                Transform Natural Language into API Calls
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-200 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
                Paste your API docs, ask a question, get the code, and run it – all in one place. Stop reading specs, start making calls.
            </p>
            <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-white text-blue-700 font-bold hover:bg-blue-100" onClick={scrollToTool}>
                Try it now
            </Button>
        </div>
    );
}

function ApiToolSection() {
    const [apiDoc, setApiDoc] = useState('');
    const [userQuery, setUserQuery] = useState('');
    const [generatedCode, setGeneratedCode] = useState(INITIAL_CODE_STATE);
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [isLoading, setIsLoading] = useState(false);
    const [isFileProcessing, setIsFileProcessing] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [ocrText, setOcrText] = useState('');
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [copied, setCopied] = useState(false);
    const { usage, trackApiCall, showUpgradeModal, setShowUpgradeModal, showFeedbackPopup, setShowFeedbackPopup, handleFeedbackSubmitted, user } = useUsageTracking();
    const [isExecuting, setIsExecuting] = useState(false);
    const [apiResult, setApiResult] = useState(null);
    const [apiError, setApiError] = useState('');
    const [showProOnlyMessage, setShowProOnlyMessage] = useState(false);
    const [showPublicApiSelector, setShowPublicApiSelector] = useState(false);
    const [currentHistoryId, setCurrentHistoryId] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [copiedApiDoc, setCopiedApiDoc] = useState(false);
    const [copiedUserQuery, setCopiedUserQuery] = useState(false);
    const [authorizationKey, setAuthorizationKey] = useState('');
    const [selectedApiInfo, setSelectedApiInfo] = useState(null);
    
    // Authentication type and credentials
    const [authType, setAuthType] = useState('api_key'); // 'api_key' or 'basic'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Use the new API hook
    const { 
        askQuestion, 
        loading: apiLoading,
        error: hookError
    } = useAskApi();

    // Update generated code when authType changes
    useEffect(() => {
        if (!generatedCode.javascript) return; // Only run if we have generated code

        const updateAuthInCode = (code, language) => {
            if (!code) return code;

            if (authType === 'basic') {
                // Replace API key auth with Basic auth (simplified format)
                if (language === 'javascript') {
                    code = code.replace(
                        /'X-API-Key':\s*'[^']*'/g,
                        "'Authorization': 'Basic YOUR_USERNAME:YOUR_PASSWORD'"
                    );
                    code = code.replace(
                        /'x-api-key':\s*'[^']*'/gi,
                        "'Authorization': 'Basic YOUR_USERNAME:YOUR_PASSWORD'"
                    );
                } else if (language === 'python') {
                    code = code.replace(
                        /'X-API-Key':\s*'[^']*'/g,
                        "'Authorization': 'Basic YOUR_USERNAME:YOUR_PASSWORD'"
                    );
                } else if (language === 'curl') {
                    code = code.replace(
                        /-H\s+'X-API-Key:\s*[^']*'/g,
                        ''
                    );
                    if (!code.includes('-u ')) {
                        code = code.replace('curl -X', 'curl -u YOUR_USERNAME:YOUR_PASSWORD -X');
                    }
                }
            } else {
                // Replace Basic auth with API key auth
                if (language === 'javascript') {
                    // Match both old btoa() format and new simplified format
                    code = code.replace(
                        /'Authorization':\s*'Basic\s*'\s*\+\s*btoa\([^)]+\)/g,
                        "'X-API-Key': 'YOUR_API_KEY'"
                    );
                    code = code.replace(
                        /'Authorization':\s*'Basic\s+YOUR_USERNAME:YOUR_PASSWORD'/g,
                        "'X-API-Key': 'YOUR_API_KEY'"
                    );
                } else if (language === 'python') {
                    // Match both old base64 format and new simplified format
                    code = code.replace(
                        /'Authorization':\s*'Basic\s*'\s*\+\s*base64\.b64encode\([^)]+\)\.decode\(\)/g,
                        "'X-API-Key': 'YOUR_API_KEY'"
                    );
                    code = code.replace(
                        /'Authorization':\s*'Basic\s+YOUR_USERNAME:YOUR_PASSWORD'/g,
                        "'X-API-Key': 'YOUR_API_KEY'"
                    );
                    if (code.includes('import base64') && !code.includes('base64.')) {
                        code = code.replace(/\nimport base64/, '');
                    }
                } else if (language === 'curl') {
                    code = code.replace(
                        /-u\s+[^\s]+\s*/g,
                        ''
                    );
                    if (!code.includes("-H 'X-API-Key:")) {
                        code = code.replace(
                            /curl\s+(-X\s+\w+)/,
                            "curl -H 'X-API-Key: YOUR_API_KEY' $1"
                        );
                    }
                }
            }

            return code;
        };

        setGeneratedCode(prev => ({
            javascript: updateAuthInCode(prev.javascript, 'javascript'),
            python: updateAuthInCode(prev.python, 'python'),
            curl: updateAuthInCode(prev.curl, 'curl')
        }));
    }, [authType]); // Only run when authType changes

    // Copy utilities
    const copyToClipboard = createCopyToClipboard(setCopied);
    const copyApiDocToClipboard = createCopyToClipboard(setCopiedApiDoc);
    const copyUserQueryToClipboard = createCopyToClipboard(setCopiedUserQuery);

    // Helper function to format API facts response
    const formatApiFactsResponse = (apiData) => {
        if (!apiData || typeof apiData !== 'object') {
            return 'Invalid API data received';
        }

        let formatted = '';

        // API Overview
        formatted += `# API Documentation Analysis\n\n`;
        formatted += `**API Detected:** ${apiData.has_api ? '✅ Yes' : '❌ No'}\n`;
        formatted += `**API Type:** ${apiData.api_type || 'Unknown'}\n\n`;

        // Base URLs
        if (apiData.base_urls && apiData.base_urls.length > 0) {
            formatted += `## Base URLs\n`;
            apiData.base_urls.forEach(url => {
                formatted += `- ${url}\n`;
            });
            formatted += '\n';
        }

        // Endpoints
        if (apiData.endpoints && apiData.endpoints.length > 0) {
            formatted += `## Endpoints\n`;
            apiData.endpoints.forEach(endpoint => {
                formatted += `### ${endpoint.method || 'UNKNOWN'} ${endpoint.path || 'Unknown Path'}\n`;
                if (endpoint.summary) {
                    formatted += `${endpoint.summary}\n`;
                }
                formatted += '\n';
            });
        }

        // Parameters
        if (apiData.parameters && apiData.parameters.length > 0) {
            formatted += `## Parameters\n`;
            apiData.parameters.forEach(param => {
                formatted += `- **${param.name}** (${param.type || 'Unknown'}) - ${param.in || 'Unknown location'}\n`;
                formatted += `  - Required: ${param.required ? 'Yes' : 'No'}\n`;
                if (param.applies_to) {
                    formatted += `  - Applies to: ${param.applies_to}\n`;
                }
                formatted += '\n';
            });
        }

        // Authentication
        if (apiData.auth) {
            formatted += `## Authentication\n`;
            formatted += `**Type:** ${apiData.auth.type || 'Unknown'}\n`;
            if (apiData.auth.headers && apiData.auth.headers.length > 0) {
                formatted += `**Headers:**\n`;
                apiData.auth.headers.forEach(header => {
                    formatted += `- ${header}\n`;
                });
            }
            formatted += '\n';
        }

        // Responses
        if (apiData.responses) {
            formatted += `## Response Format\n`;
            formatted += `**Format:** ${apiData.responses.format || 'Unknown'}\n`;
            if (apiData.responses.status_codes && apiData.responses.status_codes.length > 0) {
                formatted += `**Status Codes:**\n`;
                apiData.responses.status_codes.forEach(status => {
                    formatted += `- ${status.code}: ${status.meaning || 'Unknown'}\n`;
                });
            }
            formatted += '\n';
        }

        // Notes
        if (apiData.notes && apiData.notes.length > 0) {
            formatted += `## Notes\n`;
            apiData.notes.forEach(note => {
                formatted += `- ${note}\n`;
            });
        }

        return formatted;
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log('🔍 File Upload Debug: File selected:', file);
            console.log('🔍 File Upload Debug: File details:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });
            
            // Check if it's a supported file type
            const isSupported = isFileSupported(file.name);
            const fileExtension = file.name.toLowerCase().split('.').pop();
            console.log('🔍 File Upload Debug: File extension:', fileExtension);
            console.log('🔍 File Upload Debug: Is supported file:', isSupported);
            
            if (!isSupported) {
                console.warn('⚠️ File Upload Debug: Unsupported file type selected');
                alert(`Please select a supported file type: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV, text files (.txt, .md, .json, .xml, .rtf), or images (PNG, JPG, GIF, BMP, WEBP)`);
                return;
            }
            

            
            console.log('✅ File Upload Debug: Starting file processing for uploaded file');
            setUploadedFile(file);
            setIsFileProcessing(true);
            setOcrText('');

            try {
                console.log('🔍 File Upload Debug: Calling processFileToText...');
                const result = await processFileToText(file);
                console.log('🔍 File Upload Debug: File processing result received:', result);
                
                if (result.success) {
                    console.log('✅ File Upload Debug: File processing successful');
                    console.log('🔍 File Upload Debug: Text length:', result.text.length);
                    setOcrText(result.text);
                    
                            // Compose the custom prompt for Claude - API Facts Extractor
                    const claudePrompt = createClaudeApiPrompt(result.text);

                    // Send to Claude (anonymous users can use if they have quota)

                    // Send to Claude and set the output
                    try {
                        const claudeResponse = await askQuestion(claudePrompt, user?.id || '', result.text, selectedApiInfo);
                        
                        // Format the response for display
                        let formattedResponse = '';
                        
                        if (claudeResponse && claudeResponse.answer) {
                            try {
                                // Try to parse as JSON and format it nicely
                                const jsonData = JSON.parse(claudeResponse.answer);
                                formattedResponse = formatApiFactsResponse(jsonData);
                            } catch (parseError) {
                                // If not valid JSON, use the raw response
                                formattedResponse = claudeResponse.answer;
                            }
                        } else {
                            // Fallback to raw text if no Claude response
                            formattedResponse = result.text;
                        }
                        
                        setApiDoc(formattedResponse);
                    } catch (claudeError) {
                        console.error('❌ Error sending to Claude:', claudeError);
                        if (claudeError.message.includes('Anonymous usage limit reached')) {
                            alert('Anonymous usage limit reached. Please log in to continue using Claude AI.');
                            setApiDoc(result.text); // Fallback to raw text
                        } else {
                            alert('Failed to summarize API documentation with Claude.');
                        }
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    console.error('❌ File Upload Debug: File processing failed:', result.error);
                    alert(`File processing failed: ${result.error}`);
                }
            } catch (error) {
                console.error('❌ File Upload Debug: File processing error:', error);
                alert(`File processing failed: ${error.message}`);
            } finally {
                console.log('🔍 File Upload Debug: File processing completed');
                setIsFileProcessing(false);
            }
        } else {
            console.log('🔍 File Upload Debug: No file selected');
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log('🔍 Image Upload Debug: File selected:', file);
            console.log('🔍 Image Upload Debug: File details:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });
            
            // Check if it's an image file
            const isImage = file.type.startsWith('image/');
            console.log('🔍 Image Upload Debug: Is image file:', isImage);
            
            if (!isImage) {
                console.warn('⚠️ Image Upload Debug: Non-image file selected');
                alert('Please select an image file (PNG, JPG, JPEG, GIF, BMP, WEBP)');
                return;
            }



            console.log('✅ Image Upload Debug: Valid image file, starting OCR');
            setUploadedImage(file);
            setIsOcrProcessing(true);
            setOcrText('');

            try {
                console.log('🔍 Image Upload Debug: Calling processImageOCR...');
                const result = await processImageOCR(file);
                console.log('🔍 Image Upload Debug: OCR result received:', result);
                
                if (result.success) {
                    console.log('✅ Image Upload Debug: OCR successful');
                    console.log('🔍 Image Upload Debug: Text length:', result.text.length);
                    setOcrText(result.text);
                    
                    // Send the extracted text to Claude with the same prompt as file upload
                    console.log('🔍 Image Upload Debug: Sending extracted text to Claude for analysis');
                    
                    const claudePrompt = createClaudeApiPrompt(result.text);

                    // Send to Claude (anonymous users can use if they have quota)

                    try {
                        const claudeResponse = await askQuestion(claudePrompt, user?.id || '', result.text, selectedApiInfo);
                        console.log('✅ Image Upload Debug: Claude analysis completed');
                        
                        // Format the response for display
                        let formattedResponse = '';
                        
                        if (claudeResponse && claudeResponse.answer) {
                            try {
                                // Try to parse as JSON and format it nicely
                                const jsonData = JSON.parse(claudeResponse.answer);
                                formattedResponse = formatApiFactsResponse(jsonData);
                            } catch (parseError) {
                                // If not valid JSON, use the raw response
                                formattedResponse = claudeResponse.answer;
                            }
                        } else {
                            // Fallback to raw text if no Claude response
                            formattedResponse = result.text;
                        }
                        
                        setApiDoc(formattedResponse);
                        
                        // Show a success message
                        alert('✅ Image processed successfully! The API documentation has been analyzed by Claude and is ready for use.');
                    } catch (claudeError) {
                        console.error('❌ Image Upload Debug: Claude processing failed:', claudeError);
                        if (claudeError.message.includes('Anonymous usage limit reached')) {
                            alert('Anonymous usage limit reached. Please log in to continue using Claude AI.');
                            setApiDoc(result.text); // Fallback to raw text
                        } else {
                            // Fallback: just set the raw text if Claude fails
                        setApiDoc(result.text);
                            alert('✅ Image processed successfully! Raw text extracted (Claude analysis failed).');
                        }
                    }
                    
                } else {
                    console.error('❌ Image Upload Debug: OCR failed:', result.error);
                    alert(`OCR failed: ${result.error}`);
                }
            } catch (error) {
                console.error('❌ Image Upload Debug: OCR processing error:', error);
                alert(`OCR processing failed: ${error.message}`);
            } finally {
                console.log('🔍 Image Upload Debug: OCR processing completed');
                setIsOcrProcessing(false);
            }
        } else {
            console.log('🔍 Image Upload Debug: No file selected');
        }
    };

    const handleCopyCode = () => copyToClipboard(generatedCode[selectedLanguage]);
    const handleCopyApiDoc = () => copyApiDocToClipboard(apiDoc);
    const handleCopyUserQuery = () => copyUserQueryToClipboard(userQuery);

    const handleClearAll = () => {
        setApiDoc('');
        setUserQuery('');
        setGeneratedCode(INITIAL_CODE_STATE);
        setApiResult(null);
        setApiError('');
        setUploadedFile(null);
        setUploadedImage(null);
        setOcrText('');
        setCopied(false);
        setCopiedApiDoc(false);
        setCopiedUserQuery(false);
        setCurrentHistoryId(null);
        setIsFavorited(false);
        setSelectedLanguage('javascript');
        setIsFileProcessing(false);
    };

    const [resultCopied, setResultCopied] = useState(false);

    const handleCopyResult = async () => {
        if (apiResult) {
            const resultText = `Status: ${apiResult.status} ${apiResult.statusText}\nURL: ${apiResult.url}\nContent-Type: ${apiResult.headers['content-type'] || 'N/A'}\n\nResponse Data:\n${typeof apiResult.data === 'object' ? JSON.stringify(apiResult.data, null, 2) : apiResult.data}`;
            try {
                await navigator.clipboard.writeText(resultText);
                setResultCopied(true);
                setTimeout(() => setResultCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy result: ', err);
            }
        } else if (apiError) {
            try {
                await navigator.clipboard.writeText(apiError);
                setResultCopied(true);
                setTimeout(() => setResultCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy error: ', err);
            }
        }
    };

    // Utility function to validate and fix JSON strings
    const validateAndFixJson = (jsonString) => {
        try {
            // First try to parse as-is
            JSON.parse(jsonString);
            return jsonString; // Already valid
        } catch (e) {
            // Try to fix common issues
            let fixed = jsonString
                .replace(/'/g, '"') // Replace single quotes with double quotes
                .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":'); // Quote property names
            
            try {
                JSON.parse(fixed);
                return fixed;
            } catch (parseError) {
                throw new Error(`Invalid JSON: ${parseError.message}`);
            }
        }
    };

    // Utility function to create a fallback Anthropic API call body
    const getFallbackAnthropicBody = (userQuery) => JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1000,
        messages: [
            {
                role: 'user',
                content: userQuery || 'Hello, how are you?'
            }
        ]
    });

    // Utility function to fix placeholder URLs for Anthropic API
    const fixAnthropicPlaceholderUrl = (url) => {
        if (!url) return url;
        let fixed = url;
        // Don't replace - the backend should provide the correct URL
        // This function is kept for backward compatibility but doesn't modify URLs anymore
        return fixed;
    };

    // Parse Python requests code
    const parsePythonCode = (code) => {
        try {
            let url = null;
            let method = 'GET';
            let headers = {};
            let body = null;

            // Extract URL from requests.get/post/etc
            const urlMatch = code.match(/requests\.\w+\s*\(\s*(['"`])(.*?)\1/s);
            if (urlMatch && urlMatch[2]) {
                url = fixAnthropicPlaceholderUrl(urlMatch[2]);
            }

            // Extract method
            const methodMatch = code.match(/requests\.(\w+)\s*\(/);
            if (methodMatch) {
                method = methodMatch[1].toUpperCase();
            }

            // Extract headers
            const headersMatch = code.match(/headers\s*=\s*\{([^}]*)\}/s);
            if (headersMatch) {
                const headerContent = headersMatch[1];
                const headerPairs = headerContent.matchAll(/['"`]([^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/g);
                for (const match of headerPairs) {
                    headers[match[1]] = match[2];
                }
            }

            // Extract JSON body
            const jsonMatch = code.match(/json\s*=\s*(\{[\s\S]*?\})/);
            if (jsonMatch) {
                try {
                    const fixedJson = validateAndFixJson(jsonMatch[1]);
                    body = fixedJson;
                } catch (e) {
                    console.warn('Failed to parse Python JSON body');
                }
            }

            return { url, method, headers, body, originalCode: code };
        } catch (e) {
            console.error('Error parsing Python code:', e);
            return null;
        }
    };

    // Parse cURL command
    const parseCurlCode = (code) => {
        try {
            let url = null;
            let method = 'GET';
            let headers = {};
            let body = null;

            // Extract URL - look for the URL after curl
            const urlMatch = code.match(/curl\s+(?:-[^\s]+\s+)*(?:['"`]([^'"`]+)['"`]|(\S+))/);
            if (urlMatch) {
                url = fixAnthropicPlaceholderUrl(urlMatch[1] || urlMatch[2]);
            }

            // Extract method
            const methodMatch = code.match(/-X\s+(['"`]?)(\w+)\1/);
            if (methodMatch) {
                method = methodMatch[2].toUpperCase();
            }

            // Extract headers
            const headerMatches = code.matchAll(/-H\s+['"`]([^:]+):\s*([^'"`]+)['"`]/g);
            for (const match of headerMatches) {
                headers[match[1]] = match[2];
            }

            // Extract data/body
            const dataMatch = code.match(/-d\s+['"`]([^'"`]+)['"`]/);
            if (dataMatch) {
                try {
                    const jsonData = JSON.parse(dataMatch[1]);
                    body = JSON.stringify(jsonData);
                } catch (e) {
                    body = dataMatch[1];
                }
            }

            return { url, method, headers, body, originalCode: code };
        } catch (e) {
            console.error('Error parsing cURL code:', e);
            return null;
        }
    };

    const parseGeneratedCode = (code) => {
        try {
            console.log('🔍 Starting to parse generated code:', code);
            
            let url = null;
            let method = 'GET'; // Default to GET
            let headers = {};
            let body = null;

            // 1. Extract URL (Handles '...', "...", `...` including template literals)
            console.log('🔍 Extracting URL from code...');
            const urlMatch = code.match(/fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/s); // s flag for dotall
            if (urlMatch && urlMatch[1]) {
                url = fixAnthropicPlaceholderUrl(urlMatch[1]);
                console.log('✅ URL extracted:', url);
            } else {
                console.log('❌ No URL found with primary pattern, trying alternatives...');
                
                // Try alternative URL extraction patterns
                const altUrlPatterns = [
                    /fetch\s*\(\s*([^,)]+)/,  // fetch(url, ...)
                    /fetch\s*\(\s*`([^`]+)`/, // fetch(`url`)
                    /fetch\s*\(\s*'([^']+)'/, // fetch('url')
                    /fetch\s*\(\s*"([^"]+)"/  // fetch("url")
                ];
                
                for (const pattern of altUrlPatterns) {
                    const match = code.match(pattern);
                    if (match && match[1]) {
                        url = fixAnthropicPlaceholderUrl(match[1].trim());
                        console.log('✅ URL extracted with alternative pattern:', url);
                        break;
                    }
                }
            }
            
            if (!url) {
                console.log('❌ Still no URL found, this might be a parsing issue');
            }

            // 2. Extract fetch options (the object after the URL)
            console.log('🔍 Extracting fetch options from code');
            const optionsMatch = code.match(/fetch\s*\(\s*['"`].*?['"`]\s*,\s*(\{[\s\S]*?\})\s*\)/);
            let optionsStr = '';
            if (optionsMatch && optionsMatch[1]) {
                optionsStr = optionsMatch[1];
                console.log('✅ Fetch options extracted:', optionsStr);
            } else {
                console.log('❌ No fetch options found with primary pattern, trying alternatives...');
                
                // Try alternative options extraction patterns
                const altOptionsPatterns = [
                    /fetch\s*\([^,]+,\s*(\{[\s\S]*?\})\s*\)/,  // fetch(url, {options})
                    /fetch\s*\([^,]+,\s*(\{[\s\S]*?\})\)/,     // fetch(url, {options})
                    /fetch\s*\([^)]*,\s*(\{[\s\S]*?\})/       // fetch(url, {options
                ];
                
                for (const pattern of altOptionsPatterns) {
                    const match = code.match(pattern);
                    if (match && match[1]) {
                        optionsStr = match[1];
                        console.log('✅ Fetch options extracted with alternative pattern:', optionsStr);
                        break;
                    }
                }
            }

            // If no options object found, return with just the URL
            if (!optionsStr) {
                console.log('🔍 No options string found, returning with just URL');
                return { url, method, headers, body };
            }

            // 3. Extract method
            const methodMatch = optionsStr.match(/method\s*:\s*(['"`])(.*?)\1/);
            if (methodMatch && methodMatch[2]) {
                method = methodMatch[2].toUpperCase();
            }

            // 4. Extract headers - Enhanced to handle complex expressions
            const headersMatch = optionsStr.match(/headers\s*:\s*(\{[\s\S]*?\})/);
            if (headersMatch && headersMatch[1]) {
                console.log('🔍 Headers string found:', headersMatch[1]);

                // Enhanced regex to capture entire expressions including concatenation and function calls
                const headerPairs = headersMatch[1].matchAll(/(['"`])([^'"]+)\1\s*:\s*(.+?)(?=,\s*['"`]|\})/gs);

                for (const match of headerPairs) {
                    const key = match[2].trim();
                    let value = match[3].trim();

                    // Remove trailing comma if present
                    value = value.replace(/,\s*$/, '').trim();

                    console.log(`🔍 Processing header: ${key} = ${value}`);

                    // Handle different value formats:

                    // 1. Basic Auth with btoa() - keep as placeholder for runtime injection
                    if (value.includes('btoa(')) {
                        const btoaMatch = value.match(/btoa\s*\(\s*['"`]([^'"]+)['"`]\s*\)/);
                        if (btoaMatch) {
                            // Keep the expression as-is for runtime processing
                            headers[key] = value;
                            console.log(`🔍 btoa() expression found, keeping as-is`);
                        }
                    }
                    // 2. String concatenation - combine the parts
                    else if (value.includes('+')) {
                        // Extract quoted strings and combine
                        const parts = value.split('+').map(p => {
                            const trimmed = p.trim();
                            const quoted = trimmed.match(/['"`]([^'"]+)['"`]/);
                            return quoted ? quoted[1] : trimmed;
                        });
                        headers[key] = parts.join('');
                        console.log(`🔍 Concatenation detected, combined to: ${headers[key]}`);
                    }
                    // 3. Template literal with variables - keep for runtime processing
                    else if (value.includes('`') && value.includes('${')) {
                        headers[key] = value;
                        console.log(`🔍 Template literal with variables: ${value}`);
                    }
                    // 4. Simple quoted value
                    else if (value.match(/^['"`](.+?)['"`]$/)) {
                        headers[key] = value.replace(/^['"`]|['"`]$/g, '');
                        console.log(`🔍 Simple quoted value: ${headers[key]}`);
                    }
                    // 5. Keep as-is (variable or expression)
                    else {
                        headers[key] = value;
                        console.log(`🔍 Keeping value as-is: ${value}`);
                    }
                }
                console.log('🔍 Final extracted headers:', headers);
            } else {
                console.log('🔍 No headers found in options string');
            }
            
            // 5. Extract body - SIMPLIFIED VERSION
            console.log('🔍 Extracting body from code');

            // Method 1: Find JSON.stringify( and extract balanced braces
            const stringifyMatch = code.match(/body\s*:\s*JSON\.stringify\s*\(/);
            if (stringifyMatch) {
                const startIndex = stringifyMatch.index + stringifyMatch[0].length;
                let braceCount = 0;
                let inString = false;
                let stringChar = null;
                let bodyStart = -1;
                let bodyEnd = -1;

                for (let i = startIndex; i < code.length; i++) {
                    const char = code[i];
                    const prevChar = i > 0 ? code[i - 1] : '';

                    // Handle string boundaries
                    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
                        if (!inString) {
                            inString = true;
                            stringChar = char;
                        } else if (char === stringChar) {
                            inString = false;
                            stringChar = null;
                        }
                    }

                    if (!inString) {
                        if (char === '{') {
                            if (braceCount === 0) bodyStart = i;
                            braceCount++;
                        } else if (char === '}') {
                            braceCount--;
                            if (braceCount === 0 && bodyStart >= 0) {
                                bodyEnd = i + 1;
                                break;
                            }
                        }
                    }
                }

                if (bodyStart >= 0 && bodyEnd > bodyStart) {
                    body = code.substring(bodyStart, bodyEnd).trim();
                    console.log('✅ Body extracted using balanced brace parser');
                    console.log('📦 Body (first 200 chars):', body.substring(0, 200));
                }
            }

            // Method 2: Try variable reference
            if (!body) {
                const varMatch = code.match(/body\s*:\s*JSON\.stringify\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/);
                if (varMatch && varMatch[1]) {
                    const varName = varMatch[1];
                    console.log('🔍 Body is a variable:', varName);
                    const varPattern = new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*(\\{[\\s\\S]*?\\});`, 'i');
                    const varDefMatch = code.match(varPattern);
                    if (varDefMatch && varDefMatch[1]) {
                        body = varDefMatch[1].trim();
                        console.log('✅ Variable definition found');
                    }
                }
            }

            // Validate and fix the body JSON
            if (body) {
                console.log('🔍 Validating body JSON...');
                try {
                    // Try to parse as-is first
                    JSON.parse(body);
                    console.log('✅ Body is already valid JSON');
                } catch (e) {
                    console.log('⚠️ Body is not valid JSON, attempting to fix...');
                    try {
                        body = validateAndFixJson(body);
                        console.log('✅ Body fixed and validated');
                    } catch (fixError) {
                        console.error('❌ Failed to fix body JSON:', fixError);
                        console.error('Body content:', body);
                        body = null;
                    }
                }
            } else {
                console.log('🔍 No body extracted');
            }

            // Final validation and fallback
            if (!url) {
                console.log('❌ Failed to extract URL, creating fallback request');
                // Create a fallback request to the current API documentation
                url = 'https://api.anthropic.com/v1/messages';
                method = 'POST';
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': 'YOUR_API_KEY'
                };
                body = getFallbackAnthropicBody(userQuery);
                console.log('✅ Created fallback request with:', { url, method, headers, body });
            }
            
            console.log('✅ Final parsed result:', { url, method, headers, body });
            return { url, method, headers, body, originalCode: code };
        } catch (e) {
            console.error('Error parsing generated code:', e);
            console.log('🔧 Creating emergency fallback due to parsing error');
            
            // Emergency fallback - create a basic request
            return {
                url: 'https://api.anthropic.com/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'YOUR_API_KEY'
                },
                body: getFallbackAnthropicBody(userQuery),
                originalCode: code
            };
        }
    };

    const executeApiCall = async (parsedCode) => {
        console.group('🚀 API Request Debug');
        console.log('📝 Starting API Request Execution...');
        
        const { url, method, headers, body, originalCode } = parsedCode;
        
        console.group('📋 Request Details');
        console.log('🔗 URL:', url);
        console.log('📮 Method:', method);
        console.log('📑 Headers:', { ...headers, Authorization: headers.Authorization ? '***' : undefined });
        console.log('📦 Body:', typeof body === 'string' ? JSON.parse(body) : body);
        console.log('💻 Original Code:', originalCode);
        console.groupEnd();
        
        // Track timing
        const startTime = performance.now();

        if (!url) {
            throw new Error('Could not extract URL from generated code.');
        }
        
        // Process URL to evaluate template literals with actual variable values
        let processedUrl = url;
        console.log('🔍 Initial URL:', processedUrl);
        
        // Extract variable declarations from the code
        const extractVariableValue = (code, varName) => {
            console.log(`🔍 Extracting variable "${varName}" from code`);
            // Look for variable declarations like: const varName = "value"; or let varName = "value";
            const patterns = [
                new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`, 'i'),
                new RegExp(`${varName}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`, 'i')
            ];
            
            for (const pattern of patterns) {
                console.log(`🔍 Trying pattern: ${pattern}`);
                const match = code.match(pattern);
                if (match && match[1]) {
                    console.log(`✅ Found value for "${varName}": "${match[1]}"`);
                    return match[1];
                }
            }
            console.log(`❌ No value found for variable "${varName}"`);
            return null;
        };
        
        // Process template literals in the URL
        if (processedUrl.includes('${')) {
            console.log('🔍 Processing template literals in URL');
            // Replace template literals with actual values from the code
            processedUrl = processedUrl.replace(/\$\{([^}]+)\}/g, (match, expression) => {
                console.log(`🔍 Processing template literal: ${match} (expression: ${expression})`);
                
                // Handle encodeURIComponent() calls
                const encodeMatch = expression.match(/encodeURIComponent\(([^)]+)\)/);
                if (encodeMatch) {
                    const varName = encodeMatch[1].trim();
                    console.log(`🔍 Found encodeURIComponent call for variable: ${varName}`);
                    const value = extractVariableValue(originalCode || '', varName);
                    const result = value ? encodeURIComponent(value) : match;
                    console.log(`🔍 encodeURIComponent result: ${result}`);
                    return result;
                }
                
                // Handle direct variable references
                const varName = expression.trim();
                console.log(`🔍 Processing direct variable reference: ${varName}`);
                const value = extractVariableValue(originalCode || '', varName);
                
                // Special handling for API keys - but first check if it's already a placeholder
                if (varName.toLowerCase().includes('api') && varName.toLowerCase().includes('key')) {
                    console.log(`🔍 API key variable detected: ${varName}`);
                    // If it's already 'API_KEY' or similar placeholder, convert to 'YOUR_API_KEY'
                    if (varName === 'API_KEY' || varName === 'api_key' || varName === 'apiKey') {
                        return 'YOUR_API_KEY';
                    }
                    // For other API key variables, try to extract their value first
                    const extractedValue = extractVariableValue(originalCode || '', varName);
                    return extractedValue || 'YOUR_API_KEY';
                }
                
                const result = value || match;
                console.log(`🔍 Template literal replacement result: "${match}" -> "${result}"`);
                return result;
            });
            console.log('🔍 URL after template literal processing:', processedUrl);
        } else {
            console.log('🔍 No template literals found in URL');
        }

        const fetchOptions = {
            method: method || 'GET',
            headers: {
                ...headers
            }
        };

        // If body exists and method is not GET/HEAD, attach it
        if (body && !['GET', 'HEAD'].includes(fetchOptions.method)) {
            console.log('🔍 Processing request body:', body);
            console.log('🔍 Body type:', typeof body);
            
            // Ensure body is properly formatted for JSON requests
            if (fetchOptions.headers['Content-Type'] && fetchOptions.headers['Content-Type'].includes('application/json')) {
                // If it's supposed to be JSON but isn't already stringified, stringify it
                if (typeof body === 'object') {
                    fetchOptions.body = JSON.stringify(body);
                    console.log('✅ Body stringified from object:', fetchOptions.body);
                } else if (typeof body === 'string') {
                    // Check if it's already valid JSON
                    try {
                        JSON.parse(body);
                        fetchOptions.body = body; // Already valid JSON string
                        console.log('✅ Body is already valid JSON string');
                    } catch (e) {
                        console.log('⚠️ Body string is not valid JSON, trying to fix it');
                        // Not valid JSON, try to fix it using the utility function
                        try {
                            const fixedBody = validateAndFixJson(body);
                            fetchOptions.body = fixedBody;
                            console.log('✅ Body fixed and stringified:', fetchOptions.body);
                        } catch (parseError) {
                            console.log('❌ Failed to fix body, using fallback');
                            // Create a basic Anthropic API call as fallback
                            fetchOptions.body = getFallbackAnthropicBody(userQuery);
                        }
                    }
                } else {
                    fetchOptions.body = JSON.stringify(body);
                    console.log('✅ Body stringified from other type:', fetchOptions.body);
                }
            } else {
                fetchOptions.body = body; // Non-JSON body, use as-is
                console.log('✅ Body used as-is (non-JSON):', fetchOptions.body);
            }
        } else {
            console.log('🔍 No body to process or method is GET/HEAD');
            if (!body) {
                console.log('🔍 Body is null/undefined');
            }
            if (['GET', 'HEAD'].includes(fetchOptions.method)) {
                console.log('🔍 Method is GET/HEAD, no body needed');
            }
        }

        // Special handling for API keys in different formats
        console.log('🔍 Checking headers for API key placeholders...');
        console.log('🔍 Current headers:', Object.keys(fetchOptions.headers)); // Don't log actual values
        console.log('🔍 Authorization key provided:', !!authorizationKey); // Don't log actual key
        
        // 1. Authorization header (Anthropic style)
        if (fetchOptions.headers.Authorization && fetchOptions.headers.Authorization.includes('YOUR_API_KEY')) {
            // Check if user provided an authorization key
            if (validateApiKey(authorizationKey)) {
                // Use the user-provided authorization key
                if (fetchOptions.headers.Authorization.startsWith('Bearer ')) {
                    fetchOptions.headers.Authorization = `Bearer ${authorizationKey.trim()}`;
                } else {
                    fetchOptions.headers.Authorization = authorizationKey.trim();
                }
            }
            // Check if this is an Anthropic API call and no user key provided
            else if (url.includes('api.anthropic.com') || url.includes('anthropic.com')) {
                try {
                    // Get the real API key securely from backend
                    const realApiKey = await getApiKey('anthropic');
                    if (realApiKey) {
                        // Replace the placeholder with the real API key
                        fetchOptions.headers.Authorization = `Bearer ${realApiKey}`;
                    } else {
                        throw new Error('Anthropic API key not available from backend. Please check your backend configuration.');
                    }
                } catch (error) {
                    throw new Error('Unable to retrieve Anthropic API key. Please check your backend connection and configuration.');
                }
            } else {
                throw new Error('Please enter your API key in the "Authorization Key" field or replace "YOUR_API_KEY" in the generated code before running the request.');
            }
        }

        // 2. x-api-key header (common API key format) - check all possible cases
        const apiKeyHeaders = ['x-api-key', 'X-API-KEY', 'X-Api-Key', 'x-Api-Key'];
        let apiKeyHeaderFound = false;
        
        for (const headerKey of apiKeyHeaders) {
            if (fetchOptions.headers[headerKey] && fetchOptions.headers[headerKey].includes('YOUR_API_KEY')) {
                console.log(`🔍 Found ${headerKey} header with placeholder`);
                apiKeyHeaderFound = true;
                
                // Check if user provided an authorization key
                if (validateApiKey(authorizationKey)) {
                    // Use the user-provided authorization key
                    fetchOptions.headers[headerKey] = authorizationKey.trim();
                    console.log(`✅ Updated ${headerKey} header with user-provided key`); // Key value not logged for security
                } else {
                    throw new Error(`Please enter your API key in the "Authorization Key" field. The API requires a ${headerKey} header.`);
                }
                break; // Found and processed, no need to check other cases
            }
        }
        
        if (!apiKeyHeaderFound) {
            console.log('🔍 No API key headers with placeholders found');
            
            // Check if this is an API that typically requires an x-api-key header
            // and if the user has provided an authorization key
            if (authorizationKey.trim() && (
                url.includes('api.anthropic.com') || 
                url.includes('anthropic.com') ||
                url.includes('openai.com') ||
                url.includes('api.openai.com')
            )) {
                console.log('🔍 Adding x-api-key header for API that requires it');
                fetchOptions.headers['x-api-key'] = authorizationKey.trim();
            }
        }

        // 3. Basic Authentication - Multiple formats handled with priority order
        // Check template literal format FIRST (most specific)
        if (fetchOptions.headers.Authorization &&
            (fetchOptions.headers.Authorization.includes('${credentials}') ||
             fetchOptions.headers.Authorization.includes('${encodedCredentials}') ||
             fetchOptions.headers.Authorization.includes('`Basic ${'))) {

            if (authType === 'basic' && username.trim() && password.trim()) {
                // Evaluate template literal by replacing ${credentials} or ${encodedCredentials} with actual value
                const auth = btoa(`${username.trim()}:${password.trim()}`);

                // Handle template literal format: `Basic ${credentials}`
                let authHeader = fetchOptions.headers.Authorization;

                // Remove outer backticks if present
                if (authHeader.startsWith('`') && authHeader.endsWith('`')) {
                    authHeader = authHeader.slice(1, -1);
                }

                // Replace ${credentials} or ${encodedCredentials} with actual encoded value
                authHeader = authHeader.replace(/\$\{credentials\}/g, auth);
                authHeader = authHeader.replace(/\$\{encodedCredentials\}/g, auth);

                fetchOptions.headers.Authorization = authHeader;
                console.log(`✅ Evaluated template literal: 'Authorization': '${authHeader}'`);
            } else {
                throw new Error('This API requires Basic Authentication. Please enter your username and password, or switch authentication type.');
            }
        }
        // Check btoa() expression format
        else if (fetchOptions.headers.Authorization && fetchOptions.headers.Authorization.includes('btoa(')) {
            if (authType === 'basic' && username.trim() && password.trim()) {
                // Extract and replace btoa expression with actual encoded credentials
                const auth = btoa(`${username.trim()}:${password.trim()}`);
                fetchOptions.headers.Authorization = `Basic ${auth}`;
                console.log(`✅ Replaced btoa() expression with actual Basic Auth: 'Authorization': 'Basic ${auth}'`);
            } else {
                throw new Error('This API requires Basic Authentication. Please enter your username and password, or switch authentication type.');
            }
        }
        // Check placeholder format (YOUR_USERNAME:YOUR_PASSWORD)
        else if (fetchOptions.headers.Authorization &&
            (fetchOptions.headers.Authorization.includes('YOUR_USERNAME') ||
             fetchOptions.headers.Authorization.includes('YOUR_PASSWORD') ||
             fetchOptions.headers.Authorization.startsWith('Basic YOUR_'))) {

            if (authType === 'basic' && username.trim() && password.trim()) {
                // Create Basic Auth header with proper encoding
                const auth = btoa(`${username.trim()}:${password.trim()}`);
                fetchOptions.headers.Authorization = `Basic ${auth}`;
                console.log(`✅ Updated Authorization header with Basic Auth: 'Authorization': 'Basic ${auth}'`);
            } else {
                throw new Error('Please enter your username and password in the authentication fields for Basic Auth, or switch to API Key authentication.');
            }
        }

        // 4. URL query parameter (API key in URL)
        let finalUrl = processedUrl; // Use the processed URL that has evaluated parameters
        console.log('🔍 URL before API key handling:', finalUrl);
        
        // Handle API key placeholders - generic for all APIs
        const apiKeyPlaceholders = ['YOUR_API_KEY', 'API_KEY', 'APIKEY'];
        let hasPlaceholder = false;
        
        for (const placeholder of apiKeyPlaceholders) {
            if (finalUrl.includes(placeholder)) {
                console.log(`🔍 Found API key placeholder: ${placeholder}`);
                hasPlaceholder = true;
                if (validateApiKey(authorizationKey)) {
                    console.log(`🔍 Using user-provided authorization key`); // Key value not logged for security
                    // Use the user-provided authorization key
                    finalUrl = finalUrl.replace(new RegExp(placeholder, 'g'), authorizationKey.trim());
                } else if (finalUrl.includes('openweathermap.org')) {
                    console.log('🔍 Detected OpenWeatherMap API - trying to get key automatically');
                    // Special handling for OpenWeatherMap - auto-fetch key if not provided
                    try {
                        // Note: API keys should not be fetched to frontend for security
                        // This functionality should be moved to backend
                        const realApiKey = null;
                        if (realApiKey) {
                            console.log('✅ Got OpenWeatherMap API key from backend');
                            finalUrl = finalUrl.replace(new RegExp(placeholder, 'g'), realApiKey);
                        } else {
                            console.log('⚠️ No API key from backend, using fallback');
                            // Note: Using a demo key for testing purposes only
                            const fallbackApiKey = 'demo-key-replace-with-actual';
                            finalUrl = finalUrl.replace(new RegExp(placeholder, 'g'), fallbackApiKey);
                        }
                    } catch (error) {
                        console.log('❌ Error getting API key, using fallback');
                        // Note: Using a demo key for testing purposes only
                        const fallbackApiKey = 'demo-key-replace-with-actual';
                        finalUrl = finalUrl.replace(new RegExp(placeholder, 'g'), fallbackApiKey);
                    }
                } else {
                    console.log(`❌ No authorization key provided for placeholder: ${placeholder}`);
                    throw new Error(`Please enter your API key in the "Authorization Key" field. The URL contains "${placeholder}" placeholder that needs to be replaced.`);
                }
            }
        }
        
        console.log('🔍 Final URL after all processing:', finalUrl);
        
        // Handle other specific API key patterns
        if (finalUrl.includes('openweathermap.org') && finalUrl.includes('appid=demo-api-key')) {
            if (validateApiKey(authorizationKey)) {
                finalUrl = finalUrl.replace(/appid=demo-api-key/, `appid=${authorizationKey.trim()}`);
            } else {
                try {
                    const realApiKey = await getApiKey('openweathermap');
                    if (realApiKey) {
                        finalUrl = finalUrl.replace(/appid=demo-api-key/, `appid=${realApiKey}`);
                    } else {
                        const fallbackApiKey = 'd1f4a5d4c0c7259ecc3371c5c2946d36';
                        finalUrl = finalUrl.replace(/appid=demo-api-key/, `appid=${fallbackApiKey}`);
                    }
                } catch (error) {
                    const fallbackApiKey = 'd1f4a5d4c0c7259ecc3371c5c2946d36';
                    finalUrl = finalUrl.replace(/appid=demo-api-key/, `appid=${fallbackApiKey}`);
                }
            }
        }
        
        // Use the proxy API to avoid CORS issues
        try {
            console.group('🔄 Proxy Request Details');
            console.log('🌐 Final URL:', finalUrl);
            console.log('📮 Method:', fetchOptions.method);
            console.log('📑 Headers:', { ...fetchOptions.headers, Authorization: fetchOptions.headers.Authorization ? '***' : undefined });
            console.log('📦 Body:', fetchOptions.body ? (typeof fetchOptions.body === 'string' ? JSON.parse(fetchOptions.body) : fetchOptions.body) : null);
            console.groupEnd();
            
            // Prepare the request data for the proxy
            const requestData = {
                url: finalUrl,
                method: fetchOptions.method,
                headers: fetchOptions.headers
            };

            // Add body if present (parse it back to object for the proxy)
            if (fetchOptions.body) {
                console.log('🔍 Processing request body for proxy:', fetchOptions.body);
                try {
                    requestData.body = JSON.parse(fetchOptions.body);
                    console.log('✅ Body parsed as JSON for proxy:', requestData.body);
                } catch (e) {
                    console.log('⚠️ Body is not JSON, sending as string to proxy');
                    // If not JSON, send as string
                    requestData.body = fetchOptions.body;
                }
            } else {
                console.log('🔍 No body to send to proxy');
                // Ensure body is never undefined in the request
                requestData.body = null;
            }

            console.log('🔍 Final request data being sent to proxy:', requestData);

            // Call the proxy API
            console.log('🚀 Sending request to proxy API...');
            const proxyResponse = await proxyApiCall(requestData);
            
            // Calculate request duration
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);
            
            console.group('✨ Response Details');
            console.log('⏱️ Request Duration:', duration + 'ms');
            console.log('📊 Status:', proxyResponse.status);
            console.log('📝 Status Text:', proxyResponse.statusText);
            console.log('📑 Response Headers:', proxyResponse.headers);
            console.log('📦 Response Data:', proxyResponse.data);
            console.groupEnd();
            
            // Format the response to match the expected structure
            const responseData = {
                status: proxyResponse.status,
                statusText: proxyResponse.statusText || '',
                headers: proxyResponse.headers || {},
                url: proxyResponse.url || finalUrl,
                data: proxyResponse.data
            };

            // Check if the response indicates an error
            if (proxyResponse.status >= 400) {
                console.group('❌ Error Response');
                console.log('📊 Status:', proxyResponse.status);
                console.log('📝 Status Text:', proxyResponse.statusText);
                
                let errorBody = responseData.data;
                if (typeof errorBody === 'object') {
                    console.log('📦 Error Details:', errorBody);
                    errorBody = JSON.stringify(errorBody, null, 2);
                } else {
                    console.log('📦 Error Body:', errorBody);
                }
                console.groupEnd();
                
                throw new Error(`API call failed with status ${proxyResponse.status}. Response: ${errorBody}`);
            }

            console.log('✅ Request completed successfully!');
            console.groupEnd(); // Close main API Request Debug group
            return responseData;
        } catch (error) {
            console.group('❌ Error Details');
            console.log('🔴 Error Type:', error.name);
            console.log('❗ Error Message:', error.message);
            console.log('📍 Stack Trace:', error.stack);
            
            // Check if it's a proxy-specific error
            if (error.message.includes('Missing or invalid API key')) {
                console.log('🔑 Error Type: Missing/Invalid API Key');
                console.groupEnd();
                throw new Error('The proxy requires an API key. Please configure the backend with a valid API key in the ALLOWED_API_KEYS environment variable.');
            }
            if (error.message.includes('Target URL not allowed')) {
                console.log('🌐 Error Type: Domain Not Allowed');
                console.groupEnd();
                throw new Error(`The target domain is not allowed by the proxy. Please add the domain to ALLOWED_PROXY_DOMAINS in your backend configuration.`);
            }
            
            console.groupEnd();
            console.groupEnd(); // Close main API Request Debug group
            throw error;
        }

    };

    const handleRunTalkapi = async () => {
        if (!userQuery) {
            alert("Please provide a question.");
            return;
        }

        const canProceed = await trackApiCall();
        if (!canProceed) {
            return;
        }

        setIsLoading(true);
        setGeneratedCode(INITIAL_CODE_STATE);
        setApiResult(null);
        setApiError('');
        setShowProOnlyMessage(false);
        setCurrentHistoryId(null);
        setIsFavorited(false);

        try {

            console.log('🚀 Starting Talkapi generation...');
            console.log('❓ User Question:', userQuery);
            console.log('📤 Sending question to backend...');
            
            // Prepare API documentation for Claude
            let enhancedApiDoc = apiDoc;
            if (apiDoc) {
                try {
                    // If it's a URL, try to fetch the actual documentation
                    if (apiDoc.startsWith('http')) {
                        console.log('📝 API Doc is a URL, fetching content...');
                        try {
                            const docResponse = await fetch(apiDoc, {
                                headers: {
                                    'Accept': 'application/json, text/plain, */*'
                                }
                            });
                            if (docResponse.ok) {
                                const contentType = docResponse.headers.get('content-type');
                                if (contentType?.includes('json')) {
                                    enhancedApiDoc = await docResponse.json();
                                    enhancedApiDoc = JSON.stringify(enhancedApiDoc, null, 2);
                                } else {
                                    enhancedApiDoc = await docResponse.text();
                                }
                                console.log('✅ Successfully fetched API documentation');
                            } else {
                                console.warn(`Failed to fetch API documentation: ${docResponse.status}`);
                            }
                        } catch (error) {
                            console.warn('Failed to fetch API documentation:', error);
                        }
                    }

                    // Try to parse and format JSON
                    try {
                        const docJson = JSON.parse(enhancedApiDoc);
                        
                        // Extract base URL
                        let baseUrl = '';
                        if (docJson.servers && docJson.servers.length > 0) {
                            baseUrl = docJson.servers[0].url;
                        } else if (docJson.host) {
                            // Swagger 2.0 format
                            const scheme = docJson.schemes?.[0] || 'https';
                            baseUrl = `${scheme}://${docJson.host}${docJson.basePath || ''}`;
                        }

                        // Add version info if missing
                        if (!docJson.info?.version) {
                            docJson.info = docJson.info || {};
                            docJson.info.version = "1.0.0";
                        }

                        // Add OpenAPI version if missing
                        if (!docJson.openapi && !docJson.swagger) {
                            docJson.openapi = "3.0.0";
                        }

                        // Format the documentation
                        enhancedApiDoc = JSON.stringify(docJson, null, 2);
                        console.log('✅ Successfully formatted API documentation');
                    } catch (e) {
                        // Not JSON, check if it's YAML
                        if (enhancedApiDoc.includes('openapi:') || enhancedApiDoc.includes('swagger:')) {
                            console.log('📝 API Doc is in YAML format');
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Could not process API documentation:', e);
                }
            }

            // Prepare the question for Claude
            let enhancedQuestion = userQuery;
            if (!enhancedQuestion.endsWith('?')) {
                enhancedQuestion += '?';
            }

            // Extract base URL from API documentation or selected API
            const getBaseUrlFromDoc = (apiDoc, selectedApiInfo) => {
                let baseUrl = selectedApiInfo?.baseUrl || '';
                
                // If we have an API doc URL, try to extract base URL from it
                if (!baseUrl && apiDoc?.startsWith('http')) {
                    try {
                        const url = new URL(apiDoc);
                        baseUrl = url.origin;
                        
                        // Add path if it's not just a slash
                        if (url.pathname !== '/') {
                            baseUrl += url.pathname.endsWith('/') 
                                ? url.pathname.slice(0, -1) 
                                : url.pathname;
                        }
                        
                        // Ensure /v2 for Swagger Petstore
                        if (baseUrl.includes('petstore.swagger.io') && !baseUrl.endsWith('/v2')) {
                            baseUrl += '/v2';
                        }
                        
                        // Ensure HTTPS for Swagger Petstore
                        if (baseUrl.includes('petstore.swagger.io') && baseUrl.startsWith('http://')) {
                            baseUrl = baseUrl.replace('http://', 'https://');
                        }
                    } catch (error) {
                        console.warn('Failed to parse API doc URL:', error);
                    }
                }
                
                return baseUrl;
            };
            
            const apiBaseUrl = getBaseUrlFromDoc(apiDoc, selectedApiInfo);
            
            // Log the base URL for debugging
            console.log('🔗 Using base URL:', apiBaseUrl);

            // Add API context to the question with base URL
            if (apiDoc) {
                enhancedQuestion = `Using this API documentation:\n\n${enhancedApiDoc}\n\nBase URL: ${apiBaseUrl}\n\n${enhancedQuestion}\n\nPlease provide working code examples that use the actual API endpoints and methods from the documentation. IMPORTANT: Use the complete base URL (${apiBaseUrl}) for all endpoints.`;
            }

            // Add example code with absolute URLs to the question
            const exampleCode = `
Example of correct URL usage:
❌ Wrong: 
fetch('/pet/findByStatus?status=available')

✅ Right:
fetch("${apiBaseUrl}/pet/findByStatus?status=available", {
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
})
`;

            // Send to Claude with proper context
            console.log('📤 Sending to Claude with enhanced documentation...');
            const response = await askQuestion(
                `${enhancedQuestion}\n\n${exampleCode}\n\nIMPORTANT: Always use the complete base URL (${apiBaseUrl}) for all endpoints. Never use relative URLs.`,
                user?.id || '',
                enhancedApiDoc,
                {
                    ...selectedApiInfo,
                    baseUrl: apiBaseUrl,
                    authType: authType === 'basic' ? 'basic' : selectedApiInfo?.authType || 'x-api-key',
                    username: authType === 'basic' ? username : '',
                    password: authType === 'basic' ? password : ''
                }
            );
            
            // Parse and validate the response
            console.log('✅ Backend response received:', response);
            
            if (!response || !response.snippets) {
                throw new Error('Invalid response from Claude. Missing code snippets.');
            }

            // Extract and validate base URL
            let baseUrl = '';
            if (apiDoc?.startsWith('http')) {
                const url = new URL(apiDoc);
                baseUrl = url.origin + (url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname);
            } else if (selectedApiInfo?.baseUrl) {
                baseUrl = selectedApiInfo.baseUrl;
            }

            // Ensure base URL ends with /v2 for Swagger Petstore
            if (baseUrl.includes('petstore.swagger.io') && !baseUrl.endsWith('/v2')) {
                baseUrl = baseUrl + '/v2';
            }

            console.log('🔍 Using base URL:', baseUrl);

            // Validate each code snippet and ensure absolute URLs
            const languages = ['javascript', 'python', 'curl'];
            const validSnippets = {};
            let hasValidSnippet = false;

            for (const lang of languages) {
                let snippet = response.snippets[lang];
                if (snippet && !snippet.includes('will be generated here')) {
                    // Fix relative URLs in the snippet
                    if (baseUrl) {
                        // Replace relative URLs with absolute URLs
                        snippet = snippet.replace(
                            /['"`](\/[^'"`\s]+)['"`]/g,
                            (match, path) => `"${baseUrl}${path}"`
                        );
                        
                        // Handle fetch calls
                        snippet = snippet.replace(
                            /fetch\s*\(\s*['"`](\/[^'"`]+)['"`]/g,
                            `fetch("${baseUrl}$1"`
                        );

                        // Handle requests calls (Python)
                        snippet = snippet.replace(
                            /requests\.[a-z]+\s*\(\s*['"`](\/[^'"`]+)['"`]/g,
                            (match, path) => match.replace(path, `${baseUrl}${path}`)
                        );

                        // Handle curl commands
                        snippet = snippet.replace(
                            /curl\s+['"`](\/[^'"`]+)['"`]/g,
                            `curl "${baseUrl}$1"`
                        );
                    }

                    // Clean up only specific base URL template placeholders in the displayed code
                    // Only replace base URL placeholders, NOT all template literals
                    if (baseUrl) {
                        snippet = snippet.replace(/\$\{baseUrl\}/g, baseUrl);
                        snippet = snippet.replace(/\$\{apiUrl\}/g, baseUrl);
                        snippet = snippet.replace(/\$\{url\}/g, baseUrl);
                        snippet = snippet.replace(/\$\{BASE_URL\}/g, baseUrl);
                    }
                    // DO NOT replace other template literals - they're actual variables like ${checkIn}, ${username}, ${response.status}

                    validSnippets[lang] = snippet;
                    hasValidSnippet = true;
                } else {
                    // Generate placeholder with error message
                    validSnippets[lang] = `// No valid ${lang.toUpperCase()} code was generated.\n// Please try rephrasing your question or providing more API documentation.`;
                }
            }

            if (!hasValidSnippet) {
                throw new Error('Claude did not generate any valid code snippets. Please try again with a more specific question.');
            }

            // Update the code snippets
            setGeneratedCode(validSnippets);
            let snippets = {};
            
            if (response?.snippets) {
                console.log('📄 Response contains snippets:', Object.keys(response.snippets));
                snippets = {
                    javascript: response.snippets.javascript || '// JavaScript code will be generated here',
                    python: response.snippets.python || '// Python code will be generated here',
                    curl: response.snippets.curl || '// cURL command will be generated here'
                };
                
                console.log('📝 Generated snippets:', {
                    javascript: snippets.javascript.length,
                    python: snippets.python.length,
                    curl: snippets.curl.length,
                    csharp: snippets.csharp.length,
                    java: snippets.java.length,
                    go: snippets.go.length
                });

                setGeneratedCode(snippets);
                console.log('✅ Code snippets set in state');
            } else {
                // Fallback: try to extract from answer field (for backward compatibility)
                console.log('⚠️ No snippets found, trying fallback extraction...');
            const answer = response?.answer || '';
                console.log('📄 Response answer length:', answer.length);
                console.log('📄 Response answer preview:', answer.substring(0, 200) + '...');
                
                // Extract code snippets from the response
                console.log('🔍 Extracting code snippets...');
                snippets = {
                javascript: extractCodeSnippet(answer, 'javascript', 'fetch'),
                python: extractCodeSnippet(answer, 'python', 'requests'),
                    curl: extractCodeSnippet(answer, 'curl', 'curl'),
                    csharp: extractCodeSnippet(answer, 'csharp', 'csharp'),
                    java: extractCodeSnippet(answer, 'java', 'java'),
                    go: extractCodeSnippet(answer, 'go', 'go')
                };

                console.log('📝 Generated snippets:', {
                    javascript: snippets.javascript.length,
                    python: snippets.python.length,
                    curl: snippets.curl.length,
                    csharp: snippets.csharp.length,
                    java: snippets.java.length,
                    go: snippets.go.length
                });

            setGeneratedCode(snippets);
                console.log('✅ Code snippets set in state');
            }
            
            // Auto-populate Authorization Key for OpenWeatherMap
            const jsCode = snippets.javascript || '';
            if (jsCode.includes('openweathermap.org') || jsCode.includes('openweather')) {
                try {
                    const openWeatherKey = await getApiKey('openweathermap');
                    if (openWeatherKey && !authorizationKey.trim()) {
                        setAuthorizationKey(openWeatherKey);
                    }
                } catch (error) {
                    console.log('Could not auto-populate OpenWeatherMap key:', error);
                }
            }
            
        } catch (error) {
            console.error('Error getting answer:', error);
            setApiError(`Failed to get answer: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const extractCodeSnippet = (text, language, keyword) => {
        console.log(`🔍 Extracting ${language} code snippet...`);
        console.log(`🔍 Text length: ${text?.length || 0}`);
        
        if (!text || typeof text !== 'string') {
            console.error('Invalid text parameter for extractCodeSnippet:', text);
            return `// ${language.toUpperCase()} code will be generated here\n// Based on your API documentation and question`;
        }
        
        // Simple extraction - look for code blocks with the specified language
        const codeBlockRegex = new RegExp(`\`\`\`${language}\\s*([\\s\\S]*?)\`\`\``, 'i');
        console.log(`🔍 Using regex: ${codeBlockRegex}`);
        
        const match = text.match(codeBlockRegex);
        console.log(`🔍 Regex match found: ${!!match}`);
        
        if (match) {
            let code = match[1].trim();
            console.log(`🔍 Extracted ${language} code length: ${code.length}`);
            console.log(`🔍 Code preview: ${code.substring(0, 100)}...`);
            
            // Fix common placeholder URLs for Anthropic API
            if (code.includes('api.example.com') || code.includes('example.com')) {
                code = fixAnthropicPlaceholderUrl(code);
            }
            
            return code;
        }
        
        // Fallback: look for lines containing the keyword
        console.log(`🔍 No code block found, trying fallback extraction for ${language}...`);
        const lines = text.split('\n');
        const relevantLines = lines.filter(line => 
            line.toLowerCase().includes(keyword.toLowerCase()) ||
            line.includes('http') ||
            line.includes('fetch') ||
            line.includes('requests') ||
            line.includes('curl')
        );
        
        console.log(`🔍 Found ${relevantLines.length} relevant lines for ${language}`);
        
        if (relevantLines.length > 0) {
            let code = relevantLines.join('\n');
            console.log(`🔍 Fallback ${language} code length: ${code.length}`);
            
            // Fix common placeholder URLs for Anthropic API
            if (code.includes('example.com')) {
                code = fixAnthropicPlaceholderUrl(code);
            }
            
            return code;
        }
        
        // If no code found, generate a basic Anthropic API call
        if (language === 'javascript' && keyword === 'fetch') {
            return `fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY',
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: 'Hello, how are you?'
      }
    ]
  })
})
.then(response => response.json())

.catch(error => console.error('Error:', error));`;
        }
        
        return `// ${language.toUpperCase()} code will be generated here\n// Based on your API documentation and question`;
    };



    const handleRunApiCall = async () => {

        setShowProOnlyMessage(false);
        setIsExecuting(true);
        setApiResult(null);
        setApiError('');
        let historyEntry = null;

        try {
            // Use the currently selected language tab
            const currentCode = generatedCode[selectedLanguage];
            if (!currentCode) {
                throw new Error(`No ${selectedLanguage} code available to run.`);
            }
            
            console.log(`🔍 Parsing ${selectedLanguage} code for execution:`, currentCode);
            
            let parsedCode;
            if (selectedLanguage === 'javascript') {
                parsedCode = parseGeneratedCode(currentCode);
            } else if (selectedLanguage === 'python') {
                parsedCode = parsePythonCode(currentCode);
            } else if (selectedLanguage === 'curl') {
                parsedCode = parseCurlCode(currentCode);
            } else {
                throw new Error(`Unsupported language: ${selectedLanguage}`);
            }
            
            console.log(`🔍 Parsed code result:`, parsedCode);
            
            if (!parsedCode) {
                throw new Error(`Failed to parse the generated ${selectedLanguage} code. Please try generating a new API call.`);
            }
            
            if (!parsedCode.url) {
                console.log('⚠️ Parsed code missing URL, but continuing with fallback');
                // The parseGeneratedCode function should have created a fallback, so we can continue
            }

            // Validate the URL
            const urlValidation = validateApiUrl(parsedCode.url);
            if (!urlValidation.valid) {
                if (urlValidation.fixed) {
                    parsedCode.url = urlValidation.fixed;
                } else {
                    throw new Error(urlValidation.error);
                }
            }
            
            // Execute through backend proxy to avoid CORS issues
            console.log('🚀 Executing API call through backend proxy...');
            console.log('📦 Request details:', {
                url: parsedCode.url,
                method: parsedCode.method,
                headers: parsedCode.headers,
                bodyLength: parsedCode.body ? parsedCode.body.length : 0
            });

            const proxyResponse = await proxyApiCall({
                url: parsedCode.url,
                method: parsedCode.method || 'POST',
                headers: parsedCode.headers || {},
                body: parsedCode.body
            });

            console.log('📡 Proxy response received:', proxyResponse);

            // Format the result for display
            const result = {
                status: proxyResponse.status || 200,
                statusText: proxyResponse.statusText || 'OK',
                url: parsedCode.url,
                headers: proxyResponse.headers || {},
                data: proxyResponse.data || proxyResponse
            };

            console.log('✅ Final result:', result);
            setApiResult(result);
            if (user && user.isLoggedIn) { // Check if user is logged in
                historyEntry = {
                    userQuery,
                    generatedCode: generatedCode[selectedLanguage], // Save the selected language code for history
                    endpoint: result.url,
                    status: 'Success',
                    executionResult: { status: result.status, data: result.data }
                };
            }
        } catch (error) {
            let errorMessage = 'Failed to execute API call: ';
            
            if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Network request failed'))) {
                errorMessage += 'Network error - unable to reach the API endpoint. Please check if the server is running and accessible. This might also be due to a CORS issue if the error message is generic.';
            } else if (error.message.includes('CORS')) {
                errorMessage += 'CORS policy blocked the request. The API server needs to allow cross-origin requests from this domain.';
            } else if (error.message.includes('YOUR_API_KEY')) {
                errorMessage = error.message; // Use the specific message from executeApiCall
            } else {
                errorMessage += error.message;
            }
            
            setApiError(errorMessage);
            if (user && user.isLoggedIn) { // Check if user is logged in
                historyEntry = {
                    userQuery,
                    generatedCode: generatedCode.javascript, // Save the JS code for history
                    endpoint: (generatedCode.javascript && generatedCode.javascript.match) 
                        ? (generatedCode.javascript.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/)?.[1] || 'Unknown')
                        : 'Unknown',
                    status: 'Error',
                    executionResult: { error: errorMessage }
                };
            }
        } finally {
            setIsExecuting(false);
            if (user && user.isLoggedIn && historyEntry) { // Check if user is logged in and historyEntry was created
                try {
                    const newHistory = await History.create(historyEntry);
                    setCurrentHistoryId(newHistory.id);
                    setIsFavorited(newHistory.isFavorite || false); // Ensure favorite status is set
                } catch (e) {
                    console.error("Failed to save history:", e);
                }
            }
        }
    };

    const handleToggleFavorite = async () => {
        if (!currentHistoryId || !user || !user.isLoggedIn) return; // Ensure logged in
        const newFavoriteStatus = !isFavorited;
        try {
            await History.update(currentHistoryId, { isFavorite: newFavoriteStatus });
            setIsFavorited(newFavoriteStatus);
        } catch (e) {
            console.error("Failed to update favorite status:", e);
            alert("Could not update favorite status. Please try again.");
        }
    };
    




    const handleSelectPublicApi = async ({ documentation, apiName, demoKey, docsUrl }) => {
        setApiDoc(documentation);
        // Store the selected API information for use in API calls
        setSelectedApiInfo({ apiName, demoKey, docsUrl });
        // Clear all result-related state when switching API
        setGeneratedCode(INITIAL_CODE_STATE);
        setApiResult(null);
        setApiError('');
        setIsFavorited(false);
        setCurrentHistoryId(null);
        setCopied(false);
        // Optionally clear userQuery and uploadedFile as well:
        // setUserQuery('');
        // setUploadedFile(null);
        // Note: For Anthropic, the backend will use its own API key internally
        // No need to fetch API keys to the frontend for security reasons
        // Show success message
        alert(`✅ ${apiName} API loaded successfully! ${demoKey ? 'Demo key included.' : ''}`);
        setShowPublicApiSelector(false); // Close the selector after selection
    };

    return (
        <div id="api-tool" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="mb-6 sm:mb-8">
                <UsageDisplay usage={usage} onFeedbackClick={() => setShowFeedbackPopup(true)} user={user} />
            </div>

      

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 bg-black/20 p-4 sm:p-6 lg:p-8 rounded-xl border border-white/10">
                {/* Left Column - Input Section */}
                <div className="space-y-4 sm:space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-white">
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
                                <span className="break-words">1. Paste API Documentation</span>
                            </label>
                            {apiDoc && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyApiDoc}
                                    className="flex items-center gap-2 border-blue-400 text-gray-800 hover:bg-blue-400 hover:text-black text-sm"
                                >
                                    {copiedApiDoc ? <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                                    {copiedApiDoc ? 'Copied!' : 'Copy'}
                                </Button>
                            )}
                        </div>
                        <div className="relative">
                            <Textarea
                                value={apiDoc}
                                onChange={(e) => setApiDoc(e.target.value)}
                                placeholder="Paste your REST API documentation here..."
                                className="bg-slate-800 border-slate-700 text-gray-300 h-32 sm:h-48 font-mono text-xs sm:text-sm resize-none"
                                disabled={isFileProcessing}
                            />
                            {isFileProcessing && (
                                <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center rounded-md">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Processing File...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3">
                            <Button 
                                variant="link" 
                                className="p-0 h-auto text-green-400 text-sm justify-start" 
                                onClick={() => setShowPublicApiSelector(true)}
                            >
                                🔘 Select Public API
                            </Button>
                            <div className="relative group">
                                                <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp,.doc,.docx,.xls,.xlsx,.txt,.json,.xml,.csv,.md,.rtf,.odt,.ods,.odp,.ppt,.pptx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="file-upload"
                />
                <label htmlFor="file-upload" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 cursor-pointer text-sm transition-colors duration-200 group-hover:scale-105">
                    <Upload className="w-4 h-4 flex-shrink-0" />
                    Upload File
                </label>
                            </div>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    id="image-upload"
                                    disabled={isOcrProcessing}
                                />
                                <label htmlFor="image-upload" className={`flex items-center gap-2 text-orange-400 hover:text-orange-300 cursor-pointer text-sm transition-colors duration-200 ${isOcrProcessing ? 'opacity-50 cursor-not-allowed' : 'group-hover:scale-105'}`}>
                                    {isOcrProcessing ? (
                                        <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                                    ) : (
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                    )}
                                    {isOcrProcessing ? 'Processing OCR...' : 'Upload Image'}
                                </label>
                            </div>
                            <Button 
                                variant="link" 
                                className="p-0 h-auto text-red-400 hover:text-red-300 text-sm justify-start" 
                                onClick={handleClearAll}
                            >
                                🗑️ Clear All
                            </Button>
                        </div>
                                    {uploadedFile && (
                <p className="text-green-400 text-sm mt-2 break-all">
                    File uploaded: {uploadedFile.name}
                    {ocrText && (
                        <span className="block mt-1 text-xs text-gray-400">
                            File processing completed - {ocrText.length} characters extracted
                        </span>
                    )}
                </p>
            )}
                        {uploadedImage && (
                            <p className="text-orange-400 text-sm mt-2 break-all">
                                Image uploaded: {uploadedImage.name}
                                {ocrText && (
                                    <span className="block mt-1 text-xs text-gray-400">
                                        OCR completed - {ocrText.length} characters extracted
                                    </span>
                                )}
                            </p>
                        )}
                        
                        {/* Legal Disclaimer */}
                        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                                📄 By uploading API docs, you confirm that you are authorized to use this documentation and that it does not contain confidential or proprietary information.
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-white">
                                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                                <span className="break-words">2. Ask Your API Assistant</span>
                            </label>
                            {userQuery && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyUserQuery}
                                    className="flex items-center gap-2 border-purple-400 text-gray-800 hover:bg-purple-400 hover:text-black text-sm"
                                >
                                    {copiedUserQuery ? <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                                    {copiedUserQuery ? 'Copied!' : 'Copy'}
                                </Button>
                            )}
                        </div>
                        <Input
                            value={userQuery}
                            onChange={(e) => setUserQuery(e.target.value)}
                            placeholder="e.g., How can I get hotel availability in Paris?"
                            className="bg-slate-800 border-slate-700 text-base sm:text-lg"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Button 
                            onClick={handleRunTalkapi} 
                            size="lg" 
                            className="w-full text-base sm:text-lg bg-blue-600 hover:bg-blue-700 py-4 sm:py-6" 
                            disabled={isLoading || usage.count >= usage.limit}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" /> : null}
                            {isLoading ? 'Generating...' : 'Generate Talkapi 🚀'}
                        </Button>
                        

                        

                    </div>
                </div>
                
                {/* Right Column - Output Section */}
                <div className="space-y-4 sm:space-y-6">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                            <label className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-white">
                                <Code className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
                                <span className="break-words">3. Generated Code</span>
                            </label>
                                                         {hasAnyGeneratedCode(generatedCode) && (
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    {user && user.isLoggedIn && currentHistoryId && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleToggleFavorite}
                                            className="text-yellow-400 hover:text-yellow-300"
                                        >
                                            <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorited ? 'fill-current' : ''}`} />
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyCode}
                                        className="flex items-center gap-2 border-green-400 text-gray-800 hover:bg-green-400 hover:text-black text-sm"
                                    >
                                        {copied ? <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-800 border-slate-700 rounded-lg flex items-center justify-center overflow-hidden min-h-[224px]">
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-400" />
                            ) : generatedCode.javascript ? (
                                <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage} className="w-full h-full flex flex-col">
                                    <TabsList className="grid w-full grid-cols-3 bg-slate-900 rounded-t-lg rounded-b-none">
                                        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                                        <TabsTrigger value="python">Python</TabsTrigger>
                                        <TabsTrigger value="curl">cURL</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="javascript" className="p-0 text-xs sm:text-sm h-[170px] flex-grow mt-0">
                                        <Textarea
                                            value={generatedCode.javascript}
                                            onChange={(e) => setGeneratedCode(prev => ({ ...prev, javascript: e.target.value }))}
                                            className="w-full h-full bg-slate-900 border-0 text-green-400 font-mono text-xs sm:text-sm resize-none focus:ring-0 focus:ring-offset-0 rounded-none"
                                            placeholder="Claude AI answer will appear here..."
                                        />
                                    </TabsContent>
                                    <TabsContent value="python" className="p-0 text-xs sm:text-sm h-[170px] flex-grow mt-0">
                                        <Textarea
                                            value={generatedCode.python}
                                            onChange={(e) => setGeneratedCode(prev => ({ ...prev, python: e.target.value }))}
                                            className="w-full h-full bg-slate-900 border-0 text-green-400 font-mono text-xs sm:text-sm resize-none focus:ring-0 focus:ring-offset-0 rounded-none"
                                            placeholder="Claude AI answer will appear here..."
                                        />
                                    </TabsContent>
                                    <TabsContent value="curl" className="p-0 text-xs sm:text-sm h-[170px] flex-grow mt-0">
                                        <Textarea
                                            value={generatedCode.curl}
                                            onChange={(e) => setGeneratedCode(prev => ({ ...prev, curl: e.target.value }))}
                                            className="w-full h-full bg-slate-900 border-0 text-green-400 font-mono text-xs sm:text-sm resize-none focus:ring-0 focus:ring-offset-0 rounded-none"
                                            placeholder="Claude AI answer will appear here..."
                                        />
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <p className="text-slate-500 text-center text-sm px-4">Generated code will appear here...</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                                                 {hasAnyGeneratedCode(generatedCode) && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Authentication Type
                                    </label>
                                    <select
                                        value={authType}
                                        onChange={(e) => setAuthType(e.target.value)}
                                        className="w-full bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-purple-400 rounded-md p-2"
                                    >
                                        <option value="api_key">API Key</option>
                                        <option value="basic">Username & Password (Basic Auth)</option>
                                    </select>
                                </div>

                                {authType === 'api_key' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            API Key (Optional)
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="Enter your API key or Bearer token..."
                                            value={authorizationKey}
                                            onChange={(e) => setAuthorizationKey(e.target.value)}
                                            className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-purple-400"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            This will replace "YOUR_API_KEY" in the generated code when running the request
                                        </p>
                                    </div>
                                )}

                                {authType === 'basic' && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Username
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your username..."
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-purple-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Password
                                            </label>
                                            <Input
                                                type="password"
                                                placeholder="Enter your password..."
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-purple-400"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            This will replace "YOUR_USERNAME" and "YOUR_PASSWORD" in the generated code when running the request
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <Button 
                            onClick={handleRunApiCall} 
                            size="lg" 
                            className="w-full text-base sm:text-lg bg-purple-600 hover:bg-purple-700 py-4 sm:py-6" 
                                                         disabled={isExecuting || !hasAnyGeneratedCode(generatedCode)}
                        >
                            {isExecuting ? (
                                <>
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                                    Running...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    Run this API Request
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Response Area */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                            <h3 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-white">
                                <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0"/>
                                <span className="break-words">API Response</span>
                            </h3>
                            {(apiResult || apiError) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyResult}
                                    className="flex items-center gap-2 border-blue-400 text-gray-800 hover:bg-blue-400 hover:text-black text-sm self-start sm:self-auto"
                                >
                                    {resultCopied ? <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                                    {resultCopied ? 'Copied!' : 'Copy Result'}
                                </Button>
                            )}
                        </div>
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 sm:p-4 min-h-[120px] sm:min-h-[150px] font-mono text-xs sm:text-sm overflow-hidden">
                                                         {!hasAnyGeneratedCode(generatedCode) ? (
                                <div className="text-slate-500 text-center">Response from the API will appear here...</div>
                            ) : isExecuting ? (
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0"/>
                                    <span>Executing API call...</span>
                                </div>
                            ) : showProOnlyMessage ? (
                                <div className="text-yellow-400">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-semibold">Pro Feature Required</span>
                                    </div>
                                    <div className="text-sm text-yellow-300">
                                        Running API calls directly is available only on the Pro plan.
                                    </div>
                                </div>
                            ) : apiError ? (
                                <div className="text-red-400 whitespace-pre-wrap break-words overflow-auto max-h-40">{apiError}</div>
                            ) : apiResult ? (
                                <div className="overflow-auto max-h-60">
                                    <pre className="text-slate-300 whitespace-pre-wrap break-words text-xs sm:text-sm">
                                        <span className="text-green-400">Status: {apiResult.status} {apiResult.statusText}</span>
                                        <br/>
                                        <span className="text-blue-400 break-all">URL: {apiResult.url}</span>
                                        <br/>
                                        <span className="text-purple-400">Content-Type: {apiResult.headers['content-type'] || 'N/A'}</span>
                                        <hr className="my-2 border-slate-600"/>
                                        <span className="text-yellow-400">Response Data:</span>
                                        <br/>
                                        {typeof apiResult.data === 'object' ? 
                                            JSON.stringify(apiResult.data, null, 2) : 
                                            apiResult.data}
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-slate-500 text-center">Response from the API will appear here...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showProOnlyMessage && (
                <Alert variant="destructive" className="mt-6 sm:mt-8 max-w-xl mx-auto bg-yellow-900/30 border-yellow-600">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <AlertTitle className="text-yellow-400">Pro Feature</AlertTitle>
                    <AlertDescription className="text-yellow-300">
                        Running API calls directly is available only on the Pro plan.
                        <Button asChild variant="link" className="p-0 pl-2 h-auto text-yellow-200 hover:text-yellow-100">
                           <Link to={createPageUrl("Pricing")}>Upgrade your plan to unlock this feature.</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
            <FeedbackPopup 
                open={showFeedbackPopup} 
                onClose={() => setShowFeedbackPopup(false)}
                onFeedbackSubmitted={handleFeedbackSubmitted}
            />
            <PublicApiSelector 
                open={showPublicApiSelector}
                onClose={() => setShowPublicApiSelector(false)}
                onSelectApi={handleSelectPublicApi}
            />
        </div>
    );
}

function FaqSection() {
    return (
        <div className="py-12 sm:py-16 px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="w-full">
                    {faqData.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="bg-black/20 border border-white/10 rounded-lg px-4 sm:px-6 mb-4">
                            <AccordionTrigger className="text-base sm:text-lg text-white text-left hover:no-underline break-words">{item.question}</AccordionTrigger>
                            <AccordionContent className="text-sm sm:text-base text-blue-200">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <div>
            <HeroSection />
            <ApiToolSection />
            <FaqSection />
        </div>
    );
}
