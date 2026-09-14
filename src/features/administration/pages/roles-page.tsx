import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { LoadingState, EmptyState, ErrorState } from "@/shared/components/feedback/states";
import { rolesApi, administrationKeys } from "@/features/administration/api";

export function RolesPage() {
  const rolesQuery = useQuery({
    queryKey: administrationKeys.roles,
    queryFn: () => rolesApi.peekAll(),
  });

  if (rolesQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Rôles" description="Chargement…" />
        <LoadingState />
      </PageContainer>
    );
  }

  if (rolesQuery.isError) {
    return (
      <PageContainer>
        <PageHeader title="Rôles" />
        <ErrorState onRetry={() => void rolesQuery.refetch()} />
      </PageContainer>
    );
  }

  const roles = rolesQuery.data ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Rôles"
        description="Architecture des permissions (lecture seule) pour le staff interne."
      />

      {roles.length === 0 ? (
        <EmptyState title="Aucun rôle" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">{role.name}</CardTitle>
                <p className="text-sm text-foreground/70">{role.description}</p>
                <p className="text-xs text-foreground/70">{role.usersCount} utilisateur(s)</p>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-xs font-medium tracking-wide text-foreground/70 uppercase">
                  Permissions
                </p>
                <ul className="space-y-1.5">
                  {role.permissions.map((permission) => (
                    <li
                      key={permission}
                      className="rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground"
                    >
                      {permission}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
