import Link from "next/link";
import { apiJson } from "@/lib/api";
import type { Incident } from "@/lib/types";
import IncidentDisclaimerBanner from "@/components/IncidentDisclaimerBanner";
import IncidentWorkspace from "@/components/IncidentWorkspace";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = await apiJson<Incident>(`/incidents/${id}`);

  return (
    <div style={{ padding: "40px 60px 80px" }}>
      <IncidentDisclaimerBanner />

      {!incident ? (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ marginBottom: 12 }}>
            Incident not found, or you need to be logged in to view it.
          </p>
          <Link href="/incidents" className="btn-secondary">Back to Incidents</Link>
        </div>
      ) : (
        <IncidentWorkspace incident={incident} />
      )}
    </div>
  );
}
