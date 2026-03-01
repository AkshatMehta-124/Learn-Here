import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Globe, MessageSquare, Trophy, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <main>
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Master any language with <span className="text-indigo-600">AI</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Learn Here is your personalized AI language tutor. Practice real conversations, take interactive lessons, and level up your skills faster than ever.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/register"
                  className="rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
                >
                  Start Learning Free
                </Link>
                <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">
                  Log in <span aria-hidden="true">→</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Learn Faster</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to become fluent
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                {[
                  {
                    name: 'AI Conversations',
                    description: 'Practice speaking with our advanced AI tutor. Get instant grammar corrections and fluency scores.',
                    icon: MessageSquare,
                  },
                  {
                    name: '25+ Languages',
                    description: 'From Spanish to Japanese, learn the worlds most popular languages with structured lessons.',
                    icon: Globe,
                  },
                  {
                    name: 'Gamified Learning',
                    description: 'Earn XP, level up, and maintain your daily streak to stay motivated on your journey.',
                    icon: Trophy,
                  },
                  {
                    name: 'Instant Feedback',
                    description: 'No more waiting. Get real-time corrections on your pronunciation and sentence structure.',
                    icon: Zap,
                  },
                ].map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                      <feature.icon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
