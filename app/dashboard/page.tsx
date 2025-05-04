import RedirectComponent from "@/components/RedirectComponent";
import DashboardContent from "./_components/DashboardContent";
import { checkAuthenticationAndSubscription } from "@/lib/checkAuthSubscription";
import React from "react";

const Dashboard = async () => {
  try {
    const authCheck = await checkAuthenticationAndSubscription();
    if (authCheck.redirectTo) {
      return <RedirectComponent to={authCheck.redirectTo} />;
    }

    return <DashboardContent />;
  } catch (error) {
    console.error("Error in dashboard page:", error);
    return <RedirectComponent to="/" />;
  }
};

export default Dashboard;
