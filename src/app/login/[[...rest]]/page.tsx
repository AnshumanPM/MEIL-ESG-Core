import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="bg-primary text-primary-foreground mb-3 flex h-11 w-11 items-center justify-center rounded-lg text-base font-bold">
          M
        </div>
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          MEIL ESG Platform
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          BRSR Principle 6 Greenhouse Gas Accounting
        </p>
      </div>

      <SignIn
        path="/login"
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            card: "border border-border bg-card shadow-sm rounded-lg",
          },
        }}
      />
    </div>
  );
}
