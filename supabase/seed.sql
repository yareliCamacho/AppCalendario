INSERT INTO public.themes (name, primary_blue, primary_pink, is_default)
VALUES ('Romántico clásico', '#B3D9FF', '#FFB3D9', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.romance_messages (body, kind) VALUES
('Cada día a tu lado es mi lugar favorito.', 'home'),
('El amor se multiplica cuando lo compartimos.', 'home'),
('Contigo el tiempo vuela y a la vez se detiene.', 'home'),
('Eres mi hoy y todos mis mañanas.', 'home'),
('Nuestra historia es mi capítulo preferido.', 'home'),
('Gracias por ser mi hogar.', 'home'),
('Juntos convertimos lo ordinario en magia.', 'home'),
('Tu sonrisa es mi mejor vista.', 'home'),
('El destino nos unió y el amor nos mantiene.', 'home'),
('Siempre tú, siempre nosotros.', 'home'),
('Contigo cada día es mi fecha favorita.', 'calendar_quote'),
('El amor no se mira, se siente.', 'calendar_quote'),
('Eres la razón de mi mejor versión.', 'calendar_quote'),
('En tus ojos encontré mi universo.', 'calendar_quote'),
('Cada recuerdo contigo vale oro.', 'calendar_quote');
