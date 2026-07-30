# GalenMed Healthcare OS Changelog

## Version 0.2.0 — July 30, 2026

### Patient Management

- Added enterprise Patient List with search, filters, sorting, and pagination.
- Added New Patient registration with automatic Medical Record Number generation.
- Added global dashboard patient search.
- Added patient demographic viewing, editing, and archival without hard deletion.
- Added full Patient Profile.

### Clinical Patient Modules

- Added structured Medical History.
- Added timestamped Vital Signs measurement sets.
- Added Allergies and Intolerances.
- Added Insurance Coverage.
- Added Patient Document Metadata.
- Added Unified Patient Timeline.

### Technical Improvements

- Added strongly typed TypeScript domain models.
- Added React Hook Form and Zod validation.
- Added reusable dialogs, details sheets, status badges, filters, and archive workflows.
- Added audit-ready metadata.
- Added protected insurance identifier and document filename masking.
- Added loading, empty, and no-result states.

### Current Limitations

- Synthetic development records only.
- Temporary client-side state only.
- No Supabase database integration.
- No authentication or Role-Based Access Control.
- No persistent audit logs.
- No real patient-document binary storage.
- No production clinical interpretation rules.

### Security Notes

- No `npm audit fix --force` was applied.
- Transitive PostCSS and Sharp advisories remain in the installed Next.js dependency tree.
- Real patient data, image processing, and document uploads remain disabled.
- This release is a development preview and is not approved for production healthcare deployment.

## Version 0.1.0 — July 29, 2026

### Healthcare OS Foundation

- Initialized Next.js, React, TypeScript, and Tailwind CSS.
- Added shadcn/ui and Lucide React.
- Added enterprise folder architecture.
- Added responsive sidebar and header.
- Added Dashboard layout and initial application routes.
- Initialized the GitHub repository.
