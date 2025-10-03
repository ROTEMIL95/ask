import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Copy, CheckCheck, Upload } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

/**
 * Component for handling API documentation input with validation and feedback
 */
export default function ApiDocumentationInput({
    apiDoc,
    onApiDocChange,
    onFileUpload,
    onImageUpload,
    isFileProcessing,
    isOcrProcessing,
    uploadedFile,
    ocrText,
    onClearAll,
    onSelectPublicApi,
    className = ''
}) {
    const [copiedApiDoc, setCopiedApiDoc] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Handle API doc copy
    const handleCopyApiDoc = useCallback(async () => {
        if (apiDoc) {
            try {
                await navigator.clipboard.writeText(apiDoc);
                setCopiedApiDoc(true);
                setTimeout(() => setCopiedApiDoc(false), 2000);
            } catch (err) {
                console.error('Failed to copy API doc: ', err);
            }
        }
    }, [apiDoc]);

    // Validate API documentation
    const validateApiDoc = useCallback((doc) => {
        if (!doc) {
            setValidationError('');
            return true;
        }

        // Check if it's a URL
        if (doc.startsWith('http')) {
            try {
                new URL(doc);
                setValidationError('');
                return true;
            } catch (e) {
                setValidationError('Invalid URL format');
                return false;
            }
        }

        // Check if it's JSON
        try {
            JSON.parse(doc);
            setValidationError('');
            return true;
        } catch (e) {
            // Not JSON, check if it's OpenAPI/Swagger format
            if (doc.includes('openapi:') || doc.includes('swagger:')) {
                setValidationError('');
                return true;
            }
        }

        // Check minimum content
        if (doc.length < 50) {
            setValidationError('API documentation seems too short. Please provide more details.');
            return false;
        }

        setValidationError('');
        return true;
    }, []);

    // Handle API doc change with validation
    const handleApiDocChange = useCallback((e) => {
        const newDoc = e.target.value;
        validateApiDoc(newDoc);
        onApiDocChange(newDoc);
    }, [onApiDocChange, validateApiDoc]);

    // Handle file upload
    const handleFileUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setValidationError('File size exceeds 10MB limit');
                return;
            }

            // Check file type
            const allowedTypes = [
                'application/json',
                'text/plain',
                'text/markdown',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ];
            if (!allowedTypes.includes(file.type)) {
                setValidationError('Unsupported file type. Please upload JSON, text, PDF, Word, Excel, or PowerPoint files.');
                return;
            }

            setValidationError('');
            onFileUpload(e);
        }
    }, [onFileUpload]);

    // Handle image upload
    const handleImageUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setValidationError('Image size exceeds 5MB limit');
                return;
            }

            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setValidationError('Unsupported image type. Please upload JPEG, PNG, GIF, or WebP images.');
                return;
            }

            setValidationError('');
            onImageUpload(e);
        }
    }, [onImageUpload]);

    return (
        <div className={className}>
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
                    onChange={handleApiDocChange}
                    placeholder="Paste your OpenAPI/Swagger documentation here..."
                    className="min-h-[150px] bg-slate-800 border-slate-700 text-base sm:text-lg"
                />
                {(isFileProcessing || isOcrProcessing) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <div className="flex flex-col items-center gap-2 text-white">
                            <Upload className="w-5 h-5 animate-bounce" />
                            <span className="text-sm">Processing File...</span>
                        </div>
                    </div>
                )}
            </div>

            {validationError && (
                <Alert variant="destructive" className="mt-2">
                    <AlertTitle>Validation Error</AlertTitle>
                    <AlertDescription>{validationError}</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3">
                <Button 
                    variant="link" 
                    className="p-0 h-auto text-green-400 text-sm justify-start" 
                    onClick={onSelectPublicApi}
                >
                    🔘 Select Public API
                </Button>
                <div className="relative group">
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.json,.xml,.csv,.md,.rtf,.odt,.ods,.odp,.ppt,.pptx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="file-upload"
                    />
                    <label 
                        htmlFor="file-upload"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
                    >
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
                    />
                    <label 
                        htmlFor="image-upload"
                        className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm cursor-pointer"
                    >
                        {isOcrProcessing ? (
                            <Upload className="w-4 h-4 flex-shrink-0 animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4 flex-shrink-0" />
                        )}
                        {isOcrProcessing ? 'Processing OCR...' : 'Upload Image'}
                    </label>
                </div>
                <Button 
                    variant="link" 
                    className="p-0 h-auto text-red-400 hover:text-red-300 text-sm justify-start" 
                    onClick={onClearAll}
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
        </div>
    );
}
