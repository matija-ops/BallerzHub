import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/lib/supabase";

type Club = Tables<"clubs">;

type ClubCardProps = {
  club: Club;
};

function ClubCard({ club }: ClubCardProps) {
  return (
    <Link to={`/clubs/${club.id}`} className="block h-full min-w-0">
      <Card className="h-full min-w-0 overflow-hidden transition-colors hover:bg-muted/50">
        <CardContent className="flex h-full min-w-0 gap-4 p-4 sm:p-5">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted sm:size-20">
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={`Logo von ${club.name}`}
                className="size-full object-contain"
              />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                Logo
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base leading-tight font-semibold break-words sm:text-lg">
              {club.name}
            </h2>

            {club.description && (
              <p className="mt-1 text-sm break-words text-muted-foreground">
                {club.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default ClubCard;
