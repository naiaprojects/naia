-- Enable Storage for the 'settings' bucket
-- Note: You have already created the bucket 'settings'. These policies ensure it is accessible.

-- Allow public read access to the settings bucket
create policy "Public Access to Settings"
  on storage.objects for select
  using ( bucket_id = 'settings' );

-- Allow authenticated users (admin) to upload/update/delete files in settings bucket
create policy "Admin Upload Settings"
  on storage.objects for insert
  with check ( bucket_id = 'settings' );

create policy "Admin Update Settings"
  on storage.objects for update
  with check ( bucket_id = 'settings' );

create policy "Admin Delete Settings"
  on storage.objects for delete
  using ( bucket_id = 'settings' );

-- Initial Data for Site Settings (Colors and Branding)
-- This ensures the keys exist so the admin panel can update them.
insert into site_settings (key, value)
values 
  ('primary_color', '#14dff2'),
  ('secondary_color', '#3ebded'),
  ('favicon_url', ''),
  ('app_icon_url', ''),
  ('splash_icon_url', '')
on conflict (key) do nothing;
