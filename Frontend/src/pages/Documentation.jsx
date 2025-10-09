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
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                                        <p className="text-blue-200">
                                            <strong>Powered by Anthropic Claude.</strong> URL or image input (OCR), secure auth, live execution, usage counters and Tranzila billing.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Step 0 — Provide Your API Source</h3>
                                        <ul className="space-y-3 mb-4">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                                <div>
                                                    <strong className="text-white">Paste a URL:</strong> Link to your API documentation/reference.
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                                <div>
                                                    <strong className="text-white">Upload an Image:</strong> Screenshot/photo of the docs (OCR extraction).
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                                <div>
                                                    <strong className="text-white">Paste Text:</strong> Raw description of endpoints/parameters/examples.
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                                            <p className="text-green-400 text-sm font-semibold mb-2"># Examples</p>
                                            <CodeBlock>{`# 1) URL
talkapi run --doc "https://your-api.com/docs" --key "YOUR_API_KEY"

# 2) Image
talkapi upload ./api_screenshot.png --extract --run`}</CodeBlock>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Step 1 — Authenticate Before You Run</h3>
                                        <ul className="space-y-2 mb-4">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                API Key (x-api-key / Authorization: Bearer)
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                Username & Password (Basic Auth)
                                            </li>
                                        </ul>
                                        <p className="text-sm text-gray-400 italic">Credentials are stored temporarily for your session only.</p>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Step 2 — Ask or Run (Claude-powered)</h3>
                                        <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                                            <p className="text-blue-300">💬 "Create a booking for tomorrow for 2 adults."</p>
                                            <p className="text-blue-300">💬 "Find hotels in Rome under $150 with breakfast."</p>
                                            <p className="text-blue-300">💬 "Run a POST to /payments and show me the response body."</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Step 3 — Track Usage & Plans</h3>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="bg-slate-800/30 rounded-lg p-4">
                                                <h4 className="font-semibold text-white mb-2">Free</h4>
                                                <p className="text-sm">50 total requests (convert + run)</p>
                                            </div>
                                            <div className="bg-slate-800/30 rounded-lg p-4 border border-blue-500/30">
                                                <h4 className="font-semibold text-blue-300 mb-2">Pro</h4>
                                                <p className="text-sm">500 code generations + 2000 runs</p>
                                            </div>
                                            <div className="bg-slate-800/30 rounded-lg p-4">
                                                <h4 className="font-semibold text-white mb-2">Enterprise</h4>
                                                <p className="text-sm">Custom limits & SLA</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Step 4 — Payments (Tranzila)</h3>
                                        <p className="mb-4">Subscriptions and upgrades are processed via Tranzila (sandbox → live).</p>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Step 5 — View & Export Code</h3>
                                        <ul className="space-y-2 mb-3">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                JavaScript
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                Python
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                cURL
                                            </li>
                                        </ul>
                                        <p className="text-sm text-gray-400 italic">Coming soon: C#, Java, Go.</p>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-3">Anthropic Claude Integration</h3>
                                        <CodeBlock language="python">{`# Python example (server-side)
import anthropic
client = anthropic.Anthropic(api_key="YOUR_ANTHROPIC_KEY")
resp = client.messages.create(
  model="claude-3-opus-20240229",
  messages=[{"role":"user","content":"Generate a GET request for hotel search"}]
)
print(resp.content)`}</CodeBlock>
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
                                        <h3 className="text-lg font-semibold text-white mb-3">Anthropic Claude API (Example)</h3>
                                        <p className="mb-4">
                                            The most comprehensive format that provides the best results. Include endpoints, parameters, request/response schemas, and authentication methods.
                                        </p>
                                        <CodeBlock>{`{
  "openapi": "3.0.0",
  "info": {
    "title": "Anthropic API",
    "version": "1.0.0"
  },
  "paths": {
    "/v1/messages": {
      "post": {
        "summary": "Create message completion",
        "parameters": [],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "model": {
                    "type": "string",
                    "example": "claude-sonnet-4-5-20250929"
                  },
                  "max_tokens": {
                    "type": "integer",
                    "example": 1000
                  },
                  "messages": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "role": { "type": "string" },
                        "content": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful response"
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
                                            <h4 className="font-semibold text-white mb-2">❌ 401 Unauthorized</h4>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Verify API key or username/password are correct</li>
                                                <li>• Check authentication type (Bearer vs Basic Auth vs x-api-key)</li>
                                                <li>• Ensure credentials are not expired</li>
                                            </ul>
                                        </div>

                                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">⚠️ 4xx/5xx Errors</h4>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Check request parameters and body format</li>
                                                <li>• Verify all required headers are included</li>
                                                <li>• Review authentication headers for correct format</li>
                                                <li>• Confirm the endpoint URL is correct</li>
                                            </ul>
                                        </div>

                                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">🚫 Usage Limit Reached</h4>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Wait for monthly reset (1st of each month)</li>
                                                <li>• Upgrade to Pro plan for higher limits</li>
                                                <li>• Contact support for Enterprise custom limits</li>
                                            </ul>
                                        </div>

                                        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">🖼️ OCR Issues</h4>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Upload a clearer screenshot with better resolution</li>
                                                <li>• Ensure text is readable and not blurry</li>
                                                <li>• Try pasting the text directly instead</li>
                                                <li>• Use URL input if documentation is available online</li>
                                            </ul>
                                        </div>

                                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                            <h4 className="font-semibold text-white mb-2">💡 How to Get Better Results</h4>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Be specific in your questions</li>
                                                <li>• Include example data in your API docs</li>
                                                <li>• Mention authentication requirements clearly</li>
                                                <li>• Use complete OpenAPI/Swagger specs when possible</li>
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
                                    <p className="text-center text-gray-400 text-sm mb-6">
                                        Need help? Visit our contact page to get in touch with our support team.
                                    </p>
                                    <div className="flex justify-center">
                                        <Button
                                            size="lg"
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                            onClick={() => window.location.href = '/contact'}
                                        >
                                            <ExternalLink className="w-5 h-5 mr-3" />
                                            Visit Contact Page
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}