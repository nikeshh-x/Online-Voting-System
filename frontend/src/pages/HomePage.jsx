import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Vote, BarChart3, Smartphone, ArrowRight, CheckCircle } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Secure Voting',
      description: 'Blockchain-verified votes with complete transparency and security.',
      color: 'bg-blue-500'
    },
    {
      icon: Vote,
      title: 'Easy Voting',
      description: 'Cast your vote from anywhere using your citizenship number.',
      color: 'bg-green-500'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Results',
      description: 'Live vote counting and instant result updates.',
      color: 'bg-purple-500'
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Vote from your phone, tablet, or computer.',
      color: 'bg-orange-500'
    }
  ];

  const steps = [
    { step: '1', title: 'Register', description: 'Create an account with your citizenship number' },
    { step: '2', title: 'Verify', description: 'Verify your email address' },
    { step: '3', title: 'Vote', description: 'Cast your vote in active elections' },
    { step: '4', title: 'Results', description: 'View real-time election results' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <ShieldCheck className="h-16 w-16 text-primary-400" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Online Voting System
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Secure, transparent, and accessible voting for all eligible citizens.
              Vote from anywhere with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition inline-flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="border border-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition inline-flex items-center justify-center"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our System?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Modern, secure, and transparent voting platform designed for the digital age
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition">
                  <div className={`${feature.color} w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to cast your vote securely
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-12 h-12 bg-primary-500 text-black rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-500 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Vote?</h2>
          <p className="text-primary-100 mb-8">
            Join thousands of citizens who have already registered
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-500 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition inline-flex items-center gap-2"
          >
            Register Now
            <CheckCircle size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;