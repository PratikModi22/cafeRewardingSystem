-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Cafes table
create table public.cafes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner uuid not null references auth.users(id) on delete cascade,
  email text,
  phone text,
  logo text,
  reward_name text not null default 'Free Coffee',
  reward_threshold integer not null default 10,
  reward_description text default 'Get a free drink after 10 visits',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customers table
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  total_visits integer not null default 0,
  current_progress integer not null default 0,
  lifetime_spending numeric(10,2) not null default 0.00,
  reward_count integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate customers with the same phone number for a single cafe
  constraint unique_customer_phone_per_cafe unique (cafe_id, phone)
);

-- Transactions table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  bill_amount numeric(10,2) not null default 0.00,
  visit_number integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reward Redemptions table
create table public.reward_redemptions (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  reward_name text not null,
  reward_value numeric(10,2) not null default 0.00,
  redeemed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS)
alter table public.cafes enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.reward_redemptions enable row level security;

-- Policies for Cafes
-- Anyone can read cafe profiles (needed for public customer registration page to load branding)
create policy "Anyone can view cafes" on public.cafes
  for select using (true);

-- Owners can insert their own cafe
create policy "Owners can insert their own cafe" on public.cafes
  for insert with check (auth.uid() = owner);

-- Owners can update their own cafe
create policy "Owners can update their own cafe" on public.cafes
  for update using (auth.uid() = owner);

-- Policies for Customers
-- Anyone can view customer records to verify registration on public registration page
create policy "Anyone can view customers" on public.customers
  for select using (true);

-- Anyone can insert a customer (needed for public QR registration page)
create policy "Anyone can register a customer" on public.customers
  for insert with check (true);

-- Owners can update customer profiles
create policy "Owners can update their cafe customers" on public.customers
  for update using (
    exists (
      select 1 from public.cafes
      where cafes.id = customers.cafe_id and cafes.owner = auth.uid()
    )
  );

-- Policies for Transactions
-- Owners can view transactions of their cafes
create policy "Owners can view cafe transactions" on public.transactions
  for select using (
    exists (
      select 1 from public.cafes
      where cafes.id = transactions.cafe_id and cafes.owner = auth.uid()
    )
  );

-- Owners can insert transactions for their cafes
create policy "Owners can insert cafe transactions" on public.transactions
  for insert with check (
    exists (
      select 1 from public.cafes
      where cafes.id = transactions.cafe_id and cafes.owner = auth.uid()
    )
  );

-- Policies for Reward Redemptions
-- Owners can view reward redemptions of their cafes
create policy "Owners can view cafe redemptions" on public.reward_redemptions
  for select using (
    exists (
      select 1 from public.cafes
      where cafes.id = reward_redemptions.cafe_id and cafes.owner = auth.uid()
    )
  );

-- Owners can insert reward redemptions for their cafes
create policy "Owners can insert cafe redemptions" on public.reward_redemptions
  for insert with check (
    exists (
      select 1 from public.cafes
      where cafes.id = reward_redemptions.cafe_id and cafes.owner = auth.uid()
    )
  );

-- Create helpful indexes for performance
create index idx_customers_cafe_phone on public.customers (cafe_id, phone);
create index idx_transactions_customer on public.transactions (customer_id);
create index idx_transactions_cafe on public.transactions (cafe_id);
create index idx_redemptions_customer on public.reward_redemptions (customer_id);
create index idx_redemptions_cafe on public.reward_redemptions (cafe_id);
