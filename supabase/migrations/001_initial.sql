-- profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  grade text,
  school_name text,
  location text,
  interests text[],
  strengths text,
  weaknesses text,
  future_goal text,
  target_universities text[],
  achievements text,
  qualifications text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- self_analysis_results
create table self_analysis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  summary text,
  strengths text,
  personality_type text,
  recommended_themes text[],
  admission_axis text,
  chat_history jsonb,
  created_at timestamptz default now()
);

-- social_issues
create table social_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  description text,
  reason text,
  difficulty text,
  university_connection text,
  action_ideas text,
  is_selected boolean default false,
  created_at timestamptz default now()
);

-- projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  issue text,
  hypothesis text,
  target text,
  description text,
  roadmap jsonb,
  week1_tasks jsonb,
  dm_template text,
  survey_template text,
  success_metrics text,
  status text default 'active',
  created_at timestamptz default now()
);

-- activity_logs
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  date date,
  content text,
  people_met text,
  learning text,
  problem text,
  next_action text,
  ai_feedback jsonb,
  created_at timestamptz default now()
);

-- essays
create table essays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  university text,
  faculty text,
  content text,
  ai_feedback jsonb,
  created_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table self_analysis_results enable row level security;
alter table social_issues enable row level security;
alter table projects enable row level security;
alter table activity_logs enable row level security;
alter table essays enable row level security;

create policy "Users can manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users can manage own self_analysis" on self_analysis_results for all using (auth.uid() = user_id);
create policy "Users can manage own social_issues" on social_issues for all using (auth.uid() = user_id);
create policy "Users can manage own projects" on projects for all using (auth.uid() = user_id);
create policy "Users can manage own activity_logs" on activity_logs for all using (auth.uid() = user_id);
create policy "Users can manage own essays" on essays for all using (auth.uid() = user_id);
