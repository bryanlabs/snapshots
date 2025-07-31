export const dynamic = 'force-dynamic';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error || "Authentication error";

  const errorMessages: { [key: string]: string } = {
    Configuration: "There was a problem with the authentication configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification token has expired or has already been used.",
    Default: "An error occurred during authentication.",
  };

  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {errorMessage}
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <a
            href="/auth/signin"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-gray-50 hover:bg-gray-900/90 h-10 px-4 py-2"
          >
            Try Again
          </a>
        </div>
      </div>
    </div>
  );
}