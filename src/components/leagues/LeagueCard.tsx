import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/lib/supabase";

type League = Tables<"leagues">;

type LeagueCardProps = {
  league: League;
};

function LeagueCard({ league }: LeagueCardProps) {
  return (
    <Link to={`/leagues/${league.id}`} className="block h-full">
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold">{league.name}</h2>

          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {league.season && (
              <p>
                <span className="font-medium text-foreground">Saison:</span>{" "}
                {league.season}
              </p>
            )}

            {league.age_group && (
              <p>
                <span className="font-medium text-foreground">
                  Altersklasse:
                </span>{" "}
                {league.age_group}
              </p>
            )}

            {league.division && (
              <p>
                <span className="font-medium text-foreground">
                  Spielklasse:
                </span>{" "}
                {league.division}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default LeagueCard;
