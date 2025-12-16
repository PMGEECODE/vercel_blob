import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Server, Shield, Smartphone } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            <Server className="h-4 w-4" />
            API Server Online
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-5xl font-bold text-transparent">
            Vercel Blob Storage API
          </h1>
          <p className="text-balance text-lg text-slate-400">
            Secure REST API for file storage operations with mobile app integration
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-8 border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Server Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Status</div>
                <div className="mt-1 text-xl font-semibold text-emerald-400">Active</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Version</div>
                <div className="mt-1 text-xl font-semibold text-white">1.0.0</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Uptime</div>
                <div className="mt-1 text-xl font-semibold text-white">99.9%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Overview */}
        <Card className="mb-8 border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">Available Endpoints</CardTitle>
            <CardDescription className="text-slate-400">
              RESTful API endpoints for file management operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <code className="text-sm font-semibold text-emerald-400">POST /api/upload</code>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">Upload</span>
                </div>
                <p className="text-sm text-slate-400">Upload files to blob storage (multipart/form-data)</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <code className="text-sm font-semibold text-emerald-400">GET /api/list</code>
                  <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-400">Read</span>
                </div>
                <p className="text-sm text-slate-400">List all files stored in blob storage</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <code className="text-sm font-semibold text-emerald-400">DELETE /api/delete</code>
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400">Delete</span>
                </div>
                <p className="text-sm text-slate-400">Delete files from blob storage by URL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Authentication */}
        <Card className="mb-8 border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-amber-500" />
              Authentication Required
            </CardTitle>
            <CardDescription className="text-slate-400">All endpoints require API key authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <h4 className="mb-2 font-semibold text-amber-400">Header Required</h4>
                <code className="block rounded bg-slate-950 p-3 text-sm text-slate-300">
                  x-api-key: YOUR_API_KEY_HERE
                </code>
              </div>

              <div className="space-y-2 text-sm text-slate-400">
                <p>
                  <strong className="text-white">Security Notes:</strong>
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Never share your API key publicly or commit it to version control</li>
                  <li>Store API keys securely in environment variables</li>
                  <li>Use encrypted storage for API keys in mobile applications</li>
                  <li>Rotate API keys regularly for enhanced security</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Integration */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Smartphone className="h-5 w-5 text-blue-500" />
              Mobile App Integration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Complete guides for integrating with mobile applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/FLUTTER_DOCUMENTATION.md"
                className="block rounded-lg border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:border-blue-500/50 hover:bg-slate-950"
              >
                <div className="mb-1 font-semibold text-blue-400">Flutter/Dart Integration Guide</div>
                <div className="text-sm text-slate-400">
                  Complete implementation with http package, models, and examples
                </div>
              </a>

              <a
                href="/API_DOCUMENTATION.md"
                className="block rounded-lg border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:border-blue-500/50 hover:bg-slate-950"
              >
                <div className="mb-1 font-semibold text-blue-400">API Documentation</div>
                <div className="text-sm text-slate-400">Full API reference with request/response examples</div>
              </a>
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <h4 className="mb-3 font-semibold text-white">Quick Start Example</h4>
              <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
                <code>{`// Flutter Example
final response = await http.get(
  Uri.parse('https://your-api.vercel.app/api/list'),
  headers: {'x-api-key': 'YOUR_API_KEY'},
);

if (response.statusCode == 200) {
  final data = json.decode(response.body);
  print(data['blobs']);
}`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Powered by Vercel Blob Storage • Secure • Scalable • Fast</p>
        </div>
      </div>
    </main>
  )
}
