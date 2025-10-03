import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    BookOpen, 
    Code, 
    Zap, 
    FileText, 
    Copy, 
    ExternalLink,
    ArrowRight,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

const CodeBlock = ({ children, language = 'javascript' }) => (
    <div className="relative">
        <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{children}</code>
        </pre>
        <Button 
            size="sm" 
            variant="ghost" 
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            onClick={() => navigator.clipboard.writeText(children)}
        >
            <Copy className="w-4 h-4" />
        </Button>
    </div>
);

export default function DocumentationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 py-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                        Documentation
                    </h1>
                    <p className="text-xl text-blue-200 max-w-3xl mx-auto">
                        Everything you need to get started with Talkapi and transform your API workflow
                    </p>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <Card className="bg-black/20 border-white/10 sticky top-6">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Quick Navigation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <a href="#getting-started" className="block text-blue-400 hover:text-blue-300 py-2 px-3 rounded hover:bg-white/5">
                                    Getting Started
                                </a>
                                <a href="#api-formats" className="block text-blue-400 hover:text-blue-300 py-2 px-3 rounded hover:bg-white/5">
                                    Supported API Formats
                                </a>
                                <a href="#examples" className="block text-blue-400 hover:text-blue-300 py-2 px-3 rounded hover:bg-white/5">
                                    Examples
                                </a>
                                <a href="#troubleshooting" className="block text-blue-400 hover:text-blue-300 py-2 px-3 rounded hover:bg-white/5">
                                    Troubleshooting
                                </a>
                                <a href="#api-reference" className="block text-blue-400 hover:text-blue-300 py-2 px-3 rounded hover:bg-white/5">
                                    API Reference
                                </a>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Getting Started */}
                        <section id="getting-started">
                            <Card className="bg-black/20 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Zap className="w-6 h-6 text-green-400" />
                                        Getting Started
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 text-gray-300">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Step 1: Prepare Your API Documentation</h3>
                                        <p className="mb-4">Talkapi works best with structured API documentation. Here's what we support:</p>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                OpenAPI 3.0 Specification (Swagger)
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                Postman Collections (exported as JSON)
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                Plain text API descriptions
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Step 2: Ask Natural Language Questions</h3>
                                        <p className="mb-4">Instead of reading through documentation, just ask what you want to do:</p>
                                        <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                                            <p className="text-blue-300">✅ "Get all users from the database"</p>
                                            <p className="text-blue-300">✅ "Create a new product with name and price"</p>
                                            <p className="text-blue-300">✅ "Search for hotels in London for next weekend"</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Step 3: Get Ready-to-Use Code</h3>
                                        <p className="mb-4">Talkapi generates complete, working code that you can copy and use immediately.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* API Formats */}
                        <section id="api-formats">
                            <Card className="bg-black/20 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <FileText className="w-6 h-6 text-blue-400" />
                                        Supported API Documentation Formats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 text-gray-300">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">OpenAPI 3.0 (Recommended)</h3>
                                        <p className="mb-4">
                                            The most comprehensive format that provides the best results. Include endpoints, parameters, request/response schemas, and authentication methods.
                                        </p>
                                        <CodeBlock>{`{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "Get all users",
        "responses": {
          "200": {
            "description": "List of users"
          }
        }
      }
    }
  }
}`}</CodeBlock>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Postman Collections</h3>
                                        <p className="mb-4">
                                            Export your Postman collection as JSON and paste it directly into Talkapi.
                                        </p>
                                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                            <p className="text-blue-300 text-sm">
                                                💡 <strong>Tip:</strong> In Postman, go to Collections → Export → Collection v2.1 → Export
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Plain Text Documentation</h3>
                                        <p className="mb-4">
                                            Even simple text descriptions work! Just describe your endpoints clearly.
                                        </p>
                                        <CodeBlock>{`GET /api/users - Returns all users
POST /api/users - Creates a new user
  Body: { "name": "string", "email": "string" }
GET /api/users/{id} - Returns user by ID
DELETE /api/users/{id} - Deletes user by ID`}</CodeBlock>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Examples */}
                        <section id="examples">
                            <Card className="bg-black/20 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Code className="w-6 h-6 text-purple-400" />
                                        Common Examples
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 text-gray-300">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-slate-800/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">E-commerce API</h4>
                                            <p className="text-sm text-gray-400 mb-3">Query: "Get all products under $50"</p>
                                            <Badge className="bg-green-600 mb-2">Generated Code:</Badge>
                                            <CodeBlock>{`fetch('/api/products?maxPrice=50', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})`}</CodeBlock>
                                        </div>

                                        <div className="bg-slate-800/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">User Management</h4>
                                            <p className="text-sm text-gray-400 mb-3">Query: "Create a new user account"</p>
                                            <Badge className="bg-blue-600 mb-2">Generated Code:</Badge>
                                            <CodeBlock>{`fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
})`}</CodeBlock>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Troubleshooting */}
                        <section id="troubleshooting">
                            <Card className="bg-black/20 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <AlertCircle className="w-6 h-6 text-yellow-400" />
                                        Troubleshooting
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-gray-300">
                                    <div className="space-y-4">
                                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">❌ "Could not understand API documentation"</h4>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Make sure your JSON is valid (use a JSON validator)</li>
                                                <li>• Include endpoint descriptions and parameter details</li>
                                                <li>• Try using our sample API format as a template</li>
                                            </ul>
                                        </div>

                                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">⚠️ "Generated code doesn't work"</h4>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Replace placeholder values (YOUR_API_KEY, example.com)</li>
                                                <li>• Check if the API requires authentication headers</li>
                                                <li>• Verify the base URL in your documentation</li>
                                            </ul>
                                        </div>

                                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">💡 "How to get better results"</h4>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Be specific in your questions</li>
                                                <li>• Include example data in your API docs</li>
                                                <li>• Mention authentication requirements clearly</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* API Reference */}
                        <section id="api-reference">
                            <Card className="bg-black/20 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <ExternalLink className="w-6 h-6 text-green-400" />
                                        Need More Help?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-gray-300">
                                    <div className="flex justify-center">
                                        <Button 
                                            variant="outline" 
                                            className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
                                            onClick={() => {
                                                const phoneNumber = '+972509058991';
                                                const message = 'Hi! I need help with Talkapi.';
                                                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                                                window.open(whatsappUrl, '_blank');
                                            }}
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                            </svg>
                                            Contact on WhatsApp
                                        </Button>
                                    </div>
                                    <p className="text-center text-gray-400 text-sm">
                                        Need help? Contact our support team directly on WhatsApp for quick assistance.
                                    </p>
                                </CardContent>
                            </Card>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}