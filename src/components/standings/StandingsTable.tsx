import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LeagueStanding } from "@/hooks/standings/useLeagueStandings";

type StandingsTableProps = {
  standings: LeagueStanding[];
};

function StandingsTable({ standings }: StandingsTableProps) {
  const navigate = useNavigate();

  return (
    <Card className="mt-4 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] table-fixed text-sm">
            <colgroup>
              <col className="w-16" />
              <col className="w-[52%]" />
              <col />
              <col />
              <col />
              <col />
            </colgroup>

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
                      standing.team.website_url ? (
                        <a
                          href={standing.team.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {standing.team.name}
                        </a>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            navigate(
                              `/clubs/${standing.team!.club_id}/teams/${standing.team!.id}`
                            )
                          }
                          className="h-auto w-full justify-start px-0 text-left whitespace-normal text-primary hover:bg-primary/10"
                        >
                          {standing.team.name}
                        </Button>
                      )
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
