import GlowingButton from "@/components/LandingPage/GlowingButton";
import { CheckCircle } from "lucide-react";
import React from "react";

const App = () => {
  return (
    <div className="space-y-10 mt-24 max-w-4xl mx-auto">
      <div className="bg-green-500/10 max-w-xl mx-auto my-8 border border-green-500/20 rounded-xl p-4 text-green-400">
        <div className="flex items-center justify-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <p>Subscription cancelled! We&apos;re sad to let you go.</p>
        </div>
      </div>
      <GlowingButton text="Manage your subscription" href="/dashboard"/>
    </div>
  );
};

export default App;
