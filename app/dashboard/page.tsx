import RedirectComponent from "@/components/RedirectComponent";
import PaywallPanel from "@/components/PaywallPanel";
import DashboardContent from "./_components/DashboardContent";
import { checkAuthenticationAndSubscription } from "@/lib/checkAuthSubscription";
import React from "react";

const Dashboard = async () => {
  // Deliberately not wrapped in try/catch: `checkAuthenticationAndSubscription`
  // already handles its own database failures, and catching here would swallow
  // the control-flow signals Next throws for dynamic rendering and redirects.
  const authCheck = await checkAuthenticationAndSubscription();

  if (!authCheck.isAuthenticated) {
    return <RedirectComponent to="/sign-in?redirect_url=/dashboard" />;
  }

  // Signed in without a plan lands on the paywall rather than being bounced to
  // /pricing, so the reason for the redirect is visible where it happened.
  if (!authCheck.hasSubscription) {
    return <PaywallPanel />;
  }

  return <DashboardContent />;
};

export default Dashboard;
