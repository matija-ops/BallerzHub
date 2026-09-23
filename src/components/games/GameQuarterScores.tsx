import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type GameQuarterScoresProps = {
  homeTeamName: string;
  awayTeamName: string;
};

const dummyQuarterScores = {
  home: [18, 12, 21, 17],
  away: [14, 19, 16, 13],
};

function GameQuarterScores({
  homeTeamName,
  awayTeamName,
}: GameQuarterScoresProps) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-semibold">Viertelergebnisse</h2>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Team</TableHead>
              <TableHead className="text-center">1. Viertel</TableHead>
              <TableHead className="text-center">2. Viertel</TableHead>
              <TableHead className="text-center">3. Viertel</TableHead>
              <TableHead className="text-center">4. Viertel</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{homeTeamName}</TableCell>

              {dummyQuarterScores.home.map((score, index) => (
                <TableCell key={index} className="text-center">
                  {score}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">{awayTeamName}</TableCell>

              {dummyQuarterScores.away.map((score, index) => (
                <TableCell key={index} className="text-center">
                  {score}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default GameQuarterScores;
