import React, { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Copy, CheckCheck, Loader2 } from 'lucide-react';
import { validateApiUrl } from '../utils/testApiUrl.jsx';

/**
 * @typedef {Object} CodeSnippet
 * @property {string} language - The programming language
 * @property {string} code - The code content
 * @property {boolean} isEditable - Whether the code can be edited
 */

/**
 * CodeSnippets component for displaying and managing code in multiple languages
 * @param {Object} props
 * @param {Object} props.snippets - Object containing code snippets for each language
 * @param {function} props.onSnippetsChange - Callback when snippets are edited
 * @param {string} props.selectedLanguage - Currently selected language tab
 * @param {function} props.onLanguageChange - Callback when language tab changes
 * @param {boolean} props.isLoading - Whether code is being generated/loaded
 * @param {function} props.onRunCode - Callback when "Run Code" is clicked
 * @param {boolean} props.isExecuting - Whether code is currently being executed
 */
const CodeSnippets = ({
    snippets = {},
    onSnippetsChange,
    selectedLanguage = 'javascript',
    onLanguageChange,
    isLoading = false,
    onRunCode,
    isExecuting = false
}) => {
    const [copied, setCopied] = useState(false);

    // Languages configuration
    const LANGUAGES = {
        javascript: {
            label: 'JavaScript',
            placeholder: '// JavaScript code here...',
            parseFunction: parseJavaScriptCode
        },
        python: {
            label: 'Python',
            placeholder: '# Python code here...',
            parseFunction: parsePythonCode
        },
        curl: {
            label: 'cURL',
            placeholder: '# cURL command here...',
            parseFunction: parseCurlCode
        },
        csharp: {
            label: 'C#',
            placeholder: '// C# code here...',
            parseFunction: null // Not implemented yet
        },
        java: {
            label: 'Java',
            placeholder: '// Java code here...',
            parseFunction: null // Not implemented yet
        },
        go: {
            label: 'Go',
            placeholder: '// Go code here...',
            parseFunction: null // Not implemented yet
        }
    };

    // Handle code copy
    const handleCopy = useCallback(async () => {
        const codeToCopy = snippets[selectedLanguage];
        if (codeToCopy) {
            try {
                await navigator.clipboard.writeText(codeToCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
            }
        }
    }, [selectedLanguage, snippets]);

    // Handle code change
    const handleCodeChange = useCallback((language, newCode) => {
        if (onSnippetsChange) {
            onSnippetsChange({
                ...snippets,
                [language]: newCode
            });
        }
    }, [snippets, onSnippetsChange]);

    // Parse JavaScript code
    const parseJavaScriptCode = useCallback((code) => {
        try {
            console.log('🔍 Parsing JavaScript code:', code);
            
            let url = null;
            let method = 'GET';
            let headers = {};
            let body = null;

            // Extract URL
            const urlMatch = code.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
            if (urlMatch) {
                url = urlMatch[1];
            }

            // Extract method
            const methodMatch = code.match(/method:\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]/i);
            if (methodMatch) {
                method = methodMatch[1].toUpperCase();
            }

            // Extract headers
            const headersMatch = code.match(/headers:\s*({[^}]+})/);
            if (headersMatch) {
                try {
                    // Clean up the headers string and parse it
                    const headersStr = headersMatch[1]
                        .replace(/'/g, '"')
                        .replace(/(\w+):/g, '"$1":');
                    headers = JSON.parse(headersStr);
                } catch (e) {
                    console.warn('Failed to parse headers:', e);
                }
            }

            // Extract body
            const bodyMatch = code.match(/body:\s*JSON\.stringify\s*\(([^)]+)\)/);
            if (bodyMatch) {
                try {
                    // Clean up the body string and parse it
                    const bodyStr = bodyMatch[1]
                        .replace(/'/g, '"')
                        .replace(/(\w+):/g, '"$1":');
                    body = JSON.parse(bodyStr);
                } catch (e) {
                    console.warn('Failed to parse body:', e);
                }
            }

            return { url, method, headers, body, originalCode: code };
        } catch (e) {
            console.error('Error parsing JavaScript code:', e);
            return null;
        }
    }, []);

    // Parse Python code
    const parsePythonCode = useCallback((code) => {
        try {
            console.log('🔍 Parsing Python code:', code);
            
            let url = null;
            let method = 'GET';
            let headers = {};
            let body = null;

            // Extract URL
            const urlMatch = code.match(/requests\.[a-z]+\s*\(\s*['"]([^'"]+)['"]/i);
            if (urlMatch) {
                url = urlMatch[1];
            }

            // Extract method from the function call
            const methodMatch = code.match(/requests\.([a-z]+)\s*\(/i);
            if (methodMatch) {
                method = methodMatch[1].toUpperCase();
            }

            // Extract headers
            const headersMatch = code.match(/headers\s*=\s*({[^}]+})/);
            if (headersMatch) {
                try {
                    // Clean up the headers string and parse it
                    const headersStr = headersMatch[1]
                        .replace(/'/g, '"')
                        .replace(/(\w+):/g, '"$1":');
                    headers = JSON.parse(headersStr);
                } catch (e) {
                    console.warn('Failed to parse headers:', e);
                }
            }

            // Extract body/json/data
            const bodyMatch = code.match(/(?:json|data)\s*=\s*({[^}]+})/);
            if (bodyMatch) {
                try {
                    // Clean up the body string and parse it
                    const bodyStr = bodyMatch[1]
                        .replace(/'/g, '"')
                        .replace(/(\w+):/g, '"$1":');
                    body = JSON.parse(bodyStr);
                } catch (e) {
                    console.warn('Failed to parse body:', e);
                }
            }

            return { url, method, headers, body, originalCode: code };
        } catch (e) {
            console.error('Error parsing Python code:', e);
            return null;
        }
    }, []);

    // Parse cURL code
    const parseCurlCode = useCallback((code) => {
        try {
            console.log('🔍 Parsing cURL code:', code);
            
            let url = null;
            let method = 'GET';
            let headers = {};
            let body = null;

            // Extract URL
            const urlMatch = code.match(/curl\s+['"]([^'"]+)['"]/);
            if (urlMatch) {
                url = urlMatch[1];
            }

            // Extract method
            const methodMatch = code.match(/-X\s+(['"]?)([A-Z]+)\1/);
            if (methodMatch) {
                method = methodMatch[2];
            }

            // Extract headers
            const headerMatches = code.match(/-H\s+['"]([^'"]+)['"]/g);
            if (headerMatches) {
                headerMatches.forEach(match => {
                    const [key, value] = match.match(/-H\s+['"]([^:]+):\s*([^'"]+)['"]/i)?.slice(1) || [];
                    if (key && value) {
                        headers[key] = value;
                    }
                });
            }

            // Extract body
            const bodyMatch = code.match(/-d\s+['"]({[^}]+})['"]/);
            if (bodyMatch) {
                try {
                    body = JSON.parse(bodyMatch[1]);
                } catch (e) {
                    console.warn('Failed to parse body:', e);
                }
            }

            return { url, method, headers, body, originalCode: code };
        } catch (e) {
            console.error('Error parsing cURL code:', e);
            return null;
        }
    }, []);

    // Validate and run code
    const handleRunCode = useCallback(async () => {
        try {
            const currentCode = snippets[selectedLanguage];
            if (!currentCode) {
                throw new Error(`No ${selectedLanguage} code available to run.`);
            }

            // Get the appropriate parse function
            const parseFunction = LANGUAGES[selectedLanguage]?.parseFunction;
            if (!parseFunction) {
                throw new Error(`Running ${selectedLanguage} code is not supported yet.`);
            }

            // Parse the code
            const parsedCode = parseFunction(currentCode);
            if (!parsedCode) {
                throw new Error(`Failed to parse ${selectedLanguage} code.`);
            }

            // Validate URL
            const urlValidation = validateApiUrl(parsedCode.url);
            if (!urlValidation.valid) {
                throw new Error(urlValidation.error);
            }

            // Call the run callback
            if (onRunCode) {
                onRunCode(parsedCode);
            }
        } catch (error) {
            console.error('Failed to run code:', error);
            // You might want to show this error to the user
        }
    }, [selectedLanguage, snippets, onRunCode, LANGUAGES]);

    return (
        <div className="bg-slate-800 border-slate-700 rounded-lg overflow-hidden">
            {isLoading ? (
                <div className="flex items-center justify-center min-h-[224px]">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-400" />
                </div>
            ) : snippets[selectedLanguage] ? (
                <div className="flex flex-col h-full">
                    <Tabs 
                        value={selectedLanguage} 
                        onValueChange={onLanguageChange}
                        className="w-full h-full"
                    >
                        <div className="flex items-center justify-between bg-slate-900 px-2">
                            <TabsList className="bg-transparent border-b border-slate-700">
                                {Object.entries(LANGUAGES).map(([lang, config]) => (
                                    <TabsTrigger 
                                        key={lang}
                                        value={lang}
                                        className="data-[state=active]:bg-slate-800"
                                    >
                                        {config.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopy}
                                    className="text-slate-400 hover:text-white"
                                >
                                    {copied ? (
                                        <CheckCheck className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {Object.entries(LANGUAGES).map(([lang, config]) => (
                            <TabsContent 
                                key={lang}
                                value={lang} 
                                className="p-0 m-0 h-[170px] border-t border-slate-700"
                            >
                                <Textarea
                                    value={snippets[lang] || ''}
                                    onChange={(e) => handleCodeChange(lang, e.target.value)}
                                    className="w-full h-full bg-slate-900 border-0 text-green-400 font-mono text-xs sm:text-sm resize-none focus:ring-0 focus:ring-offset-0 rounded-none"
                                    placeholder={config.placeholder}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>

                    <div className="p-2 bg-slate-900 border-t border-slate-700">
                        <Button
                            onClick={handleRunCode}
                            disabled={isExecuting || !LANGUAGES[selectedLanguage]?.parseFunction}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isExecuting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                'Run Code'
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center min-h-[224px] text-slate-500">
                    No code generated yet
                </div>
            )}
        </div>
    );
};

export default CodeSnippets;
