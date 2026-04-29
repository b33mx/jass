create table task_images (
  image_id     int generated always as identity primary key,
  task_id      int not null references tasks(task_id) on delete cascade,
  file_name    text not null,
  public_url   text not null,
  storage_path text not null,
  module       int not null default 1,
  created_at   timestamptz not null default now()
);

alter table tasks drop column if exists image_urls;
