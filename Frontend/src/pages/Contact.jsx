import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { sendContactEmail } from '@/api/askApi';
import SEO from '@/components/SEO';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const openMailtoFallback = () => {
        const mailtoLink = `mailto:rotemiluz53@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
            `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
        )}`;
        window.location.href = mailtoLink;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage({ type: '', text: '' });

        try {
            // Try SMTP first
            const result = await sendContactEmail(formData);

            if (result.success) {
                setStatusMessage({
                    type: 'success',
                    text: 'Email sent successfully! We\'ll get back to you soon.'
                });
                // Reset form on success
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                // SMTP failed, use mailto fallback
                setStatusMessage({
                    type: 'info',
                    text: 'Opening your email client...'
                });
                openMailtoFallback();
                // Reset form after a delay
                setTimeout(() => {
                    setFormData({ name: '', email: '', subject: '', message: '' });
                    setStatusMessage({ type: '', text: '' });
                }, 2000);
            }
        } catch (error) {
            // On any error, fall back to mailto
            setStatusMessage({
                type: 'info',
                text: 'Opening your email client as fallback...'
            });
            openMailtoFallback();
            setTimeout(() => {
                setFormData({ name: '', email: '', subject: '', message: '' });
                setStatusMessage({ type: '', text: '' });
            }, 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <>
            <SEO
                title="Contact Us - TalkAPI Support"
                description="Get in touch with TalkAPI support team. We're here to help with API integration, technical questions, and enterprise solutions."
                keywords="contact TalkAPI, API support, customer service, technical support, enterprise solutions"
                canonicalUrl="/contact"
            />
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
                    <p className="text-xl text-blue-200">We'd love to hear from you. Get in touch with our team.</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <Card className="bg-black/20 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Send className="w-6 h-6 text-blue-400" />
                                Send us a Message
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            Full Name
                                        </label>
                                        <Input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            Email Address
                                        </label>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Subject
                                    </label>
                                    <Input
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder="What's this about?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Message
                                    </label>
                                    <Textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder="Tell us how we can help you..."
                                    />
                                </div>

                                {statusMessage.text && (
                                    <div className={`p-4 rounded-lg ${
                                        statusMessage.type === 'success'
                                            ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                                            : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                                    }`}>
                                        {statusMessage.text}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5 mr-2" />
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <div className="space-y-8">
                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Mail className="w-6 h-6 text-green-400" />
                                    Get in Touch
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <Mail className="w-6 h-6 text-blue-400 mt-1" />
                                    <div>
                                        <h3 className="text-white font-semibold">Email Support</h3>
                                        <p className="text-gray-300">office@1000-2000.com</p>
                                        <p className="text-gray-400 text-sm">We typically respond within 24 hours</p>
                                    </div>
                                </div>


                                <div className="flex items-start gap-4">
                                    <MapPin className="w-6 h-6 text-purple-400 mt-1" />
                                    <div>
                                        <h3 className="text-white font-semibold">Office</h3>
                                        <p className="text-gray-300">Tel Aviv, IL</p>
                                        <p className="text-gray-400 text-sm">Remote-first team</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Clock className="w-6 h-6 text-yellow-400 mt-1" />
                                    <div>
                                        <h3 className="text-white font-semibold">Business Hours</h3>
                                        <p className="text-gray-300">Monday - Friday: 9AM - 6PM PST</p>
                                        <p className="text-gray-400 text-sm">24/7 support for Pro customers</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-center">
                            <h3 className="text-white font-bold text-xl mb-2">Enterprise Customer?</h3>
                            <p className="text-blue-100 mb-4">
                                Contact our sales team for dedicated support and custom solutions.
                            </p>
                            <Button
                                            size="sm"
                                            className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                            onClick={() => window.open('https://wa.me/972509058991', '_blank')}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Chat on WhatsApp
                                        </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}