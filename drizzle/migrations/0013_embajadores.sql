create table if not exists public.ambassador_codes (
  user_id uuid primary key,
  code text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.referrals (
  referred_user_id uuid primary key,
  referrer_id uuid not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  xp_awarded integer not null default 0
);
create index if not exists referrals_referrer_idx on public.referrals(referrer_id);
grant select on public.ambassador_codes to authenticated;
grant all on public.ambassador_codes to service_role;
grant all on public.referrals to service_role;
alter table public.ambassador_codes enable row level security;
alter table public.referrals enable row level security;
create policy "Ver mi propio codigo" on public.ambassador_codes for select to authenticated using (auth.uid() = user_id);

create or replace function public.get_ambassador_code(_user_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if auth.uid() is distinct from _user_id then raise exception 'forbidden'; end if;
  select code into c from ambassador_codes where user_id = _user_id;
  if c is not null then return c; end if;
  loop
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into ambassador_codes(user_id, code) values (_user_id, c);
      return c;
    exception when unique_violation then
      select code into c from ambassador_codes where user_id = _user_id;
      if c is not null then return c; end if;
    end;
  end loop;
end $$;

create or replace function public.claim_referral(_user_id uuid, _code text)
returns text language plpgsql security definer set search_path = public as $$
declare ref uuid; created timestamptz;
begin
  if auth.uid() is distinct from _user_id then raise exception 'forbidden'; end if;
  select user_id into ref from ambassador_codes where code = upper(trim(_code));
  if ref is null then return 'invalid'; end if;
  if ref = _user_id then return 'self'; end if;
  if exists (select 1 from referrals where referred_user_id = _user_id) then return 'already'; end if;
  select created_at into created from auth.users where id = _user_id;
  if created < now() - interval '7 days' then return 'too_old'; end if;
  if exists (select 1 from xp_transactions where user_id = _user_id and amount > 0) then return 'too_old'; end if;
  insert into referrals(referred_user_id, referrer_id) values (_user_id, ref);
  return 'ok';
end $$;

create or replace function public.tg_activate_referral()
returns trigger language plpgsql security definer set search_path = public as $$
declare r referrals%rowtype; month_count int; award int := 0;
begin
  if new.amount <= 0 then return new; end if;
  select * into r from referrals where referred_user_id = new.user_id and activated_at is null for update;
  if not found then return new; end if;
  select count(*) into month_count from referrals
    where referrer_id = r.referrer_id and activated_at >= date_trunc('month', now()) and xp_awarded > 0;
  if month_count < 20 then award := 50; end if;
  update referrals set activated_at = now(), xp_awarded = award where referred_user_id = new.user_id;
  return new;
end $$;

drop trigger if exists activate_referral on public.xp_transactions;
create trigger activate_referral after insert on public.xp_transactions
  for each row execute function public.tg_activate_referral();

create or replace function public.my_ambassador_summary(_user_id uuid)
returns table(invited bigint, started bigint, ambassador_xp bigint)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is distinct from _user_id then raise exception 'forbidden'; end if;
  return query select count(*), count(r.activated_at), coalesce(sum(r.xp_awarded), 0)::bigint
    from referrals r where r.referrer_id = _user_id;
end $$;

revoke execute on function public.get_ambassador_code(uuid) from public, anon;
revoke execute on function public.claim_referral(uuid, text) from public, anon;
revoke execute on function public.my_ambassador_summary(uuid) from public, anon;
revoke execute on function public.tg_activate_referral() from public, anon, authenticated;
grant execute on function public.get_ambassador_code(uuid) to authenticated;
grant execute on function public.claim_referral(uuid, text) to authenticated;
grant execute on function public.my_ambassador_summary(uuid) to authenticated;