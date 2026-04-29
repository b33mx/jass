alter table tasks add column if not exists image_urls text[] not null default '{}';
