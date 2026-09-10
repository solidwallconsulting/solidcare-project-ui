# CareConnect Pro

# SolidCare — Clinic Management System

## 1. Product Overview

Build a modern, professional and user-friendly web application called **SolidCare**.

SolidCare is a **Clinic Management System** designed to help private clinics manage:

* Patients
* Doctors
* Appointments
* Consultations
* Prescriptions
* Payments
* Dashboard and statistics
* Users and roles
* Clinic settings

The application must be designed as a **real SaaS product**, not as a simple CRUD demo.

The UI should be clean, modern, medical, professional and easy to use.

Use the provided **SolidCare logo/branding** as the main visual identity.

---

# 2. Main Design Direction

## Brand

Application name:

**SolidCare**

Subtitle:

**Clinic Management System**

The visual identity should communicate:

* Trust
* Healthcare
* Security
* Simplicity
* Professionalism
* Modern technology

Use a professional medical visual language.

Avoid:

* Excessive gradients
* Overly colorful interfaces
* Excessive rounded cards
* Too many decorative elements
* Generic AI-generated dashboard layouts
* Excessive animations

The interface should feel like a serious professional healthcare SaaS.

---

# 3. Theme

The application must support:

* Light mode
* Dark mode

The user must be able to switch between Light / Dark / System.

Persist the selected theme.

Use CSS variables/design tokens instead of hardcoded colors everywhere.

Suggested brand palette:

* Primary: deep teal
* Secondary: turquoise / mint
* Background: neutral light gray in light mode
* Background: dark slate in dark mode
* Success: green
* Warning: amber
* Error: red
* Info: blue

The SolidCare logo should work on both light and dark backgrounds.

---

# 4. UI Library

Use:

**Radix UI**

Prefer accessible Radix UI primitives/components for:

* Dialog
* Dropdown Menu
* Select
* Checkbox
* Radio Group
* Tabs
* Tooltip
* Popover
* Alert Dialog
* Toast
* Accordion
* Switch
* Scroll Area
* Avatar

Use a consistent component system.

Buttons, inputs, forms, tables, cards and dialogs must have consistent sizes, spacing, typography and states.

Accessibility is important.

---

# 5. Responsive Design

The application must be fully responsive.

Support:

* Desktop
* Laptop
* Tablet
* Mobile

Desktop:

* Sidebar navigation
* Top header
* Main content area

Tablet:

* Collapsible sidebar
* Optimized tables

Mobile:

* Collapsible navigation
* Responsive cards
* Tables should transform into mobile-friendly layouts where necessary
* Forms should use one-column layouts
* Actions should remain easily accessible

Never allow horizontal overflow.

---

# 6. Application Layout

Create a reusable application shell:

```text
AppShell
│
├── Sidebar
│
├── Header
│   ├── Breadcrumbs
│   ├── Search
│   ├── Notifications
│   ├── Theme switcher
│   └── User menu
│
└── Main Content
```

Sidebar navigation:

```text
SolidCare
Clinic Management System

Dashboard

Patients
Appointments
Consultations
Doctors
Prescriptions
Payments

Reports

Administration
    Users
    Roles
    Settings
```

The active navigation item must be clearly visible.

Sidebar should be collapsible.

---

# 7. MODULAR ARCHITECTURE

This is extremely important.

Do NOT create one huge components folder.

Organize the project by **business features**.

Recommended architecture:

```text
src/
│
├── app/
│   ├── routes/
│   ├── providers/
│   ├── layouts/
│   └── config/
│
├── features/
│
│   ├── dashboard/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dto/
│   │   ├── types/
│   │   ├── mocks/
│   │   └── index.ts
│   │
│   ├── patients/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dto/
│   │   ├── types/
│   │   ├── mocks/
│   │   └── index.ts
│   │
│   ├── appointments/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dto/
│   │   ├── types/
│   │   ├── mocks/
│   │   └── index.ts
│   │
│   ├── consultations/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dto/
│   │   ├── types/
│   │   ├── mocks/
│   │   └── index.ts
│   │
│   ├── doctors/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dto/
│   │   ├── types/
│   │   ├── mocks/
│   │   └── index.ts
│   │
│   ├── prescriptions/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dto/
│   │   ├── types/
│   │   ├── mocks/
│   │   └── index.ts
│   │
│   ├── payments/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dto/
│   │   ├── types/
│   │   ├── mocks/
│   │   └── index.ts
│   │
│   └── administration/
│       ├── api/
│       ├── components/
│       ├── pages/
│       ├── dto/
│       ├── types/
│       ├── mocks/
│       └── index.ts
│
├── shared/
│   ├── api/
│   │   ├── api-client.ts
│   │   ├── api-config.ts
│   │   └── api-types.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── data-table/
│   │   ├── forms/
│   │   ├── feedback/
│   │   └── layout/
│   │
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   ├── types/
│   └── mocks/
│
├── assets/
│
└── styles/
    ├── globals.css
    └── theme.css
```

The architecture must remain modular as the application grows.

---

# 8. Shared Layer

Create reusable shared components.

Examples:

```text
shared/components/ui/
```

Include:

* Button
* Input
* Textarea
* Select
* Dialog
* Dropdown
* Badge
* Avatar
* Card
* Tooltip
* Tabs
* Switch
* Skeleton
* Alert
* Toast
* DatePicker

Create reusable business-independent components:

```text
DataTable
PageHeader
PageContainer
StatCard
EmptyState
LoadingState
ErrorState
ConfirmDialog
SearchInput
FilterBar
StatusBadge
Pagination
FormField
FormSection
```

Do NOT duplicate these components inside every feature.

---

# 9. API Architecture

Create a centralized API configuration.

Example:

```text
shared/api/api-config.ts
shared/api/api-client.ts
```

The API base URL must come from an environment variable:

```text
VITE_API_URL
```

Example:

```text
VITE_API_URL=http://localhost:3000/api
```

Do not hardcode backend URLs inside feature components.

Each feature owns its API functions.

Example:

```text
features/patients/api/patients.api.ts
features/doctors/api/doctors.api.ts
features/appointments/api/appointments.api.ts
```

The architecture must make it easy to replace mock APIs with real backend APIs later.

---

# 10. DTOs and Types

Each feature must have its own DTOs/types.

Example:

```text
features/patients/dto/
    create-patient.dto.ts
    update-patient.dto.ts
    patient-filters.dto.ts

features/patients/types/
    patient.ts
```

Do not put every interface in one global types file.

DTOs should represent API input/output contracts.

---

# 11. Mock Data

The MVP should work completely with mock data.

Each feature must have its own mock data.

Example:

```text
features/patients/mocks/patients.mock.ts
features/doctors/mocks/doctors.mock.ts
features/appointments/mocks/appointments.mock.ts
```

Create realistic but fictional data.

Do not use real personal information.

Mock data should allow the UI to demonstrate:

* Lists
* Search
* Filters
* Pagination
* Details
* Create
* Edit
* Delete
* Status changes
* Dashboard statistics

The mock API layer should have a structure that can later be replaced by HTTP API calls.

---

# 12. Dashboard Feature

Route:

```text
/dashboard
```

Dashboard should provide a quick overview of the clinic.

Display:

### KPI cards

* Today's appointments
* Total patients
* Doctors
* Today's revenue

Example:

```text
24
Appointments today

1,284
Total patients

12
Doctors

3,450 DT
Today's revenue
```

### Today's appointments

Show:

* Time
* Patient
* Doctor
* Type
* Status
* Actions

### Revenue overview

Display a simple chart.

### Patient statistics

Display useful statistics.

### Quick actions

Buttons:

* New patient
* New appointment
* New consultation
* New payment

Dashboard should not become visually overloaded.

---

# 13. Patients Feature

Route:

```text
/patients
```

Pages:

```text
PatientsListPage
PatientDetailsPage
CreatePatientPage
EditPatientPage
```

Patient fields:

```text
id
medicalRecordNumber
firstName
lastName
dateOfBirth
gender
phone
email
address
emergencyContact
bloodType
notes
createdAt
updatedAt
```

Patient list:

* Search
* Filters
* Pagination
* Status
* Actions

Patient details should contain tabs:

```text
Overview
Appointments
Consultations
Prescriptions
Payments
Documents
```

Patient profile should clearly show:

* Patient identity
* Medical record number
* Contact information
* Last appointment
* Next appointment
* Consultation history

---

# 14. Appointments Feature

Route:

```text
/appointments
```

Provide:

* Calendar view
* List view

Calendar:

* Day
* Week
* Month

Appointment fields:

```text
patient
doctor
date
startTime
endTime
reason
status
notes
```

Statuses:

```text
Scheduled
Confirmed
Waiting
Completed
Cancelled
No Show
```

Use clear status badges.

Appointment creation should be a clean form/dialog.

Include:

* Patient selector
* Doctor selector
* Date
* Time
* Reason
* Notes

Avoid complicated scheduling logic in the MVP.

---

# 15. Doctors Feature

Route:

```text
/doctors
```

Pages:

```text
DoctorsListPage
DoctorDetailsPage
CreateDoctorPage
EditDoctorPage
```

Doctor fields:

```text
firstName
lastName
specialty
phone
email
licenseNumber
availability
status
avatar
```

Doctor details:

```text
Profile
Schedule
Appointments
Patients
Statistics
```

Show specialty and availability clearly.

---

# 16. Consultations Feature

Route:

```text
/consultations
```

The consultation is linked to:

```text
Patient
Doctor
Appointment
```

Consultation fields:

```text
reason
symptoms
observations
diagnosis
treatment
notes
followUpDate
```

Consultation page should feel focused and professional.

Use sections:

```text
Patient information

Reason for visit

Symptoms

Clinical observations

Diagnosis

Treatment

Notes

Follow-up
```

The doctor should be able to save the consultation.

---

# 17. Prescriptions Feature

Route:

```text
/prescriptions
```

Create prescription.

Fields:

```text
Patient
Doctor
Date
Medications
Instructions
Notes
```

Each medication:

```text
name
dosage
frequency
duration
instructions
```

Allow adding/removing medication rows.

Provide:

```text
Save
Preview
Print
```

Do not build a complex pharmacy system for the MVP.

---

# 18. Payments Feature

Route:

```text
/payments
```

Payment fields:

```text
patient
appointment
description
amount
paymentMethod
status
date
```

Payment methods:

```text
Cash
Card
Bank Transfer
Other
```

Statuses:

```text
Paid
Pending
Partial
Cancelled
```

Provide:

* Payment list
* Search
* Filters
* Payment details
* Add payment

Dashboard should calculate revenue from mock payment data.

---

# 19. Administration

Administration should contain:

```text
Users
Roles
Clinic Settings
```

Roles:

```text
Admin
Doctor
Receptionist
```

Permissions should be represented in the architecture even if full permission management is not implemented in the MVP.

Example:

```text
patients.read
patients.create
patients.update
patients.delete

appointments.read
appointments.create
appointments.update
appointments.delete

consultations.read
consultations.create
consultations.update

payments.read
payments.create
```

---

# 20. Authentication UI

Create a professional login page.

```text
SolidCare logo

Welcome back

Email
Password

Remember me

Forgot password?

Sign in
```

For the MVP, authentication can be mocked.

Structure the application so real JWT authentication can be integrated later.

Do not implement fake security logic in the frontend.

---

# 21. Forms

Use consistent forms throughout the application.

Forms must have:

* Labels
* Validation
* Required indicators
* Helpful placeholders
* Error messages
* Loading states
* Success feedback
* Cancel action

Avoid giant forms.

Group fields logically.

Example:

```text
Personal Information

First name
Last name
Date of birth
Gender

Contact Information

Phone
Email
Address
```

---

# 22. Tables

Use a reusable DataTable component.

Features:

* Sorting
* Search
* Filters
* Pagination
* Row actions
* Empty state
* Loading state

Actions should use:

```text
View
Edit
Delete
```

Destructive actions must require confirmation.

On mobile, tables should become responsive cards or horizontally scroll only when absolutely necessary.

---

# 23. Loading / Empty / Error States

Every feature must support:

### Loading

Use skeletons instead of blank screens.

### Empty

Example:

```text
No patients found

There are no patients matching your search.

+ Add patient
```

### Error

Example:

```text
Something went wrong

We couldn't load the patients.

Try again
```

Never leave empty white screens.

---

# 24. UX Principles

Follow these principles:

* Simple navigation
* Clear hierarchy
* Consistent spacing
* Clear typography
* Strong contrast
* Accessible forms
* Minimal cognitive load
* Clear feedback after actions
* Predictable interactions
* Avoid unnecessary modals
* Avoid excessive animations

Use progressive disclosure where appropriate.

The user should always understand:

1. Where they are
2. What they can do
3. What happened after an action
4. How to go back

---

# 25. Accessibility

Follow accessible UI practices:

* Keyboard navigation
* Proper labels
* Focus states
* ARIA where necessary
* Sufficient contrast
* Accessible dialogs
* Accessible dropdowns
* Accessible forms

Use Radix UI primitives whenever possible.

---

# 26. Notifications

Create a shared notification/toast system.

Examples:

```text
Patient created successfully.
Appointment updated successfully.
Payment recorded successfully.
Prescription saved successfully.
```

Errors should be clear and actionable.

---

# 27. Search

Create a reusable search pattern.

For patients:

```text
Search by name, phone or medical record number
```

For appointments:

```text
Search by patient or doctor
```

For payments:

```text
Search by patient
```

Do not implement one giant global search engine for the MVP.

---

# 28. Breadcrumbs

Use breadcrumbs on internal pages.

Example:

```text
Patients / Ahmed Ben Ali
```

or:

```text
Appointments / New appointment
```

---

# 29. Routing

Create clean routes:

```text
/login

/dashboard

/patients
/patients/new
/patients/:id
/patients/:id/edit

/appointments
/appointments/new
/appointments/:id

/doctors
/doctors/new
/doctors/:id

/consultations
/consultations/new
/consultations/:id

/prescriptions
/prescriptions/new
/prescriptions/:id

/payments
/payments/new
/payments/:id

/reports

/admin/users
/admin/roles
/admin/settings
```

---

# 30. Code Quality

Follow clean-code principles.

Important rules:

* No duplicated UI
* No giant components
* No business logic inside presentation components
* No hardcoded API URLs
* No hardcoded fake data inside pages
* No duplicated types
* Feature-specific logic stays inside its feature
* Shared reusable logic goes inside `shared`
* Use clear naming
* Keep components focused
* Prefer composition over complex components

Pages should mainly orchestrate feature components.

Example:

```text
PatientsPage
    ↓
PatientsHeader
PatientsFilters
PatientsTable
PatientPagination
```

Not one 800-line component.

---

# 31. API Separation

Even when using mocks, keep the API abstraction.

Example:

```text
patients.api.ts

getPatients()
getPatientById(id)
createPatient(dto)
updatePatient(id, dto)
deletePatient(id)
```

The page should not directly manipulate mock arrays.

Example flow:

```text
Page
 ↓
Feature Hook
 ↓
Feature API
 ↓
Mock API
```

Later:

```text
Page
 ↓
Feature Hook
 ↓
Feature API
 ↓
HTTP Client
 ↓
NestJS Backend
```

The frontend architecture should therefore be ready for a real backend.

---

# 32. State Management

Do not introduce a heavy global state architecture unless necessary.

Use:

* Local state for UI state
* Feature-level state for feature data
* Shared state only for truly global concerns such as:

  * Authentication
  * Theme
  * Current user
  * Clinic context

Keep state ownership close to where it is used.

---

# 33. Data Validation

Use a consistent schema validation approach.

Recommended:

**Zod**

Use validation schemas for forms and DTO validation.

Example:

```text
patient.schema.ts
appointment.schema.ts
doctor.schema.ts
consultation.schema.ts
payment.schema.ts
```

Show validation errors next to the corresponding fields.

---

# 34. Date / Currency Formatting

Centralize formatting utilities.

Examples:

```text
formatDate()
formatDateTime()
formatCurrency()
```

For the MVP, use:

```text
Currency: TND
Locale: fr-TN
```

Dates should be displayed consistently.

---

# 35. Security Considerations

This is a healthcare application.

Even though this is an MVP:

* Do not expose sensitive data unnecessarily
* Do not put sensitive patient information into URLs
* Do not hardcode credentials
* Do not store secrets in frontend code
* Do not use real patient data
* Keep authentication architecture ready for JWT
* Prepare role-based access control

The frontend should never be considered the final security layer.

---

# 36. Performance

Follow good frontend performance practices:

* Lazy-load feature routes where appropriate
* Avoid unnecessary re-renders
* Avoid huge component trees
* Paginate large datasets
* Use skeleton loading
* Optimize images
* Avoid loading everything on the dashboard

---

# 37. MVP Scope

Do NOT overbuild the application.

The MVP should focus on:

### Core

* Authentication UI
* Dashboard
* Patients
* Doctors
* Appointments
* Consultations
* Prescriptions
* Payments
* Administration
* Light/Dark mode
* Responsive UI

### Future versions

Do NOT implement these now:

* Pharmacy inventory
* Laboratory management
* Insurance integrations
* Telemedicine
* AI diagnosis
* Advanced accounting
* SMS provider integration
* WhatsApp integration
* Complex medical billing
* Hospital bed management
* Multi-clinic enterprise management

Keep the architecture extensible for them later.

---

# 38. Visual Details

Use a clean modern dashboard.

Typography should be highly readable.

Use:

* Clear page titles
* Small descriptive subtitles
* Consistent card sizes
* 8px-based spacing system
* Medium border radius
* Subtle borders
* Very subtle shadows
* Clear hover states
* Clear focus states

Do not make every element a card.

Use whitespace to create hierarchy.

---

# 39. Example Patient Page

The patient details page should look approximately like:

```text
← Patients

Ahmed Ben Ali
Medical Record #MC-2026-00124

[Edit Patient] [More]

┌─────────────────────────────────────────────┐
│ Patient Overview                            │
│                                             │
│ Phone          +216 XX XXX XXX              │
│ Email          patient@example.com          │
│ Date of birth  12 March 1988                │
│ Gender         Male                         │
└─────────────────────────────────────────────┘

[Overview] [Appointments] [Consultations]
[Prescriptions] [Payments]

Recent activity
────────────────────────────────────────────

09:30  Consultation with Dr. Sami
Yesterday

14:00  Appointment confirmed
2 days ago
```

Keep it clean and easy to scan.

---

# 40. Final Requirement

Before finishing, verify that:

* The project compiles
* All routes work
* All navigation works
* All buttons have meaningful behavior
* Mock data is realistic
* CRUD flows work locally
* Forms validate correctly
* Dark mode works everywhere
* Light mode works everywhere
* Mobile layout works
* No horizontal overflow
* No broken imports
* No duplicated components
* No hardcoded API URLs
* No fake backend calls inside UI components
* Loading states exist
* Empty states exist
* Error states exist
* Toast notifications work
* Confirmation dialogs work
* Accessibility basics are respected

Most importantly:

**Keep the code modular by feature.**

Every business feature must own its:

```text
api
components
pages
dto
types
mocks
```

Shared functionality must live in:

```text
shared/
```

The result should look and feel like a polished professional SaaS product that can later connect to a NestJS/PostgreSQL backend without restructuring the entire frontend.

### 🧱 Stack que je recommande à Lovable

Pour ce projet, je partirais sur :

```text
React
TypeScript
Vite
Tailwind CSS
Radix UI
React Router
React Hook Form
Zod
TanStack Query
Recharts
Lucide Icons
```

Et surtout **TanStack Query** pour préparer proprement le passage des `mock APIs` vers les vraies APIs NestJS.

L'architecture cible serait donc :

```text
                 ┌───────────────────┐
                 │       Pages       │
                 └─────────┬─────────┘
                           ↓
                 ┌───────────────────┐
                 │     Components    │
                 └─────────┬─────────┘
                           ↓
                 ┌───────────────────┐
                 │   Hooks / Query   │
                 └─────────┬─────────┘
                           ↓
                 ┌───────────────────┐
                 │    Feature API    │
                 └─────────┬─────────┘
                           ↓
                  ┌─────────────────┐
                  │   API Client    │
                  └────────┬────────┘
                           ↓
                 ┌───────────────────┐
                 │   NestJS Backend  │
                 └───────────────────┘
```

Et pendant le développement MVP :

```text
Feature API
     ↓
Mock API
     ↓
Mock Data
```

puis simplement :

```text
Feature API
     ↓
HTTP API
     ↓
NestJS
     ↓
PostgreSQL
```

**C'est cette séparation qui est importante** : Lovable ne doit pas mélanger les données mockées avec les composants React, sinon lorsque tu vas brancher ton backend NestJS, tu devras refaire une grande partie du frontend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/071f6abd-e70c-4b33-b527-644ea80a5d63).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
