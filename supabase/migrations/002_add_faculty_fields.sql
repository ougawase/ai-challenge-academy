-- 志望学部系統フィールドを追加
alter table profiles
  add column if not exists target_faculties text[] default '{}',
  add column if not exists faculty_direction text;
