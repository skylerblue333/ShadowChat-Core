import { useMemo } from "react";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SignUp() {
  const loginUrl = useMemo(() => {
    try {
      return getLoginUrl();
    } catch {
      return null;
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">ShadowChat</p>
          <h1 className="text-4xl font-semibold tracking-tight">Create your account through the configured sign-in provider</h1>
          <p className="text-slate-300">
            ShadowChat does not create local passwords in this application. Account identity and session issuance are handled by the configured OAuth provider.
          </p>
        </header>

        <Card className="border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
          {loginUrl ? (
            <Button asChild className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              <a href={loginUrl}>Continue to secure sign-in</a>
            </Button>
          ) : (
            <div className="space-y-3 rounded-md border border-amber-500/40 bg-amber-950/20 p-4 text-sm text-amber-100">
              <p className="font-medium">Sign-in is not configured for this deployment.</p>
              <p>Set the public OAuth portal URL and application ID before inviting users. No account or session is created in this state.</p>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-slate-500">
          ShadowChat will only show authenticated data after the provider callback establishes a verified session cookie.
        </p>
      </div>
    </main>
  );
}
