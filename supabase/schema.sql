-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Meetings table
create table public.meetings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Meeting',
  platform text not null default 'direct' check (platform in ('zoom','teams','meet','direct','upload')),
  status text not null default 'recording' check (status in ('recording','processing','done','error')),
  language text not null default 'mixed' check (language in ('si','en','mixed')),
  duration_seconds integer,
  audio_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Transcript segments table
create table public.transcript_segments (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings(id) on delete cascade not null,
  start_time float not null,
  end_time float not null,
  text text not null,
  language text default 'mixed',
  speaker text,
  created_at timestamptz default now() not null
);

-- Meeting notes table
create table public.meeting_notes (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings(id) on delete cascade unique not null,
  summary text not null default '',
  action_items jsonb not null default '[]',
  key_points jsonb not null default '[]',
  decisions jsonb not null default '[]',
  created_at timestamptz default now() not null
);

-- Row Level Security
alter table public.meetings enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.meeting_notes enable row level security;

-- RLS Policies: users see only their own data
create policy "Users can manage own meetings"
  on public.meetings for all using (auth.uid() = user_id);

create policy "Users can view own segments"
  on public.transcript_segments for all
  using (meeting_id in (select id from public.meetings where user_id = auth.uid()));

create policy "Users can view own notes"
  on public.meeting_notes for all
  using (meeting_id in (select id from public.meetings where user_id = auth.uid()));

-- Storage bucket for audio files
insert into storage.buckets (id, name, public) values ('audio', 'audio', false);

create policy "Users can upload own audio"
  on storage.objects for insert
  with check (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own audio"
  on storage.objects for select
  using (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own audio"
  on storage.objects for delete
  using (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);
