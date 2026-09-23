import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

type NavigationTriggerProps = {
  onClick: () => void;
};

function NavigationTrigger({ onClick }: NavigationTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      onClick={onClick}
      aria-label="Navigation öffnen"
      className="size-12 rounded-xl border-border/80 bg-white shadow-md hover:bg-white"
    >
      <Menu className="size-5" />
    </Button>
  );
}

export default NavigationTrigger;
