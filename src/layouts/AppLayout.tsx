import { useState } from "react";
import { Outlet } from "react-router-dom";

import AppNavigation from "@/components/navigation/AppNavigation";

function AppLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AppNavigation
        isOpen={isNavigationOpen}
        onOpenChange={setIsNavigationOpen}
      />

      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;
