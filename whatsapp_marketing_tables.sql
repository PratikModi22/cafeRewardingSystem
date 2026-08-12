-- SQL migration script to add WhatsApp Template messaging support

-- Alter cafes table to add WhatsApp Business API keys
alter table public.cafes add column if not exists whatsapp_access_token text;
alter table public.cafes add column if not exists whatsapp_phone_number_id text;
alter table public.cafes add column if not exists whatsapp_business_account_id text;

-- Create WhatsApp Templates table
create table if not exists public.whatsapp_templates (
  id uuid default gen_random_uuid() primary key,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  name text not null,
  body text not null,
  meta_template_name text,
  meta_language_code text not null default 'en_US',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Customer Lists table (Audience Groups)
create table if not exists public.customer_lists (
  id uuid default gen_random_uuid() primary key,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Customer List Members mapping table
create table if not exists public.customer_list_members (
  list_id uuid not null references public.customer_lists(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (list_id, customer_id)
);

-- Create WhatsApp Campaigns table
create table if not exists public.whatsapp_campaigns (
  id uuid default gen_random_uuid() primary key,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  template_id uuid not null references public.whatsapp_templates(id) on delete cascade,
  list_id uuid references public.customer_lists(id) on delete set null,
  name text not null,
  status text not null default 'draft', -- 'draft', 'sending', 'sent', 'failed'
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create WhatsApp Campaign Logs table
create table if not exists public.whatsapp_campaign_logs (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid not null references public.whatsapp_campaigns(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  status text not null, -- 'sent', 'failed'
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS)
alter table public.whatsapp_templates enable row level security;
alter table public.customer_lists enable row level security;
alter table public.customer_list_members enable row level security;
alter table public.whatsapp_campaigns enable row level security;
alter table public.whatsapp_campaign_logs enable row level security;

-- Drop existing policies if they exist to avoid duplication errors on re-run
drop policy if exists "Owners can view their cafe templates" on public.whatsapp_templates;
drop policy if exists "Owners can insert their cafe templates" on public.whatsapp_templates;
drop policy if exists "Owners can update their cafe templates" on public.whatsapp_templates;
drop policy if exists "Owners can delete their cafe templates" on public.whatsapp_templates;

drop policy if exists "Owners can view their customer lists" on public.customer_lists;
drop policy if exists "Owners can insert their customer lists" on public.customer_lists;
drop policy if exists "Owners can update their customer lists" on public.customer_lists;
drop policy if exists "Owners can delete their customer lists" on public.customer_lists;

drop policy if exists "Owners can view customer list members" on public.customer_list_members;
drop policy if exists "Owners can insert customer list members" on public.customer_list_members;
drop policy if exists "Owners can delete customer list members" on public.customer_list_members;

drop policy if exists "Owners can view their cafe campaigns" on public.whatsapp_campaigns;
drop policy if exists "Owners can insert their cafe campaigns" on public.whatsapp_campaigns;
drop policy if exists "Owners can update their cafe campaigns" on public.whatsapp_campaigns;

drop policy if exists "Owners can view their campaign logs" on public.whatsapp_campaign_logs;
drop policy if exists "Owners can insert their campaign logs" on public.whatsapp_campaign_logs;

-- Policies for whatsapp_templates
create policy "Owners can view their cafe templates" on public.whatsapp_templates
  for select using (
    exists (
      select 1 from public.cafes
      where cafes.id = whatsapp_templates.cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can insert their cafe templates" on public.whatsapp_templates
  for insert with check (
    exists (
      select 1 from public.cafes
      where cafes.id = whatsapp_templates.cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can update their cafe templates" on public.whatsapp_templates
  for update using (
    exists (
      select 1 from public.cafes
      where cafes.id = whatsapp_templates.cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can delete their cafe templates" on public.whatsapp_templates
  for delete using (
    exists (
      select 1 from public.cafes
      where cafes.id = whatsapp_templates.cafe_id and cafes.owner = auth.uid()
    )
  );

-- Policies for customer_lists
create policy "Owners can view their customer lists" on public.customer_lists
  for select using (
    exists (
      select 1 from public.cafes
      where cafes.id = customer_lists.cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can insert their customer lists" on public.customer_lists
  for insert with check (
    exists (
      select 1 from public.cafes
      where cafes.id = customer_lists.cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can update their customer lists" on public.customer_lists
  for update using (
    exists (
      select 1 from public.cafes
      where cafes.id = customer_lists.cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can delete their customer lists" on public.customer_lists
  for delete using (
    exists (
      select 1 from public.cafes
      where cafes.id = customer_lists.cafe_id and cafes.owner = auth.uid()
    )
  );

-- Policies for customer_list_members
create policy "Owners can view customer list members" on public.customer_list_members
  for select using (
    exists (
      select 1 from public.customer_lists
      join public.cafes on customer_lists.cafe_id = cafes.id
      where customer_lists.id = customer_list_members.list_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can insert customer list members" on public.customer_list_members
  for insert with check (
    exists (
      select 1 from public.customer_lists
      join public.cafes on customer_lists.cafe_id = cafes.id
      where customer_lists.id = customer_list_members.list_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can delete customer list members" on public.customer_list_members
  for delete using (
    exists (
      select 1 from public.customer_lists
      join public.cafes on customer_lists.cafe_id = cafes.id
      where customer_lists.id = customer_list_members.list_id and cafes.owner = auth.uid()
    )
  );

-- Policies for whatsapp_campaigns
create policy "Owners can view their cafe campaigns" on public.whatsapp_campaigns
  for select using (
    exists (
      select 1 from public.cafes
      where cafes.id = whatsapp_campaigns.cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can insert their cafe campaigns" on public.whatsapp_campaigns
  for insert with check (
    exists (
      select 1 from public.cafes
      where cafes.id = whatsapp_campaigns.cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can update their cafe campaigns" on public.whatsapp_campaigns
  for update using (
    exists (
      select 1 from public.cafes
      where cafes.id = whatsapp_campaigns.cafe_id and cafes.owner = auth.uid()
    )
  );

-- Policies for whatsapp_campaign_logs
create policy "Owners can view their campaign logs" on public.whatsapp_campaign_logs
  for select using (
    exists (
      select 1 from public.whatsapp_campaigns
      join public.cafes on whatsapp_campaigns.cafe_id = cafes.id
      where whatsapp_campaigns.id = whatsapp_campaign_logs.campaign_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can insert their campaign logs" on public.whatsapp_campaign_logs
  for insert with check (
    exists (
      select 1 from public.whatsapp_campaigns
      join public.cafes on whatsapp_campaigns.cafe_id = cafes.id
      where whatsapp_campaigns.id = whatsapp_campaign_logs.campaign_id and cafes.owner = auth.uid()
    )
  );

-- Create helpful indexes
create index if not exists idx_templates_cafe on public.whatsapp_templates(cafe_id);
create index if not exists idx_lists_cafe on public.customer_lists(cafe_id);
create index if not exists idx_list_members_list on public.customer_list_members(list_id);
create index if not exists idx_campaigns_cafe on public.whatsapp_campaigns(cafe_id);
create index if not exists idx_campaign_logs_campaign on public.whatsapp_campaign_logs(campaign_id);
