create table videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  cloudflare_uid text not null,
  titre text,
  status text default 'processing',
  created_at timestamp default now()
);