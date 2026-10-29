CREATE OR REPLACE FUNCTION public.tg_activate_referral()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare r referrals%rowtype; month_count int; award int := 0;
begin
  if new.amount <= 0 then return new; end if;
  -- Solo actividades corregidas por el servidor activan el premio de embajador.
  if coalesce(new.metadata->>'verified', '') <> 'true' or coalesce(new.metadata->>'correct', '') <> 'true' then
    return new;
  end if;
  select * into r from referrals where referred_user_id = new.user_id and activated_at is null for update;
  if not found then return new; end if;
  select count(*) into month_count from referrals
    where referrer_id = r.referrer_id and activated_at >= date_trunc('month', now()) and xp_awarded > 0;
  if month_count < 20 then award := 50; end if;
  update referrals set activated_at = now(), xp_awarded = award where referred_user_id = new.user_id;
  return new;
end $function$;