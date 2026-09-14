import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Field } from "@/shared/components/forms/field";
import { FormSection } from "@/shared/components/forms/form-section";

const SETTINGS_KEY = "solidcare.clinic-settings";

const settingsSchema = z.object({
  name: z.string().min(2, "Le nom de la clinique est requis"),
  address: z.string().min(3, "L'adresse est requise"),
  phone: z
    .string()
    .min(8, "Téléphone invalide")
    .regex(/^[0-9+\s]+$/, "Chiffres, espaces et + uniquement"),
  currency: z.literal("TND"),
});

type ClinicSettings = z.infer<typeof settingsSchema>;

const defaults: ClinicSettings = {
  name: "SolidCare Clinique",
  address: "Avenue Habib Bourguiba, Tunis",
  phone: "+216 71 000 000",
  currency: "TND",
};

function loadSettings(): ClinicSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = settingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : defaults;
  } catch {
    return defaults;
  }
}

export function SettingsPage() {
  const form = useForm<ClinicSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaults,
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    form.reset(loadSettings());
  }, [form]);

  return (
    <PageContainer>
      <PageHeader
        title="Paramètres"
        description="Informations de la clinique (persistées en localStorage — démo)."
      />

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Clinique</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit((values) => {
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(values));
              toast.success("Paramètres enregistrés");
            })}
            noValidate
          >
            <FormSection title="Identité">
              <Field label="Nom" htmlFor="name" error={errors.name?.message} className="sm:col-span-2">
                <Input id="name" {...form.register("name")} />
              </Field>
              <Field
                label="Adresse"
                htmlFor="address"
                error={errors.address?.message}
                className="sm:col-span-2"
              >
                <Input id="address" {...form.register("address")} />
              </Field>
              <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" inputMode="tel" {...form.register("phone")} />
              </Field>
              <Field label="Devise" htmlFor="currency" error={errors.currency?.message}>
                <Input id="currency" {...form.register("currency")} readOnly />
              </Field>
            </FormSection>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(defaults);
                  localStorage.removeItem(SETTINGS_KEY);
                  toast.message("Paramètres réinitialisés");
                }}
              >
                Réinitialiser
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
