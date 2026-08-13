insert into public.programs (name) values
  ('Artificial Intelligence'), ('Computer Science'), ('Data Science'), ('Business'), ('Product Management')
on conflict (name) do nothing;
insert into public.interests (name) values
  ('Artificial Intelligence'), ('Startups'), ('Design'), ('Robotics'), ('Film'), ('Football'), ('Data'), ('Open source'), ('Debate'), ('Climate')
on conflict (name) do nothing;
insert into public.skills (name) values
  ('Python'), ('JavaScript'), ('TypeScript'), ('Machine Learning'), ('UI/UX'), ('Marketing'), ('Finance'), ('Video'), ('Robotics'), ('Research'), ('Writing'), ('SQL')
on conflict (name) do nothing;
insert into public.opportunities (organization, title, opportunity_type, deadline, location, is_remote, description, external_url) values
  ('Yandex Qazaqstan','ML Engineering Internship','Internship','2026-08-24 18:00:00+05','Almaty',false,'Work with search and recommendation teams on production ML systems.','https://example.com/yandex-ml'),
  ('Astana Hub','Startup Garage Fall Cohort','Startup program','2026-08-28 18:00:00+05','Astana',true,'A ten-week validation program for student and first-time founders.','https://example.com/startup-garage'),
  ('inDrive','Global Hackathon: Mobility for All','Hackathon','2026-09-01 18:00:00+05','Online',true,'Prototype equitable mobility products with international teams.','https://example.com/indrive-hack'),
  ('Bolashaq Development Fund','Emerging Researchers Grant','Grant','2026-09-10 18:00:00+05','Kazakhstan',true,'Small grants for undergraduate research with a faculty mentor.','https://example.com/research-grant'),
  ('UNDP Kazakhstan','Climate Data Volunteer','Volunteer','2026-09-12 18:00:00+05','Hybrid',true,'Support open-data research for local climate resilience projects.','https://example.com/undp-climate'),
  ('Kaspi.kz','Product Analytics Intern','Internship','2026-09-15 18:00:00+05','Almaty',false,'Help product teams understand behavior through experiments and data.','https://example.com/kaspi-analytics'),
  ('TechWomen Central Asia','Women in Tech Scholarship','Scholarship','2026-09-18 18:00:00+05','Central Asia',true,'Tuition and mentorship support for women pursuing technical degrees.','https://example.com/techwomen'),
  ('MOST Ventures','Student Venture Scout','Part-time','2026-09-20 18:00:00+05','Almaty',true,'Find promising student founders and map emerging campus projects.','https://example.com/most-scout'),
  ('NASA Space Apps Almaty','Local Challenge Weekend','Competition','2026-10-02 18:00:00+05','Almaty',false,'Use open space and earth data to solve global challenges.','https://example.com/space-apps'),
  ('Qazaq Green','Circular Campus Challenge','Competition','2026-10-08 18:00:00+05','Kazakhstan',true,'Pitch practical ways to reduce waste across university campuses.','https://example.com/circular-campus');
