-- Run in Supabase → SQL Editor.
create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text not null default '',
  role text not null default 'adopter' check (role in ('adopter','owner','ngo','volunteer','admin')),
  phone text default '', city text default '', created_at timestamptz default now());
alter table public.profiles enable row level security;

create function public.is_admin() returns boolean language sql security definer set search_path=public stable
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;

create policy "read own or admin" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "update own row"    on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());
-- No insert/delete policies: profiles are created only by the trigger below.
-- Column-level privilege: users may edit ONLY name/phone/city, never role or email.
revoke update on public.profiles from authenticated, anon;
grant  update (name, phone, city) on public.profiles to authenticated;

-- Create a profile on signup. Admin can NEVER be self-assigned: any other/unknown role becomes 'adopter'.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,name,role) values(new.id,new.email,
    coalesce(left(new.raw_user_meta_data->>'name',100),''),
    case when new.raw_user_meta_data->>'role' in ('adopter','owner','ngo','volunteer')
         then new.raw_user_meta_data->>'role' else 'adopter' end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Only an existing admin can change roles (including granting admin).
create function public.grant_role(target uuid,new_role text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can change roles'; end if;
  if new_role not in ('adopter','owner','ngo','volunteer','admin') then raise exception 'Invalid role'; end if;
  if target=auth.uid() then raise exception 'You cannot change your own role'; end if;
  update public.profiles set role=new_role where id=target;
end $$;
revoke all on function public.grant_role(uuid,text) from public, anon;
grant execute on function public.grant_role(uuid,text) to authenticated;

-- BOOTSTRAP the first admin by hand (after that person has registered), in the SQL editor:
-- update public.profiles set role='admin' where email='you@example.com';
