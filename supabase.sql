-- ═══════════════════════════════════════════════════════════
--  জারা ইলেকট্রিক CRM — ডেটাবেস
--  Supabase → SQL Editor → পুরোটা পেস্ট করে Run চাপুন।
--  দুইবার চালালেও সমস্যা নেই।
-- ═══════════════════════════════════════════════════════════

-- ── ১. কে কে ব্যবহার করবে ───────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'MDE',
  role        text not null default 'mde' check (role in ('admin','mde')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin' and active);
$$;

create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

-- নতুন ব্যবহারকারী তৈরি হলে নিজে থেকেই প্রোফাইল বসে যায়
create or replace function public.on_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          coalesce(new.raw_user_meta_data->>'role', 'mde'))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists new_user_profile on auth.users;
create trigger new_user_profile after insert on auth.users
  for each row execute function public.on_new_user();

-- ── ২. কাস্টমার ─────────────────────────────────────────────
create table if not exists public.customers (
  id            text primary key,
  body          jsonb not null,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  edit_deadline timestamptz not null default (now() + interval '24 hours'),
  deleted       boolean not null default false
);
create index if not exists customers_created_by_idx on public.customers(created_by);
create index if not exists customers_updated_idx    on public.customers(updated_at desc);

-- সময় ও ২৪ ঘণ্টার সীমা সার্ভারেই বসে, ব্রাউজারে নয়
create or replace function public.customers_stamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_by    := coalesce(new.created_by, auth.uid());
    new.created_at    := now();
    new.updated_at    := now();
    new.edit_deadline := now() + interval '24 hours';
  else
    new.created_by    := old.created_by;      -- মালিকানা বদলানো যাবে না
    new.created_at    := old.created_at;
    new.edit_deadline := old.edit_deadline;
    new.updated_at    := now();
    if not public.is_admin() then
      if old.created_by is distinct from auth.uid() then
        raise exception 'অন্য কারও তোলা রেকর্ড বদলানো যাবে না';
      end if;
      if now() > old.edit_deadline then
        raise exception '২৪ ঘণ্টার সময় পেরিয়ে গেছে — এখন শুধু মালিক বদলাতে পারবেন';
      end if;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists customers_stamp_trg on public.customers;
create trigger customers_stamp_trg before insert or update on public.customers
  for each row execute function public.customers_stamp();

-- ── ৩. সেটিংস ───────────────────────────────────────────────
create table if not exists public.settings (
  id         text primary key,
  body       jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── ৪. পরিবর্তনের খাতা ──────────────────────────────────────
create table if not exists public.audit (
  id         bigserial primary key,
  who        uuid references public.profiles(id),
  action     text not null,
  target     text,
  detail     jsonb,
  at         timestamptz not null default now()
);
create index if not exists audit_at_idx on public.audit(at desc);

create or replace function public.customers_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit (who, action, target, detail)
  values (auth.uid(), lower(tg_op), coalesce(new.id, old.id),
          jsonb_build_object('name', coalesce(new.body->>'name', old.body->>'name')));
  return coalesce(new, old);
end; $$;
drop trigger if exists customers_audit_trg on public.customers;
create trigger customers_audit_trg after insert or update or delete on public.customers
  for each row execute function public.customers_audit();

-- ── ৫. কে কী দেখবে, কে কী বদলাতে পারবে ──────────────────────
alter table public.profiles  enable row level security;
alter table public.customers enable row level security;
alter table public.settings  enable row level security;
alter table public.audit     enable row level security;

drop policy if exists p_read   on public.profiles;
drop policy if exists p_self   on public.profiles;
drop policy if exists p_admin  on public.profiles;
create policy p_read  on public.profiles for select to authenticated using (true);
create policy p_self  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy p_admin on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- সব কর্মী সব কাস্টমার দেখতে পাবে — একই বাড়ি দুইবার তোলা ঠেকাতে
drop policy if exists c_read   on public.customers;
drop policy if exists c_insert on public.customers;
drop policy if exists c_update on public.customers;
drop policy if exists c_delete on public.customers;
create policy c_read   on public.customers for select to authenticated using (public.is_active());
create policy c_insert on public.customers for insert to authenticated with check (public.is_active());
create policy c_update on public.customers for update to authenticated
  using (public.is_admin() or (public.is_active() and created_by = auth.uid()))
  with check (public.is_admin() or created_by = auth.uid());
create policy c_delete on public.customers for delete to authenticated using (public.is_admin());

drop policy if exists s_read  on public.settings;
drop policy if exists s_write on public.settings;
create policy s_read  on public.settings for select to authenticated using (public.is_active());
create policy s_write on public.settings for all    to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists a_read on public.audit;
create policy a_read on public.audit for select to authenticated using (public.is_admin());

-- ── ৬. বাড়ির ছবির জায়গা ─────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists ph_read   on storage.objects;
drop policy if exists ph_write  on storage.objects;
drop policy if exists ph_delete on storage.objects;
create policy ph_read   on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_active());
create policy ph_write  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_active());
create policy ph_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_admin());

-- ═══════════════════════════════════════════════════════════
--  শেষ। এখন Authentication → Users → Add user দিয়ে
--  নিজের অ্যাকাউন্ট খুলুন, তারপর নিচের লাইনটা একবার চালান
--  (your@email.com-এর জায়গায় নিজের ইমেইল বসিয়ে):
--
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'your@email.com');
-- ═══════════════════════════════════════════════════════════
