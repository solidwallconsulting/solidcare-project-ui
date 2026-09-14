import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/app/config/brand";
import { BrandLogo } from "@/shared/components/brand/brand-logo";
import { ThemeToggle } from "@/app/layout/theme-toggle";
import { useAuth } from "@/app/providers/auth-provider";
import { CareFlowGraphic } from "./care-flow-graphic";

const flowSteps = [
  {
    title: "People",
    text: "Médecins, chefs de département, infirmiers et équipes coordonnés.",
  },
  {
    title: "Spaces",
    text: "Salles, chambres, lits et blocs opératoires sous contrôle.",
  },
  {
    title: "Resources",
    text: "Matériel, maintenance et disponibilités en un coup d’œil.",
  },
  {
    title: "Patient",
    text: "Dossier complet, hospitalisations et historique de soins.",
  },
  {
    title: "Care",
    text: "Consultations, examens, ordonnances et suivi dans le même flux.",
  },
];

const personas = [
  {
    role: "Médecin",
    title: "Concentrez-vous sur le patient.",
    text: "Consultations, ordonnances et historique — sans paperasse inutile.",
    icon: Stethoscope,
  },
  {
    role: "Réception / Équipe",
    title: "Gardez la journée en flux.",
    text: "Patients, créneaux et salles coordonnés pour le département.",
    icon: Users,
  },
  {
    role: "Direction",
    title: "Voyez la clinique d’un coup d’œil.",
    text: "Activité, revenus, blocs opératoires et matériel sous contrôle.",
    icon: Building2,
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo showWordmark markClassName="size-10" />
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#parcours" className="text-foreground/80 transition-colors hover:text-primary">
              Parcours
            </a>
            <a href="#equipes" className="text-foreground/80 transition-colors hover:text-primary">
              Équipes
            </a>
            <a href="#confiance" className="text-foreground/80 transition-colors hover:text-primary">
              Confiance
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/dashboard">
                  Tableau de bord
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button asChild>
                  <Link to="/login">
                    Commencer
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO — une composition, brand d’abord */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <img
          src={brand.heroUrl}
          alt=""
          className="absolute inset-0 size-full object-cover landing-hero-media"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/88 via-background/72 to-background" />
        <div className="absolute inset-0 landing-hero-grain" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24">
          <div className="max-w-2xl landing-fade-up">
            <p className="font-display text-4xl font-semibold tracking-tight text-primary sm:text-5xl lg:text-6xl">
              {brand.name}
            </p>
            <p className="mt-2 text-sm font-medium tracking-[0.18em] text-secondary uppercase">
              {brand.tagline}
            </p>
            <h1 className="mt-8 font-display text-3xl leading-[1.12] font-semibold text-foreground sm:text-4xl lg:text-5xl">
              Votre clinique, enfin parfaitement fluide.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {brand.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                  {isAuthenticated ? "Ouvrir SolidCare" : "Gérer ma clinique"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#parcours">Explorer SolidCare</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CARE FLOW */}
      <section id="parcours" className="border-t border-border bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
              Care Flow
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              People · Spaces · Resources · Care
            </h2>
            <p className="mt-3 text-muted-foreground">
              SolidCare orchestre le personnel, les espaces, les ressources et le parcours patient —
              la plateforme opérationnelle de votre clinique.
            </p>
          </div>

          <div className="mt-12 overflow-x-auto">
            <CareFlowGraphic className="mx-auto h-28 w-full min-w-[640px]" />
          </div>

          <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {flowSteps.map((step, index) => (
              <li key={step.title} className="landing-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
                <p className="font-display text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* EQUIPES */}
      <section id="equipes" className="border-t border-border bg-accent/40 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
              Équipes
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Pensé pour le rythme de votre service.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Chefs de département, chefs d’équipe, médecins et réception — chacun voit ce qui
              compte pour agir.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            {personas.map((persona) => (
              <article key={persona.role} className="min-w-0">
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <persona.icon className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                  {persona.role}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
                  {persona.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{persona.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONFIANCE */}
      <section id="confiance" className="border-t border-border bg-background py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
              Confiance
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Conçu pour des informations sensibles.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Architecture interne avec rôles et permissions préparés pour un backend sécurisé.
              Aucun portail public patient.
            </p>
          </div>

          <ul className="space-y-5">
            {[
              { title: "Accès", text: "Rôles : admin, chef de département, chef d’équipe, médecin, réception." },
              { title: "Confidentialité", text: "Données de démo fictives — jamais de vrais dossiers patients." },
              { title: "Contrôle", text: "Organisation : départements, salles, blocs et matériel." },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border bg-primary py-16 text-primary-foreground sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Remettez votre clinique en flux.
            </h2>
            <p className="mt-3 text-sm text-primary-foreground/85">
              Connectez-vous à l’espace staff SolidCare et pilotez la journée de votre établissement.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <Link to={isAuthenticated ? "/dashboard" : "/login"}>
              {isAuthenticated ? "Aller au tableau de bord" : "Se connecter"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <BrandLogo showWordmark markClassName="size-8" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SolidCare · Gestion clinique interne · Clarity in care.
          </p>
        </div>
      </footer>
    </div>
  );
}
