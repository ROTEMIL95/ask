// Frontend/src/pages/HowItWorks.jsx
// אם הנתיב לרכיבי ה-Card אצלך שונה, עדכני את ה-import בהתאם.
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HowItWorksPage() {
  const steps = [
    {
      n: 1,
      title: "Paste Your API Documentation",
      desc:
        "Upload or paste your API documentation (OpenAPI / Swagger). TalkAPI instantly understands endpoints, parameters, and authentication.",
      badge: "from-blue-600 to-blue-400",
    },
    {
      n: 2,
      title: "Ask Your Question",
      desc:
        "Describe what you want in plain language. Example: “Get all available hotels in Paris for the weekend”.",
      badge: "from-purple-600 to-purple-400",
    },
    {
      n: 3,
      title: "Get Ready‑to‑Use Code",
      desc:
        "Receive clean, optimized code in multiple languages — ready to copy & run.",
      badge: "from-green-600 to-green-400",
    },
    {
      n: 4,
      title: "Add Your API Key",
      desc:
        "Insert your personal API key securely into the generated request.",
      badge: "from-yellow-600 to-amber-400",
    },
    {
      n: 5,
      title: "Run & Get Results",
      desc:
        "Execute instantly and view the live response from your API — no guesswork.",
      badge: "from-pink-600 to-rose-500",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold text-white text-center">How TalkAPI Works</h1>
      <p className="text-gray-300 text-center mt-2 mb-10">
        From API docs to ready‑to‑use answers — in seconds.
      </p>

      <div className="space-y-6">
        {steps.map((s) => (
          <Card
            key={s.n}
            className="bg-[#0B1535] border border-white/10 rounded-xl overflow-hidden shadow-lg"
          >
            <CardHeader className={`bg-gradient-to-r ${s.badge}`}>
              <CardTitle className="text-white flex items-center gap-3 text-xl">
                <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {s.n}
                </span>
                {s.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-200">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA כללית לתחתית העמוד (אופציונלי) */}
      <div className="text-center mt-10">
        <a
          href="/pricing"
          className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition"
        >
          Try TalkAPI Free
        </a>
      </div>
    </div>
  );
}
