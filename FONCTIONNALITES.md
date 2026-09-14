# SolidCare — Fonctionnalités (Healthcare Operations Platform)

> **Positionnement** : SolidCare n’est pas un simple outil de rendez-vous.  
> C’est une **plateforme opérationnelle de clinique** : **People + Spaces + Resources + Care**.  
> Espace **interne** uniquement — aucun portail public patient.

---

## Concept Care Flow

```text
                 SOLIDCARE
                     │
       ┌─────────────┼─────────────┐
       │             │             │
    PEOPLE        SPACES        RESOURCES
  Médecins      Salles        Matériel
  Infirmiers    Chambres/Lits Maintenance
  Chefs         Blocs         Stock (V2)
       │             │             │
       └─────────────┼─────────────┘
                     ↓
                  PATIENT → CARE
```

---

## MVP CORE — Domaines livrés / en cours

### 1. Infrastructure
| Module | Route | Contenu |
| --- | --- | --- |
| Départements | `/departments` | Chef, équipe, salles, stats |
| Salles | `/rooms` | Types : consultation, soins, examen, écho, radio, bloc opératoire, réveil · Statuts dispo/occupée/réservée/intervention/stérilisation/maintenance |
| Chambres & lits | `/wards` | Étage → chambre → lit · occupation |
| Matériel | `/equipment` | Inventaire, localisation, maintenance |
| Maintenance | `/maintenance` | Tickets matériel (ouvert → en cours → résolu) |

### 2. Personnel
| Module | Route | Contenu |
| --- | --- | --- |
| Médecins | `/doctors` | Profil, département, planning jours |
| Personnel soignant | `/staff` | Infirmiers, aides-soignants, techniciens… |
| Utilisateurs & rôles | `/admin/users`, `/admin/roles` | RBAC : Admin, Chef dép., Chef équipe, Médecin, Infirmier, Réception |

### 3. Planning
| Module | Route | Contenu |
| --- | --- | --- |
| Planning Center | `/planning` | Vues médecins / salles / blocs / shifts |
| Alertes | `/alerts` | Centre d’alertes opérationnelles |

### 4. Patients & soins
| Module | Route | Contenu |
| --- | --- | --- |
| Patients | `/patients`, `/patients/:id` | Dossier + timeline + hospitalisations + examens |
| Rendez-vous | `/appointments` | Planning interne staff |
| Consultations | `/consultations` | Motif → constantes → diagnostic |
| Examens | `/examinations` | Demandes labo / imagerie · workflow statuts |
| Ordonnances | `/prescriptions` | Lignes médicaments |
| Hospitalisations | `/hospitalizations` | Admission → lit → transfert → sortie |
| Paiements | `/payments` | TND |

### 5. Système
| Module | Route | Contenu |
| --- | --- | --- |
| Dashboard par rôle | `/dashboard` | Admin / Chef / Médecin / Infirmier / Réception |
| Audit | `/admin/audit` | Traçabilité actions |
| Thème | — | Clair / Sombre / Système |
| Landing | `/` | Marketing Care Flow · CTA staff |

---

## Dashboards par rôle (principe)

- **Admin** : patients, occupation lits, blocs, revenus, alertes  
- **Chef de département** : mon équipe, salles, hospitalisations, interventions  
- **Médecin** : mon planning, RDV du jour, patients, examens  
- **Infirmier** : shift, patients hospitalisés, tâches  
- **Réception** : RDV, admissions, lits disponibles  

---

## Hors MVP (V2)

Laboratoire complet, radiologie avancée, pharmacie, stock consommables, facturation/assurance, portail patient, app mobile infirmier, urgences/triage, SMS.

---

## Architecture technique

Features modulaires (`api` / `components` / `pages` / `types` / `mocks`) + `shared/api` prêt NestJS (`VITE_API_URL`).  
Mocks réalistes · Zod · TanStack Query · Radix UI.
