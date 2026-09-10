import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brand } from "@/app/config/brand";
import { useAuth } from "@/app/providers/auth-provider";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SolidCare Clinic Management" },
      {
        name: "description",
        content:
          "Sign in to SolidCare to manage patients, appointments, consultations, prescriptions and payments.",
      },
      { property: "og:title", content: "Sign in — SolidCare Clinic Management" },
      { property: "og:description", content: "Access your SolidCare clinic workspace." },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "sonia.khelifi@solidcare.tn", password: "solidcare" },
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await signIn(values.email);
      toast.success("Welcome back to SolidCare");
      await navigate({ to: "/dashboard" });
    } catch {
      toast.error("We couldn't sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3">
            <img src={brand.logoUrl} alt={`${brand.name} logo`} className="size-11 object-contain" />
            <div>
              <p className="text-lg font-semibold text-foreground">{brand.name}</p>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {brand.tagline}
              </p>
            </div>
          </div>

          <h1 className="mt-8 text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo workspace — any email works while the backend is being connected.
          </p>

          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
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

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden items-center justify-center bg-primary/8 p-12 lg:flex">
        <div className="max-w-md space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            One workspace for the whole clinic
          </h2>
          <p className="text-sm text-muted-foreground">{brand.description}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>· Patient records, appointments and consultations in one place</li>
            <li>· Prescriptions and payments tracked in Tunisian dinar</li>
            <li>· Role-based access for administrators, doctors and reception</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
