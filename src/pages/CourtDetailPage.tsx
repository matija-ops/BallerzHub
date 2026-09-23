import { useParams } from "react-router-dom";

import CourtDetail from "@/components/courts/CourtDetail";

function CourtDetailPage() {
  const { courtId } = useParams<{ courtId: string }>();

  if (!courtId) {
    return <p>Keine Court-ID angegeben.</p>;
  }

  return <CourtDetail courtId={courtId} />;
}

export default CourtDetailPage;
