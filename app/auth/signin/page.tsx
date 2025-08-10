"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeplrSignIn } from "./KeplrSignIn";
import { useToast } from "@/components/ui/toast";
import { 
  CloudArrowDownIcon, 
  BoltIcon, 
  ShieldCheckIcon,
  CubeIcon,
  SparklesIcon,
  CheckCircleIcon,
  UserCircleIcon,
  ClockIcon,
  ServerIcon
} from "@heroicons/react/24/outline";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'wallet' | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      showToast('Account created successfully! Please sign in.', 'success');
    }
    // Support direct linking to signup
    if (searchParams.get('mode') === 'signup') {
      setMode('signup');
    }
  }, [searchParams, showToast]);

  // Handle email/password sign in
  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
      } else {
        // Sign them in automatically
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        
        if (result?.ok) {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: CloudArrowDownIcon,
      title: "Fast Downloads",
      description: "Download blockchain snapshots at blazing speeds"
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure & Reliable",
      description: "Verified snapshots with data integrity checks"
    },
    {
      icon: CubeIcon,
      title: "Multiple Chains",
      description: "Support for Cosmos, Osmosis, and more"
    }
  ];

  const accountBenefits = [
    {
      icon: UserCircleIcon,
      title: "Personalized Experience",
      description: "Track your download history and preferences"
    },
    {
      icon: BoltIcon,
      title: "Daily Credits",
      description: "Get 5 free downloads every day"
    },
    {
      icon: ClockIcon,
      title: "Priority Access",
      description: "Skip the queue during peak times"
    },
    {
      icon: ServerIcon,
      title: "API Access",
      description: "Programmatic access to snapshots (coming soon)"
    }
  ];

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setError("");
    setAuthMethod(null);
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-12">
          <div className="mb-12">            
            <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
              Blockchain Snapshots
              <span className="block text-3xl mt-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12">
              The fastest way to sync your blockchain nodes. Download verified snapshots with enterprise-grade reliability.
            </p>
          </div>

          {mode === 'signin' ? (
            <>
              <div className="space-y-6 mb-12">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-8">
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    <span>5 Free Downloads Daily</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BoltIcon className="w-5 h-5 text-yellow-400" />
                    <span>Premium: Unlimited</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-white mb-8">
                Why Create an Account?
              </h2>
              <div className="space-y-6">
                {accountBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center group-hover:from-green-500/30 group-hover:to-blue-500/30 transition-colors">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{benefit.title}</h3>
                      <p className="text-gray-400">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right side - Sign in/up form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-gray-900/50">
        <Card className="w-full max-w-md bg-gray-800/50 backdrop-blur-xl border-gray-700 shadow-2xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold text-white">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {mode === 'signin' 
                  ? 'Access your blockchain snapshots' 
                  : 'Start downloading snapshots today'}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            {authMethod === null ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-400 text-center mb-6">
                  {mode === 'signin' ? 'Choose your sign in method' : 'Choose how to create your account'}
                </p>
                
                <button
                  onClick={() => setAuthMethod('email')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-200">Continue with Email</span>
                </button>
                
                <button
                  onClick={() => setAuthMethod('wallet')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="40" rx="8" fill="url(#keplr-gradient)"/>
                    <path d="M20 10L23.09 16.26L30 17.27L25 22.14L26.18 29.02L20 25.77L13.82 29.02L15 22.14L10 17.27L16.91 16.26L20 10Z" fill="white"/>
                    <defs>
                      <linearGradient id="keplr-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6B0BFF"/>
                        <stop offset="1" stopColor="#2B79FF"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-gray-200">Continue with Keplr</span>
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50"
                    disabled
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50"
                    disabled
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </Button>
                </div>
              </div>
            ) : authMethod === 'email' ? (
              <div className="space-y-4">
                <button
                  onClick={() => setAuthMethod(null)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to options
                </button>
                
                {mode === 'signin' ? (
                  <form onSubmit={handleCredentialsSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Username or Email</Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="premium_user or you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-gray-300">Password</Label>
                        <Link href="/auth/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                      <p className="text-sm text-blue-300 font-medium mb-2">Free Account Includes:</p>
                      <ul className="space-y-1 text-sm text-gray-400">
                        <li className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          5 downloads per day
                        </li>
                        <li className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          50 Mbps download speed
                        </li>
                        <li className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          Access to all blockchains
                        </li>
                      </ul>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-2.5"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating account...
                        </span>
                      ) : (
                        "Create Free Account"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setAuthMethod(null)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to options
                </button>
                
                <KeplrSignIn />
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <div className="text-center text-sm">
              <span className="text-gray-400">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {mode === 'signin' ? 'Create free account' : 'Sign in'}
              </button>
            </div>
            
            <div className="text-xs text-center text-gray-500">
              By {mode === 'signin' ? 'signing in' : 'creating an account'}, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-gray-400">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline hover:text-gray-400">Privacy Policy</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}