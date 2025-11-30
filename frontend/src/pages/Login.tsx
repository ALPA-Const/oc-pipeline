import { LoginForm } from '../components/auth/LoginForm';

export function Login() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <LoginForm />
        </div>
      </div>

      {/* Right side - Promotional */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:bg-blue-600 lg:px-12">
        <div className="text-white">
          <h2 className="text-3xl font-bold">Welcome to OC Pipeline</h2>
          <p className="mt-4 text-lg text-blue-100">
            AI-powered construction bid software for healthcare contractors
          </p>
          <ul className="mt-8 space-y-4">
            <li className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500 p-1">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Reduce bid creation time by 75%</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500 p-1">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>AI-powered extraction (94% accuracy)</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500 p-1">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Mobile-first design</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
