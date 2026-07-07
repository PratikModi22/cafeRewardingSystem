-- Create menu_categories table
create table if not exists public.menu_categories (
  id uuid default gen_random_uuid() primary key,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create menu_items table
create table if not exists public.menu_items (
  id uuid default gen_random_uuid() primary key,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add items JSONB column to transactions
alter table public.transactions add column if not exists items jsonb default '[]'::jsonb;

-- Turn on RLS
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;

-- RLS policies for menu_categories
create policy "Anyone can view menu categories" on public.menu_categories
  for select using (true);

create policy "Owners can insert menu categories" on public.menu_categories
  for insert with check (
    exists (
      select 1 from public.cafes
      where cafes.id = cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can update menu categories" on public.menu_categories
  for update using (
    exists (
      select 1 from public.cafes
      where cafes.id = cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can delete menu categories" on public.menu_categories
  for delete using (
    exists (
      select 1 from public.cafes
      where cafes.id = cafe_id and cafes.owner = auth.uid()
    )
  );

-- RLS policies for menu_items
create policy "Anyone can view menu items" on public.menu_items
  for select using (true);

create policy "Owners can insert menu items" on public.menu_items
  for insert with check (
    exists (
      select 1 from public.cafes
      where cafes.id = cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can update menu items" on public.menu_items
  for update using (
    exists (
      select 1 from public.cafes
      where cafes.id = cafe_id and cafes.owner = auth.uid()
    )
  );

create policy "Owners can delete menu items" on public.menu_items
  for delete using (
    exists (
      select 1 from public.cafes
      where cafes.id = cafe_id and cafes.owner = auth.uid()
    )
  );

-- Create performance indexes
create index if not exists idx_menu_categories_cafe on public.menu_categories(cafe_id);
create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_menu_items_cafe on public.menu_items(cafe_id);
