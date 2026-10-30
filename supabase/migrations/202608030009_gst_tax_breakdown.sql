-- GST tax breakdown (Phase 2 hardening, requirement R5 in PRODUCT_REQUIREMENTS.md)
-- Adds CGST/SGST fields to invoice_items and invoices so Indian clinics can render
-- a proper GST breakdown on invoices. CGST + SGST sum to total tax for intrastate
-- (default Tamil Nadu) transactions. HSN codes are optional per procedure.
-- No data migration: existing rows keep total tax in the `tax` column; new rows
-- populate CGST/SGST individually.

alter table public.invoice_items
  add column if not exists hsn_code text,
  add column if not exists tax_rate_cgst numeric(12,2) not null default 0,
  add column if not exists tax_rate_sgst numeric(12,2) not null default 0;

alter table public.invoices
  add column if not exists hsn_code text,
  add column if not exists tax_rate_cgst numeric(12,2) not null default 0,
  add column if not exists tax_rate_sgst numeric(12,2) not null default 0;

comment on column public.invoice_items.tax_rate_cgst is 'CGST portion of line-item tax (intrastate, same-state default)';
comment on column public.invoice_items.tax_rate_sgst is 'SGST portion of line-item tax (intrastate, same-state default)';
comment on column public.invoice_items.hsn_code is 'HSN/SAC code for GST classification';
comment on column public.invoices.tax_rate_cgst is 'Total CGST across all line items';
comment on column public.invoices.tax_rate_sgst is 'Total SGST across all line items';
comment on column public.invoices.hsn_code is 'Primary HSN/SAC code for the invoice';
