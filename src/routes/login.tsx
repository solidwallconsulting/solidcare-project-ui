import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { brand } from "@/app/config/brand";
import { BrandLogo } from "@/shared/components/brand/brand-logo";
import { useAuth } from "@/app/providers/auth-provider";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — SolidCare" },
      {
        name: "description",
        content:
          "Connectez-vous à SolidCare pour gérer votre clinique : patients, rendez-vous, départements et paiements.",
      },
      { property: "og:title", content: "Connexion — SolidCare" },
      { property: "og:description", content: "Accédez à votre espace clinique SolidCare." },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "sonia.khelifi@solidcare.tn",
      password: "solidcare",
      remember: true,
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await signIn(values.email);
      toast.success("Bienvenue sur SolidCare");
      await navigate({ to: "/dashboard" });
    } catch {
      toast.error("Connexion impossible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex">
            <BrandLogo showWordmark markClassName="size-11" />
          </Link>

          <h1 className="mt-8 font-display text-2xl font-semibold text-foreground">
            Bon retour
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Espace interne réservé au personnel de la clinique. Aucun portail patient public.
          </p>

          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <span className="text-xs font-medium text-primary">Mot de passe oublié ?</span>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={form.watch("remember")}
                onCheckedChange={(checked) => form.setValue("remember", Boolean(checked))}
              />
              Se souvenir de moi
            </label>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="absolute inset-0 opacity-20">
          <svg className="size-full" viewBox="0 0 400 400" aria-hidden="true">
            <path
              d="M40 200 H140 C160 200 160 140 180 140 H260 C280 140 280 200 300 200 H360"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary-foreground"
            />
            <circle cx="140" cy="200" r="5" className="fill-secondary" />
            <circle cx="220" cy="140" r="5" className="fill-secondary" />
            <circle cx="300" cy="200" r="5" className="fill-secondary" />
          </svg>
        </div>
        <div className="relative max-w-md space-y-5 text-primary-foreground">
          <p className="text-xs font-semibold tracking-[0.18em] text-secondary uppercase">
            Care Flow
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Votre clinique, enfin parfaitement fluide.
          </h2>
          <p className="text-sm text-primary-foreground/85">{brand.description}</p>
          <ul className="space-y-2 text-sm text-primary-foreground/85">
            <li>· Gestion interne : chefs de département, équipes et médecins</li>
            <li>· Dossier patient complet avec historique de soins</li>
            <li>· Salles, blocs opératoires et matériel médical</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
