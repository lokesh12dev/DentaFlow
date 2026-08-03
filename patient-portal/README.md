# DentaFlow patient portal

Static, credential-free patient-facing pages for appointment requests, intake, and appointment responses.

1. Copy `config.example.js` to `config.js`.
2. Set the Supabase Functions base URL, clinic public slug, clinic name, and support phone.
3. Host this directory on any HTTPS static host.
4. Set the `PATIENT_PORTAL_URL` Supabase secret to the public URL.

No service-role key or provider secret belongs in this portal. Public requests are validated and rate-limited by Edge Functions.
