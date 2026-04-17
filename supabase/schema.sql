-- ============================================================
-- FitCoach Supabase Schema
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- KAYIT FONKSİYONLARI (SECURITY DEFINER)
-- Email onayı olmadan da çalışır — RLS bypass
-- ============================================================

create or replace function public.register_athlete(
  p_user_id    uuid,
  p_email      text,
  p_first_name text,
  p_last_name  text,
  p_age        integer,
  p_gender     text,
  p_fitness_goal    text,
  p_experience_level text,
  p_notes      text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, first_name, last_name, user_type)
  values (p_user_id, p_email, p_first_name, p_last_name, 'athlete')
  on conflict (id) do update
    set email = p_email, first_name = p_first_name, last_name = p_last_name;

  insert into athlete_profiles (id, age, gender, fitness_goal, experience_level, notes)
  values (p_user_id, p_age, p_gender, p_fitness_goal, p_experience_level, p_notes)
  on conflict (id) do update
    set age = p_age, gender = p_gender,
        fitness_goal = p_fitness_goal,
        experience_level = p_experience_level,
        notes = p_notes;
end;
$$;

create or replace function public.register_pt(
  p_user_id         uuid,
  p_email           text,
  p_first_name      text,
  p_last_name       text,
  p_bio             text,
  p_specializations text[],
  p_certificates    text,
  p_experience_years integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, first_name, last_name, user_type)
  values (p_user_id, p_email, p_first_name, p_last_name, 'pt')
  on conflict (id) do update
    set email = p_email, first_name = p_first_name, last_name = p_last_name;

  insert into pt_profiles (id, bio, specializations, certificates, experience_years,
                            max_students, is_available, rating, review_count)
  values (p_user_id, p_bio, p_specializations, p_certificates, p_experience_years,
          10, true, 0, 0)
  on conflict (id) do update
    set bio = p_bio, specializations = p_specializations,
        certificates = p_certificates, experience_years = p_experience_years;
end;
$$;

create or replace function public.register_pt_package(
  p_id              uuid,
  p_pt_id           uuid,
  p_level           text,
  p_name            text,
  p_price           numeric,
  p_duration_weeks  integer,
  p_sessions_per_week integer,
  p_features        text[],
  p_is_popular      boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into pt_packages (id, pt_id, level, name, price, duration_weeks,
                            sessions_per_week, features, is_popular)
  values (p_id, p_pt_id, p_level, p_name, p_price, p_duration_weeks,
          p_sessions_per_week, p_features, p_is_popular)
  on conflict (id) do nothing;
end;
$$;

-- ============================================================
-- TABLES
-- ============================================================

-- Shared profiles (references auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  first_name text not null,
  last_name text not null,
  user_type text not null check (user_type in ('athlete', 'pt')),
  avatar text,
  created_at timestamptz default now()
);

-- Athlete profiles
create table public.athlete_profiles (
  id uuid references public.profiles on delete cascade primary key,
  age integer,
  gender text check (gender in ('male', 'female', 'other')),
  fitness_goal text,
  experience_level text,
  active_pt_id uuid references public.profiles(id),
  active_package_id uuid,
  notes text
);

-- PT profiles
create table public.pt_profiles (
  id uuid references public.profiles on delete cascade primary key,
  bio text,
  specializations text[],
  certificates text,
  experience_years integer default 0,
  rating numeric(3,2) default 0,
  review_count integer default 0,
  max_students integer default 10,
  is_available boolean default true
);

-- PT coaching packages
create table public.pt_packages (
  id uuid default uuid_generate_v4() primary key,
  pt_id uuid references public.profiles(id) on delete cascade,
  level text not null check (level in ('starter', 'intermediate', 'professional')),
  name text not null,
  price numeric not null,
  duration_weeks integer not null,
  sessions_per_week integer not null,
  features text[],
  is_popular boolean default false,
  created_at timestamptz default now()
);
create index idx_pt_packages_pt_id on public.pt_packages(pt_id);

-- PT students (many-to-many)
create table public.pt_students (
  pt_id uuid references public.profiles(id) on delete cascade,
  athlete_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (pt_id, athlete_id)
);

-- Coaching requests
create table public.coaching_requests (
  id uuid default uuid_generate_v4() primary key,
  athlete_id uuid references public.profiles(id) on delete cascade,
  pt_id uuid references public.profiles(id) on delete cascade,
  package_id uuid references public.pt_packages(id),
  package_name text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  athlete_name text,
  athlete_avatar text,
  created_at timestamptz default now()
);
create index idx_coaching_requests_pt_id on public.coaching_requests(pt_id, status);
create index idx_coaching_requests_athlete_id on public.coaching_requests(athlete_id);

-- Conversations
create table public.conversations (
  id text primary key,
  athlete_id uuid references public.profiles(id),
  pt_id uuid references public.profiles(id),
  athlete_name text,
  pt_name text,
  athlete_avatar text,
  pt_avatar text,
  last_message text,
  last_message_time timestamptz default now(),
  unread_athlete integer default 0,
  unread_pt integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index idx_conversations_athlete on public.conversations(athlete_id);
create index idx_conversations_pt on public.conversations(pt_id);

-- Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id text references public.conversations(id) on delete cascade,
  sender_id text,
  sender_type text check (sender_type in ('athlete', 'pt', 'system')),
  content text not null,
  type text default 'text' check (type in ('text', 'system')),
  is_read boolean default false,
  created_at timestamptz default now()
);
create index idx_messages_conversation on public.messages(conversation_id, created_at);

-- Gallery items
create table public.gallery_items (
  id uuid default uuid_generate_v4() primary key,
  pt_id uuid references public.profiles(id) on delete cascade,
  before_image text,
  after_image text,
  description text,
  student_name text,
  created_at timestamptz default now()
);
create index idx_gallery_pt on public.gallery_items(pt_id);

-- Reviews
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  pt_id uuid references public.profiles(id) on delete cascade,
  athlete_id uuid references public.profiles(id),
  athlete_name text,
  athlete_avatar text,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
create index idx_reviews_pt on public.reviews(pt_id);

-- Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text,
  title text,
  message text,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index idx_notifications_user on public.notifications(user_id, is_read);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.pt_profiles enable row level security;
alter table public.pt_packages enable row level security;
alter table public.pt_students enable row level security;
alter table public.coaching_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.gallery_items enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- profiles: everyone can read, only owner can write
create policy "Profiles are public" on public.profiles
  for select using (true);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- athlete_profiles
create policy "Athlete profiles are public" on public.athlete_profiles
  for select using (true);
create policy "Athletes can insert own profile" on public.athlete_profiles
  for insert with check (auth.uid() = id);
create policy "Athletes can update own profile" on public.athlete_profiles
  for update using (auth.uid() = id);

-- pt_profiles
create policy "PT profiles are public" on public.pt_profiles
  for select using (true);
create policy "PTs can insert own profile" on public.pt_profiles
  for insert with check (auth.uid() = id);
create policy "PTs can update own profile" on public.pt_profiles
  for update using (auth.uid() = id);

-- pt_packages: everyone can read, only owner can write
create policy "Packages are public" on public.pt_packages
  for select using (true);
create policy "PTs can manage own packages" on public.pt_packages
  for insert with check (auth.uid() = pt_id);
create policy "PTs can update own packages" on public.pt_packages
  for update using (auth.uid() = pt_id);
create policy "PTs can delete own packages" on public.pt_packages
  for delete using (auth.uid() = pt_id);

-- pt_students
create policy "Students visible to involved parties" on public.pt_students
  for select using (auth.uid() = pt_id or auth.uid() = athlete_id);
create policy "PTs can insert students" on public.pt_students
  for insert with check (auth.uid() = pt_id);
create policy "PTs can remove students" on public.pt_students
  for delete using (auth.uid() = pt_id);

-- coaching_requests
create policy "Users see own requests" on public.coaching_requests
  for select using (auth.uid() = athlete_id or auth.uid() = pt_id);
create policy "Athletes can create requests" on public.coaching_requests
  for insert with check (auth.uid() = athlete_id);
create policy "PTs can update request status" on public.coaching_requests
  for update using (auth.uid() = pt_id);

-- conversations
create policy "Users see own conversations" on public.conversations
  for select using (auth.uid() = athlete_id or auth.uid() = pt_id);
create policy "Users can create conversations" on public.conversations
  for insert with check (auth.uid() = athlete_id or auth.uid() = pt_id);
create policy "Users can update own conversations" on public.conversations
  for update using (auth.uid() = athlete_id or auth.uid() = pt_id);

-- messages
create policy "Users see messages in own conversations" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.athlete_id = auth.uid() or c.pt_id = auth.uid())
    )
  );
create policy "Users can send messages" on public.messages
  for insert with check (
    sender_id = auth.uid()::text
    or sender_id = 'system'
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.athlete_id = auth.uid() or c.pt_id = auth.uid())
    )
  );

-- gallery_items: public read, pt can manage
create policy "Gallery is public" on public.gallery_items
  for select using (true);
create policy "PTs can manage own gallery" on public.gallery_items
  for all using (auth.uid() = pt_id);

-- reviews: public read, athletes can write
create policy "Reviews are public" on public.reviews
  for select using (true);
create policy "Athletes can write reviews" on public.reviews
  for insert with check (auth.uid() = athlete_id);

-- notifications: private
create policy "Users see own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Anyone can create notifications" on public.notifications
  for insert with check (true);
create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- ============================================================
-- REALTIME (mesajlar için)
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.coaching_requests;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  10485760,  -- 10MB
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict do nothing;

-- Storage policies: avatars
create policy "Avatar images are public" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies: gallery
create policy "Gallery images are public" on storage.objects
  for select using (bucket_id = 'gallery');

create policy "PTs can upload gallery" on storage.objects
  for insert with check (
    bucket_id = 'gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "PTs can delete own gallery" on storage.objects
  for delete using (
    bucket_id = 'gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
