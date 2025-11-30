import { SignupForm } from '../components/auth/SignupForm';

export function Signup() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <SignupForm />
        </div>
      </div>

      {/* Right side - Promotional */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:bg-blue-600 lg:px-12">
        <div className="text-white">
          <h2 className="text-3xl font-bold">Start your free trial</h2>
          <p className="mt-4 text-lg text-blue-100">
            Join 50+ healthcare contractors using OC Pipeline
          </p>
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="font-semibold">What's included:</h3>
              <ul className="mt-3 space-y-2 text-sm text-blue-100">
                <li>• 3 users included</li>
                <li>• 10 bids per month</li>
                <li>• AI extraction</li>
                <li>• Mobile app access</li>
                <li>• Email support</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-blue-100">
                No credit card required. Upgrade anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
