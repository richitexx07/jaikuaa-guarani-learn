-- El grupo del piloto (profiles.cohort) solo lo asigna el servidor (administrador o código de piloto).
-- Un usuario puede editar su nombre, pero no anotarse solo en un grupo: así los números del piloto
-- que ven el Ateneo y los auspiciantes son reales.
create or replace function public.protect_profile_cohort()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.cohort := null;
    elsif new.cohort is distinct from old.cohort then
      new.cohort := old.cohort;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_cohort on public.profiles;
create trigger protect_profile_cohort
  before insert or update on public.profiles
  for each row execute function public.protect_profile_cohort();
