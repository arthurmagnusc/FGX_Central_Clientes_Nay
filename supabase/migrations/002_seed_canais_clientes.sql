-- Migration 002: Seed data (canais e clientes)
INSERT INTO channel (slug, nome, limite_caracteres_padrao) VALUES
  ('redes_sociais', 'Redes Sociais', 2200),
  ('blog', 'Blog', 6000),
  ('newsletter', 'Newsletter', 4000),
  ('video', 'Vídeo', 3000);

INSERT INTO client (nome, slug, ativo) VALUES
  ('Freire, Gerbasi e Bittencourt', 'fgb', false),
  ('Fiedra, Britto e Ferreira Neto', 'fiedra', false),
  ('Reis, Souza, Takeishi e Arsuffi', 'rsta', false);

-- Assign all 4 channels to fgb and rsta; 3 to fiedra (no video)
DO $$
DECLARE
  fgb_id UUID := (SELECT id FROM client WHERE slug = 'fgb');
  fiedra_id UUID := (SELECT id FROM client WHERE slug = 'fiedra');
  rsta_id UUID := (SELECT id FROM client WHERE slug = 'rsta');
  ch RECORD;
BEGIN
  FOR ch IN SELECT id, slug FROM channel LOOP
    IF ch.slug != 'video' THEN
      INSERT INTO client_channel (client_id, channel_id) VALUES (fiedra_id, ch.id);
    END IF;
    INSERT INTO client_channel (client_id, channel_id) VALUES (fgb_id, ch.id);
    INSERT INTO client_channel (client_id, channel_id) VALUES (rsta_id, ch.id);
  END LOOP;
END $$;
