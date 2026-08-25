import RedirectComponent from "@/components/RedirectComponent";
import DashboardContent from "./_components/DashboardContent";
import { checkAuthenticationAndSubscription } from "@/lib/checkAuthSubscription";
import React from "react";

const Dashboard = async () => {
  // Deliberately not wrapped in try/catch: `checkAuthenticationAndSubscription`
  // already handles its own database failures, and catching here would swallow
  // the control-flow signals Next throws for dynamic rendering and redirects.
  const authCheck = await checkAuthenticationAndSubscription();

  if (authCheck.redirectTo) {
    return <RedirectComponent to={authCheck.redirectTo} />;
  }

  return <DashboardContent />;
};

export default Dashboard;
