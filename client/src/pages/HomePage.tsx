import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { FileText, Zap, Shield, BarChart3, Clock, AlertCircle } from 'lucide-react'

export const HomePage = () => {
  const [, navigate] = useLocation()
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      description: 'Instantly analyze contracts using advanced GPT-4 technology',
    },
    {
      icon: Shield,
      title: 'Risk Detection',
      description: 'Automatically identify potential risks and unfavorable terms',
    },
    {
      icon: Clock,
      title: 'Key Dates',
      description: 'Never miss important deadlines and renewal dates',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Get comprehensive insights across all your contracts',
    },
    {
      icon: FileText,
      title: 'Multi-Format Support',
      description: 'Upload PDFs, Word docs, and text files',
    },
    {
      icon: AlertCircle,
      title: 'Smart Alerts',
      description: 'Get notified about important contract milestones',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            LexiSense
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button onClick={() => navigate('/dashboard')} variant="default">
                  Dashboard
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/login')} className="bg-indigo-600 hover:bg-indigo-700">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Master Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Contracts</span> with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            LexiSense uses advanced AI to analyze contracts instantly. Uncover hidden risks, understand key terms, and stay on top of important dates—all in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8"
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-gray-300"
                >
                  Watch Demo
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            Everything you need to manage contracts efficiently
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const IconComponent = feature.icon
              return (
                <Card key={feature.title} className="p-8 hover:shadow-lg transition-shadow border-0 bg-white">
                  <div className="mb-4 inline-block p-3 bg-indigo-100 rounded-lg">
                    <IconComponent className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Choose LexiSense?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600">
                      <check className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Save Hours on Review</h3>
                    <p className="text-gray-600 mt-2">
                      Get AI-powered summaries instead of reading lengthy contracts
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600">
                      <check className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Identify Risks Early</h3>
                    <p className="text-gray-600 mt-2">
                      Spot problematic clauses and unfavorable terms automatically
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600">
                      <check className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Central Repository</h3>
                    <p className="text-gray-600 mt-2">
                      Keep all contracts organized and searchable in one place
                    </p>
                  </div>
                </div>
              </div>

              {!isAuthenticated && (
                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="mt-8 bg-indigo-600 hover:bg-indigo-700"
                >
                  Start Analyzing
                </Button>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-12 h-80 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-24 h-24 text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 text-lg mb-12">
            Start free, upgrade when you need to
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: 'Free', contracts: '5', description: 'Perfect for getting started' },
              { name: 'Professional', price: '$29', contracts: 'Unlimited', description: 'For busy teams', highlighted: true },
              { name: 'Enterprise', price: 'Custom', contracts: 'Unlimited', description: 'For large organizations' },
            ].map((plan) => (
              <Card
                key={plan.name}
                className={`p-8 ${plan.highlighted ? 'border-2 border-indigo-600 ring-1 ring-indigo-100' : 'border-0'}`}
              >
                {plan.highlighted && (
                  <div className="bg-indigo-600 text-white text-sm font-semibold py-1 px-3 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">{plan.price}</div>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6 text-gray-600">
                  <p className="font-semibold mb-2">{plan.contracts} contracts</p>
                  <p className="text-sm">AI analysis included</p>
                </div>
                <Button
                  onClick={() => navigate('/login')}
                  className={`w-full ${plan.highlighted ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-gray-300'}`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Master Your Contracts?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join teams already using LexiSense to save time and reduce legal risks
          </p>
          {!isAuthenticated && (
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              Start for Free
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">LexiSense</div>
              <p className="text-sm">AI-powered contract analysis for modern teams</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              © 2026 LexiSense. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper check icon component
function check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}