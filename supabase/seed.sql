-- Seed data. NO coordinates are guessed. Candidate buildings come from the roadmap
-- ("Air University Portfolio Report 2019", historical) and are NEEDS_CONFIRMATION.
insert into public.categories (name, slug, icon, sort_order) values
  ('Academic', 'academic', 'graduation-cap', 1),
  ('Administration', 'administration', 'building-2', 2),
  ('Student Services', 'student-services', 'users', 3),
  ('Library', 'library', 'library', 4),
  ('Laboratory', 'laboratory', 'flask-conical', 5),
  ('Food and Cafeteria', 'food-and-cafeteria', 'utensils', 6),
  ('Parking', 'parking', 'car', 7),
  ('Transport', 'transport', 'bus', 8),
  ('Sports and Recreation', 'sports-and-recreation', 'dumbbell', 9),
  ('Other Facilities', 'other-facilities', 'map-pin', 10)
on conflict (slug) do nothing;

insert into public.locations (name, slug, description, category_id, aliases, public_access,
                              verification_status, is_published)
select v.name, v.slug,
  'Candidate record from a historical university portfolio report. Name, use, access and position are NEEDS CONFIRMATION.',
  c.id, v.aliases, 'UNKNOWN', 'NEEDS_CONFIRMATION', true
from (values
  ('Administration Block', 'administration-block', 'administration', array['Admin Block','Administration']),
  ('Academic Block A', 'academic-block-a', 'academic', array[]::text[]),
  ('Academic Block B', 'academic-block-b', 'academic', array[]::text[]),
  ('Academic Mini Block', 'academic-mini-block', 'academic', array[]::text[]),
  ('TTI Academic Block', 'tti-academic-block', 'academic', array['TTI']),
  ('Industry Research Center (IRC)', 'industry-research-center-irc', 'other-facilities', array['IRC']),
  ('Workshop', 'workshop', 'other-facilities', array[]::text[]),
  ('IAA Block', 'iaa-block', 'other-facilities', array['IAA']),
  ('Students Services Center', 'students-services-center', 'student-services', array['SSC','Student Services Center']),
  ('Language Training Center', 'language-training-center', 'academic', array[]::text[]),
  ('Library', 'library', 'library', array[]::text[])
) as v(name, slug, cat, aliases)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;
