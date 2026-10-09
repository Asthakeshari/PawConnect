-- Run AFTER schema.sql, in Supabase → SQL Editor. Review before running; not yet executed against a live project.
alter table public.profiles add column ngo_verified boolean not null default false;  -- only changed by review_ngo()

-- Safe public view: exposes NO email/phone. (Runs with owner rights by design; Supabase may show a lint note.)
create view public.public_profiles as select id,name,role,ngo_verified from public.profiles;
grant select on public.public_profiles to anon, authenticated;

create function public.notify(u uuid,t text,b text,l text) returns void language sql security definer set search_path=public
as $$ insert into public.notifications(user_id,title,body,link) values(u,t,b,l) $$;

-- ===== PETS =====
create table public.pets(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 80),
  species text not null check(species in ('Dog','Cat','Rabbit','Bird','Other')),
  breed text not null check(char_length(breed)<=80), age numeric not null check(age>=0 and age<=40),
  gender text not null check(gender in ('Male','Female')), size text not null check(size in ('Small','Medium','Large')),
  location text not null check(char_length(location)<=120), vaccinated boolean not null default false,
  medical text default '' check(char_length(medical)<=1000), behaviour text not null check(char_length(behaviour)<=1000),
  reason text not null check(char_length(reason)<=1000), photos text[] not null default '{}', video text,
  status text not null default 'active' check(status in ('active','adopted','removed')), created_at timestamptz default now());
alter table public.pets enable row level security;
create policy pets_read on public.pets for select using (status<>'removed' or owner_id=auth.uid() or public.is_admin());
create policy pets_insert on public.pets for insert with check (owner_id=auth.uid()
  and exists(select 1 from public.profiles where id=auth.uid() and role in ('owner','ngo','admin')));
create policy pets_update on public.pets for update using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy pets_delete on public.pets for delete using (owner_id=auth.uid() or public.is_admin());
revoke update on public.pets from authenticated, anon;   -- status is changed only by triggers / set_pet_status()
grant update (name,species,breed,age,gender,size,location,vaccinated,medical,behaviour,reason,photos,video) on public.pets to authenticated;

create function public.is_pet_owner(p uuid) returns boolean language sql security definer set search_path=public stable
as $$ select exists(select 1 from public.pets where id=p and owner_id=auth.uid()) $$;

-- ===== APPLICATIONS =====
create table public.applications(
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  adopter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  answers jsonb not null, status text not null default 'Pending' check(status in ('Pending','Approved','Rejected')),
  created_at timestamptz default now(), unique(pet_id,adopter_id));
alter table public.applications enable row level security;
create policy app_read on public.applications for select using (adopter_id=auth.uid() or public.is_pet_owner(pet_id) or public.is_admin());
create policy app_insert on public.applications for insert with check (adopter_id=auth.uid()
  and exists(select 1 from public.profiles where id=auth.uid() and role='adopter')
  and exists(select 1 from public.pets where id=pet_id and status='active' and owner_id<>auth.uid()));
create policy app_decide on public.applications for update using (public.is_pet_owner(pet_id)) with check (public.is_pet_owner(pet_id));
revoke update on public.applications from authenticated, anon; grant update (status) on public.applications to authenticated;

create function public.is_app_member(a uuid) returns boolean language sql security definer set search_path=public stable
as $$ select exists(select 1 from public.applications ap join public.pets p on p.id=ap.pet_id
  where ap.id=a and (ap.adopter_id=auth.uid() or p.owner_id=auth.uid())) $$;

-- ===== PRIVATE CHAT (admins deliberately have NO access) =====
create table public.messages(
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id),
  body text not null check(char_length(body) between 1 and 2000), created_at timestamptz default now());
alter table public.messages enable row level security;
create policy msg_read on public.messages for select using (public.is_app_member(application_id));
create policy msg_send on public.messages for insert with check (sender_id=auth.uid() and public.is_app_member(application_id));

-- ===== NOTIFICATIONS (rows are created only by triggers) =====
create table public.notifications(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, body text default '', link text default '', read boolean not null default false, created_at timestamptz default now());
alter table public.notifications enable row level security;
create policy note_read on public.notifications for select using (user_id=auth.uid());
create policy note_mark on public.notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());
revoke update on public.notifications from authenticated, anon; grant update (read) on public.notifications to authenticated;

-- ===== AGREEMENTS & FOLLOW-UPS =====
create table public.agreements(
  application_id uuid primary key references public.applications(id) on delete cascade, terms text not null,
  owner_signed_at timestamptz, adopter_signed_at timestamptz, created_at timestamptz default now());
alter table public.agreements enable row level security;
create policy agr_read on public.agreements for select using (public.is_app_member(application_id));
create table public.follow_ups(
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete cascade,
  due_date date not null, status text not null default 'due' check(status in ('due','done')), notes text default '' check(char_length(notes)<=1000));
alter table public.follow_ups enable row level security;
create policy fu_read on public.follow_ups for select using (public.is_app_member(application_id));
create policy fu_upd on public.follow_ups for update using (public.is_app_member(application_id)) with check (public.is_app_member(application_id));
revoke update on public.follow_ups from authenticated, anon; grant update (status,notes) on public.follow_ups to authenticated;

-- ===== TRIGGERS =====
create function public.trg_app_insert() returns trigger language plpgsql security definer set search_path=public as $$
declare o uuid; n text; begin select owner_id,name into o,n from pets where id=new.pet_id;
  perform notify(o,'New adoption application','Someone applied to adopt '||n,'/owner'); return new; end $$;
create trigger app_ins after insert on public.applications for each row execute function public.trg_app_insert();

create function public.trg_app_update() returns trigger language plpgsql security definer set search_path=public as $$
declare n text; begin
  if old.status<>'Pending' then raise exception 'Application already decided'; end if;
  select name into n from pets where id=new.pet_id;
  perform notify(new.adopter_id,'Application '||lower(new.status),'Your application for '||n||' was '||lower(new.status),'/applications');
  if new.status='Approved' then
    update pets set status='adopted' where id=new.pet_id;
    insert into agreements(application_id,terms) values(new.id,
      E'1. The adopter will provide food, shelter, vet care and a safe home.\n2. The pet will not be sold, abandoned, bred or given away without telling the owner.\n3. If the adopter can no longer keep the pet, they will contact the owner first.\n4. The adopter agrees to follow-up check-ins at 7, 30 and 90 days.\n(Template only - have it reviewed by a lawyer before relying on it.)');
    insert into follow_ups(application_id,due_date) select new.id,current_date+d from unnest(array[7,30,90]) d;
  end if; return new; end $$;
create trigger app_upd after update of status on public.applications for each row when (old.status is distinct from new.status) execute function public.trg_app_update();

create function public.trg_msg() returns trigger language plpgsql security definer set search_path=public as $$
declare a uuid; o uuid; begin
  select ap.adopter_id,p.owner_id into a,o from applications ap join pets p on p.id=ap.pet_id where ap.id=new.application_id;
  if new.sender_id=a then perform notify(o,'New message','You have a new message about an application','/owner');
  else perform notify(a,'New message','You have a new message about your application','/applications'); end if; return new; end $$;
create trigger msg_ins after insert on public.messages for each row execute function public.trg_msg();

create function public.sign_agreement(a uuid) returns void language plpgsql security definer set search_path=public as $$
begin if not is_app_member(a) then raise exception 'Not allowed'; end if;
  if exists(select 1 from applications where id=a and adopter_id=auth.uid())
  then update agreements set adopter_signed_at=coalesce(adopter_signed_at,now()) where application_id=a;
  else update agreements set owner_signed_at=coalesce(owner_signed_at,now()) where application_id=a; end if; end $$;

-- ===== NGO VERIFICATION =====
create table public.ngo_verifications(
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  org_name text not null check(char_length(org_name) between 2 and 120), registration_no text not null check(char_length(registration_no) between 3 and 60),
  document_path text not null, status text not null default 'pending' check(status in ('pending','approved','rejected')),
  note text default '', created_at timestamptz default now());
alter table public.ngo_verifications enable row level security;
create policy ngov_read on public.ngo_verifications for select using (user_id=auth.uid() or public.is_admin());
create policy ngov_ins on public.ngo_verifications for insert with check (user_id=auth.uid() and status='pending'
  and exists(select 1 from public.profiles where id=auth.uid() and role='ngo'));

create function public.review_ngo(p_id uuid,p_approve boolean,p_note text default '') returns void language plpgsql security definer set search_path=public as $$
declare u uuid; begin
  if not is_admin() then raise exception 'Only admins can review'; end if;
  update ngo_verifications set status=case when p_approve then 'approved' else 'rejected' end, note=coalesce(p_note,'')
    where id=p_id and status='pending' returning user_id into u;
  if u is null then raise exception 'Request not found or already reviewed'; end if;
  update profiles set ngo_verified=p_approve where id=u;
  perform notify(u,'NGO verification '||case when p_approve then 'approved' else 'rejected' end,coalesce(p_note,''),'/profile'); end $$;

-- ===== COMMUNITY: volunteer / foster / lost & found =====
create table public.community_posts(
  id uuid primary key default gen_random_uuid(), author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null check(kind in ('volunteer','foster_offer','foster_need','lost','found')),
  title text not null check(char_length(title) between 3 and 120), description text not null check(char_length(description) between 10 and 2000),
  location text not null check(char_length(location)<=120), species text, status text not null default 'open' check(status in ('open','closed','removed')),
  created_at timestamptz default now());
alter table public.community_posts enable row level security;
create policy post_read on public.community_posts for select using (status<>'removed' or author_id=auth.uid() or public.is_admin());
create policy post_ins on public.community_posts for insert with check (author_id=auth.uid() and (kind<>'volunteer' or public.is_admin()
  or exists(select 1 from public.profiles where id=auth.uid() and role='ngo' and ngo_verified)));   -- only VERIFIED NGOs post volunteer roles
create policy post_own on public.community_posts for update using (author_id=auth.uid() and status<>'removed') with check (author_id=auth.uid() and status in ('open','closed'));
revoke update on public.community_posts from authenticated, anon; grant update (status) on public.community_posts to authenticated;
create table public.post_responses(
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  message text not null check(char_length(message) between 2 and 1000), created_at timestamptz default now());
alter table public.post_responses enable row level security;
create policy resp_read on public.post_responses for select using (user_id=auth.uid() or exists(select 1 from public.community_posts p where p.id=post_id and p.author_id=auth.uid()));
create policy resp_ins on public.post_responses for insert with check (user_id=auth.uid());
create function public.trg_resp() returns trigger language plpgsql security definer set search_path=public as $$
declare a uuid; t text; begin select author_id,title into a,t from community_posts where id=new.post_id; perform notify(a,'New response',t,'/community'); return new; end $$;
create trigger resp_ins after insert on public.post_responses for each row execute function public.trg_resp();

-- ===== MODERATION =====
create table public.reports(
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  target_type text not null check(target_type in ('pet','post','user')), target_id uuid not null,
  reason text not null check(char_length(reason) between 5 and 500), status text not null default 'open' check(status in ('open','resolved')), created_at timestamptz default now());
alter table public.reports enable row level security;
create policy rep_read on public.reports for select using (reporter_id=auth.uid() or public.is_admin());
create policy rep_ins on public.reports for insert with check (reporter_id=auth.uid());
create policy rep_upd on public.reports for update using (public.is_admin()) with check (public.is_admin());
revoke update on public.reports from authenticated, anon; grant update (status) on public.reports to authenticated;
create function public.set_pet_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$
begin if not is_admin() then raise exception 'Admins only'; end if; if p_status not in ('active','adopted','removed') then raise exception 'Invalid'; end if;
  update pets set status=p_status where id=p_id; end $$;
create function public.set_post_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$
begin if not is_admin() then raise exception 'Admins only'; end if; if p_status not in ('open','closed','removed') then raise exception 'Invalid'; end if;
  update community_posts set status=p_status where id=p_id; end $$;

-- ===== PAYMENT-READY TABLES (no payments yet). Clients can only READ; writes will come from a server webhook with the service role. =====
create table public.donations(id uuid primary key default gen_random_uuid(), donor_id uuid references public.profiles(id), ngo_id uuid references public.profiles(id),
  amount_cents int not null check(amount_cents>0), currency text not null default 'INR', status text not null default 'unpaid' check(status in ('unpaid','paid','failed','refunded')),
  provider text, provider_ref text, created_at timestamptz default now());
create table public.subscriptions(id uuid primary key default gen_random_uuid(), ngo_id uuid not null references public.profiles(id),
  plan text not null check(plan in ('free','standard','premium')), status text not null default 'inactive', provider_ref text, current_period_end timestamptz);
create table public.sponsorships(id uuid primary key default gen_random_uuid(), sponsor_id uuid references public.profiles(id), pet_id uuid references public.pets(id),
  amount_cents int not null check(amount_cents>0), status text not null default 'unpaid', provider_ref text, created_at timestamptz default now());
alter table public.donations enable row level security; alter table public.subscriptions enable row level security; alter table public.sponsorships enable row level security;
create policy don_read on public.donations for select using (donor_id=auth.uid() or ngo_id=auth.uid() or public.is_admin());
create policy sub_read on public.subscriptions for select using (ngo_id=auth.uid() or public.is_admin());
create policy spo_read on public.sponsorships for select using (sponsor_id=auth.uid() or public.is_admin());

-- ===== STORAGE =====
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('pet-media','pet-media',true,31457280,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']),
 ('ngo-docs','ngo-docs',false,5242880,array['application/pdf','image/jpeg','image/png']) on conflict (id) do nothing;
create policy "pet media read" on storage.objects for select using (bucket_id='pet-media');
create policy "pet media upload" on storage.objects for insert to authenticated with check (bucket_id='pet-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "pet media delete" on storage.objects for delete to authenticated using (bucket_id='pet-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "ngo docs upload" on storage.objects for insert to authenticated with check (bucket_id='ngo-docs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "ngo docs read" on storage.objects for select to authenticated using (bucket_id='ngo-docs' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));

-- ===== REALTIME (chat + notifications; RLS still applies) =====
alter publication supabase_realtime add table public.messages, public.notifications;
