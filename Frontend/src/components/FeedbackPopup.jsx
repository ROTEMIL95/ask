import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Send, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userProfile } from '@/lib/supabase';
import { submitFeedback } from '@/api/askApi';

export function FeedbackPopup({ open, onClose, onFeedbackSubmitted }) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setIsSubmitting(true);

        try {
            // Send feedback to backend
            const response = await submitFeedback({
                rating,
                feedback,
                email: email || user?.email,
                userId: user?.id
            });

            // Reward user with 5 more API calls (only for registered users)
            if (user && user.id) {
                const { data: profile, error: profileError } = await userProfile.getProfile(user.id);
                
                if (!profileError && profile) {
                    const currentCalls = profile.api_calls_today || 0;
                    // Give 5 more calls by reducing the count (since count represents used calls)
                    const newCalls = Math.max(0, currentCalls - 5);
                    
                    // Update profile with bonus calls and last feedback date
                    await userProfile.updateProfile(user.id, {
                        api_calls_today: newCalls,
                        last_feedback: new Date().toISOString()
                    });
                }
            }

            setSubmitted(true);
            setTimeout(() => {
                onFeedbackSubmitted?.();
                onClose();
                setSubmitted(false);
                setRating(0);
                setFeedback('');
                setEmail('');
            }, 2000);
        } catch (error) {

            alert('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitted) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white mx-4 max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Gift className="w-5 h-5 text-yellow-500" />
                        {submitted ? 'Thank You!' : 'Help Us Improve'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                        {submitted 
                            ? user && user.id 
                                ? 'Your feedback has been submitted! You\'ve earned 5 more API calls.'
                                : 'Your feedback has been submitted! Thank you for your input.'
                            : 'Share your experience and help us improve!'
                        }
                    </DialogDescription>
                </DialogHeader>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        {/* Rating */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">How would you rate your experience?</Label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`p-1 transition-colors ${
                                            star <= rating ? 'text-yellow-500' : 'text-gray-400'
                                        }`}
                                    >
                                        <Star className="w-6 h-6" fill={star <= rating ? 'currentColor' : 'none'} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feedback */}
                        <div className="space-y-2">
                            <Label htmlFor="feedback" className="text-gray-300">
                                What could we improve? (Optional)
                            </Label>
                            <Textarea
                                id="feedback"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Share your thoughts..."
                                className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
                                rows={3}
                            />
                        </div>

                        {/* Email (if not logged in) */}
                        {!user && (
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-300">
                                    Email (Optional)
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Send className="w-4 h-4 animate-spin mr-2" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Gift className="w-4 h-4 mr-2" />
                                    {user && user.id ? 'Submit & Get 5 Bonus Calls' : 'Submit Feedback'}
                                </>
                            )}
                        </Button>
                    </form>
                ) : (
                    <div className="text-center py-4">
                        <Gift className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <p className="text-green-300">
                            {user && user.id 
                                ? 'You\'ve earned 5 more API calls!' 
                                : 'Thank you for your feedback!'
                            }
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
} 