import { useState } from "react";
import { ExternalLink, Navigation } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function DirectionsButton({
  latitude,
  longitude,
  className,
}: DirectionsButtonProps) {
  const [open, setOpen] = useState(false);
  const destination = encodeURIComponent(`${latitude},${longitude}`);
  const providers = [
    {
      name: "Google Maps",
      url: `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
    },
    {
      name: "Apple Maps",
      url: `https://maps.apple.com/?daddr=${destination}&dirflg=d`,
    },
    {
      name: "Waze",
      url: `https://waze.com/ul?ll=${destination}&navigate=yes`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className={className} />}>
        <Navigation className="h-4 w-4" />
        Route starten
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Routenführung auswählen</DialogTitle>
          <DialogDescription>
            Mit welcher App möchtest du zum Court navigieren?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {providers.map((provider) => (
            <a
              key={provider.name}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "lg" })}
              onClick={() => setOpen(false)}
            >
              {provider.name}
              <ExternalLink className="h-4 w-4" />
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
