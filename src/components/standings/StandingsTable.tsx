import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import type { LeagueStanding } from "@/hooks/standings/useLeagueStandings";

type StandingsTableProps = {
  standings: LeagueStanding[];
};

function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <Card className="mt-4 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Platz</th>

                <th className="px-4 py-3 text-left font-medium">Mannschaft</th>

                <th className="px-4 py-3 text-center font-medium">Sp.</th>

                <th className="px-4 py-3 text-center font-medium">S</th>

                <th className="px-4 py-3 text-center font-medium">N</th>

                <th className="px-4 py-3 text-center font-medium">Pkt.</th>
              </tr>
            </thead>

            <tbody>
              {standings.map((standing) => (
                <tr key={standing.id} className="border-b last:border-b-0">
                  <td className="px-4 py-4 font-semibold">
                    {standing.position}
                  </td>

                  <td className="px-4 py-4">
                    {standing.team ? (
                      <Link
                        to={`/clubs/${standing.team.club_id}/teams/${standing.team.id}`}
                        className="font-medium hover:underline"
                      >
                        {standing.team.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        Mannschaft nicht zugeordnet
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {standing.games_played}
                  </td>

                  <td className="px-4 py-4 text-center">{standing.wins}</td>

                  <td className="px-4 py-4 text-center">{standing.losses}</td>

                  <td className="px-4 py-4 text-center font-semibold">
                    {standing.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default StandingsTable;
