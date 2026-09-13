import PaywallPanel from "@/components/paywall-panel";
import RedirectComponent from "@/components/redirect-component";
import { checkAuthenticationAndSubscription } from "@/lib/check-auth-subscription";
import DashboardContent from "./_components/dashboard-content";

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
