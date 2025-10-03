import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Copy, CheckCheck, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

/**
 * Component for handling user question input with validation and feedback
 */
export default function QuestionInput({
    question,
    onQuestionChange,
    onGenerateCode,
    isLoading,
    isDisabled,
    className = ''
}) {
    const [copiedQuestion, setCopiedQuestion] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Handle question copy
    const handleCopyQuestion = useCallback(async () => {
        if (question) {
            try {
                await navigator.clipboard.writeText(question);
                setCopiedQuestion(true);
                setTimeout(() => setCopiedQuestion(false), 2000);
            } catch (err) {
                console.error('Failed to copy question: ', err);
            }
        }
    }, [question]);

    // Validate question
    const validateQuestion = useCallback((q) => {
        if (!q) {
            setValidationError('');
            return true;
        }

        // Check minimum length
        if (q.length < 10) {
            setValidationError('Question is too short. Please provide more details.');
            return false;
        }

        // Check if it's a question
        if (!q.includes('?') && !q.toLowerCase().startsWith('how') && !q.toLowerCase().startsWith('what') && !q.toLowerCase().startsWith('where') && !q.toLowerCase().startsWith('when') && !q.toLowerCase().startsWith('why')) {
            setValidationError('Please phrase your input as a question.');
            return false;
        }

        setValidationError('');
        return true;
    }, []);

    // Handle question change with validation
    const handleQuestionChange = useCallback((e) => {
        const newQuestion = e.target.value;
        validateQuestion(newQuestion);
        onQuestionChange(newQuestion);
    }, [onQuestionChange, validateQuestion]);

    // Handle generate code with validation
    const handleGenerateCode = useCallback(() => {
        if (!question) {
            setValidationError('Please enter a question.');
            return;
        }

        if (!validateQuestion(question)) {
            return;
        }

        onGenerateCode();
    }, [question, validateQuestion, onGenerateCode]);

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-white">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                    <span className="break-words">2. Ask Your API Assistant</span>
                </label>
                {question && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyQuestion}
                        className="flex items-center gap-2 border-purple-400 text-gray-800 hover:bg-purple-400 hover:text-black text-sm"
                    >
                        {copiedQuestion ? <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                        {copiedQuestion ? 'Copied!' : 'Copy'}
                    </Button>
                )}
            </div>

            <Input
                value={question}
                onChange={handleQuestionChange}
                placeholder="e.g., How can I get hotel availability in Paris?"
                className="bg-slate-800 border-slate-700 text-base sm:text-lg"
            />

            {validationError && (
                <Alert variant="destructive" className="mt-2">
                    <AlertTitle>Validation Error</AlertTitle>
                    <AlertDescription>{validationError}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2 mt-4">
                <Button 
                    onClick={handleGenerateCode}
                    size="lg" 
                    className="w-full text-base sm:text-lg bg-blue-600 hover:bg-blue-700 py-4 sm:py-6" 
                    disabled={isLoading || isDisabled || !!validationError}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                            Generating...
                        </>
                    ) : (
                        'Generate Talkapi 🚀'
                    )}
                </Button>
            </div>
        </div>
    );
}
