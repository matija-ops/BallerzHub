-- Übernimmt Bilder bereits freigegebener Court-Vorschläge in die öffentliche
-- Court-Bilder-Tabelle. Die Zuordnung erfolgt über Name und Koordinaten,
-- da courts keinen proposal_id-Verweis speichern.
insert into public.court_images (court_id, image_url, media_type, user_id)
select
  c.id,
  pi.image_url,
  pi.media_type,
  pi.user_id
from public.courts c
join public.court_proposals p
  on p.name = c.name
 and abs(p.latitude - c.latitude) <= 0.00001
 and abs(p.longitude - c.longitude) <= 0.00001
 and p.status = 'approved'
join public.court_proposal_images pi
  on pi.proposal_id = p.id
where not exists (
  select 1
  from public.court_images ci
  where ci.court_id = c.id
    and ci.image_url = pi.image_url
);
