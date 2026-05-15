'use client'
import { SignUp } from '@clerk/react'
import React from 'react'

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-purple-600 hover:bg-purple-700 text-sm normal-case transition-colors shadow-md',
            card: 'shadow-xl shadow-purple-500/10 rounded-2xl border border-purple-100 bg-white/80 backdrop-blur-sm',
            headerTitle: 'text-gray-900',
            headerSubtitle: 'text-gray-500',
            socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50 transition-colors',
            dividerLine: 'bg-gray-200',
            dividerText: 'text-gray-500',
            formFieldInput: 'rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent',
            formFieldLabel: 'text-gray-700',
            footerActionLink: 'text-purple-600 hover:text-purple-700 font-medium'
          }
        }}
      />
    </div>
  )
}

export default Signup
