import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Code, Key, Zap, Upload, Link as LinkIcon, Image, CheckCircle, ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      n: 1,
      title: "Provide Your API Source",
      desc: "TalkAPI understands your API documentation in any format — text, link, or even an image.",
      details: [
        "Paste a URL to your API documentation",
        "Upload a screenshot (OCR extraction)",
        "Type or paste plain text descriptions"
      ],
      icon: Upload,
      badge: "from-blue-600 to-blue-400",
    },
    {
      n: 2,
      title: "Ask Natural Questions",
      desc: "Simply ask what you want in plain language, like \"Get all users from my CRM\" or \"Create a booking for next week\".",
      details: [
        "No need to understand complex API specs",
        "Ask questions as you would to a developer",
        "TalkAPI uses Anthropic Claude to understand your intent"
      ],
      icon: MessageSquare,
      badge: "from-purple-600 to-purple-400",
    },
    {
      n: 3,
      title: "Get Production-Ready Code",
      desc: "Receive clean, optimized code in multiple languages — JavaScript, Python, cURL, and more.",
      details: [
        "Properly formatted request headers",
        "Authentication handled automatically",
        "Copy and use in your projects immediately"
      ],
      icon: Code,
      badge: "from-green-600 to-green-400",
    },
    {
      n: 4,
      title: "Add Your Credentials",
      desc: "Securely insert your API key or authentication credentials into the generated request.",
      details: [
        "Supports API Key, Basic Auth, Bearer tokens",
        "Session-based, never stored or logged",
        "Auto-detects authentication type from docs"
      ],
      icon: Key,
      badge: "from-yellow-600 to-amber-400",
    },
    {
      n: 5,
      title: "Run & Get Instant Results",
      desc: "Execute your API call instantly and view the live response — all without leaving TalkAPI.",
      details: [
        "See real-time API responses",
        "Debug errors with detailed feedback",
        "Test before integrating into your code"
      ],
      icon: Zap,
      badge: "from-pink-600 to-rose-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            How TalkAPI Works
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto mb-8">
            From API docs to ready-to-use code
          </p>
          <div className="inline-block bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-lg px-6 py-4">
            <p className="text-blue-200">
              <strong className="text-white">No Swagger or Postman required</strong> — any readable API doc works
            </p>
          </div>
        </div>

        {/* Steps Section */}
        <div className="space-y-8">
          {steps.map((s, index) => {
            const IconComponent = s.icon;
            return (
              <div key={s.n} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute left-[52px] top-[120px] w-1 h-16 bg-gradient-to-b from-white/30 to-transparent z-0"></div>
                )}

                <Card className="bg-black/40 border-white/10 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
                  <CardHeader className={`bg-gradient-to-r ${s.badge} p-6`}>
                    <CardTitle className="text-white flex items-center gap-4 text-2xl">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl backdrop-blur-sm">
                        {s.n}
                      </div>
                      <IconComponent className="w-8 h-8" />
                      <span>{s.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <p className="text-xl text-gray-200 mb-6 leading-relaxed">{s.desc}</p>
                    <ul className="space-y-3">
                      {s.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your API Workflow?
            </h2>
            <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
              Start with 50 free requests. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg"
                onClick={() => window.location.href = '/'}
              >
                Try TalkAPI Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg border-2 border-emerald-400/30"
                onClick={() => window.location.href = '/pricing'}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-black/30 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <FileText className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Any Format</h3>
            <p className="text-gray-300">URLs, screenshots, or plain text — TalkAPI understands them all</p>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <Zap className="w-10 h-10 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Instant Execution</h3>
            <p className="text-gray-300">Test your API calls in real-time without leaving the platform</p>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <Code className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Multi-Language</h3>
            <p className="text-gray-300">Get code in JavaScript, Python, cURL, and more</p>
          </div>
        </div>
      </div>
    </div>
  );
}
