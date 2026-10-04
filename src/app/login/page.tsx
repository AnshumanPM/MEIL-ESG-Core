import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary font-bold text-base text-primary-foreground mb-3">
          M
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          MEIL ESG Platform
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          BRSR Principle 6 Greenhouse Gas Accounting
        </p>
      </div>

      <SignIn
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
