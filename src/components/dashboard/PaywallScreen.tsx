import { Button } from "@/components/ui/button";

export function PaywallScreen({ centerName }: { centerName: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[var(--background)]">
      <span className="text-5xl mb-4">🔒</span>
      <h1 className="font-lora text-2xl font-bold text-[var(--text)] mb-2">Subscription Required</h1>
      <p className="text-[var(--subtext)] mb-2 max-w-sm">
        <strong className="text-[var(--text)]">{centerName}</strong>&apos;s subscription has expired or payment is overdue.
      </p>
      <p className="text-sm text-[var(--subtext)] mb-8 max-w-sm">
        Renew your subscription to continue managing events, RSVPs, and center information.
      </p>
      <form action="/api/create-portal-session" method="POST">
        <Button type="submit">Renew Subscription</Button>
      </form>
    </div>
  );
}
