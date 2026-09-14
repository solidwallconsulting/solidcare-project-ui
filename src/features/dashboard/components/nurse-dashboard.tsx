import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/layout/page-header";
import { EmptyState } from "@/shared/components/feedback/states";

/** Stub pour le rôle infirmier — à enrichir avec les tâches de soins. */
export function NurseDashboard() {
  return (
    <>
      <PageHeader
        title="Espace infirmier"
        description="Tâches de soins et vacations — module en préparation."
      />
      <Card className="shadow-card bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" />
            Tâches de soins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="Aucune tâche pour le moment" description="Le planning infirmier sera branché ici." />
        </CardContent>
      </Card>
    </>
  );
}
