DROP DATABASE IF EXISTS odrzavanje_biljaka;

CREATE DATABASE odrzavanje_biljaka;

\c odrzavanje_biljaka

GRANT ALL PRIVILEGES ON DATABASE odrzavanje_biljaka TO postgres;

SET client_encoding = 'UTF8';

-- -----------------------------------------------------
-- Table vrsta_biljke
-- -----------------------------------------------------

CREATE TABLE vrsta_biljke (
    id SERIAL PRIMARY KEY,
    naziv VARCHAR(80) UNIQUE
);

-- -----------------------------------------------------
-- Table biljka
-- -----------------------------------------------------

CREATE TABLE biljka (
    id SERIAL PRIMARY KEY,
    naziv VARCHAR(70),
    datum_sadnje DATE,
    id_vrste INTEGER REFERENCES vrsta_biljke(id) ON DELETE CASCADE,
    datum_zadnjeg_zadatka DATE,
    broj_slika INTEGER DEFAULT 0,
    broj_zadataka INTEGER DEFAULT 0
);

-- -----------------------------------------------------
-- Table slike_biljke
-- -----------------------------------------------------

CREATE TABLE slike_biljke (
    id SERIAL PRIMARY KEY,
    id_biljke INTEGER REFERENCES biljka(id) ON DELETE CASCADE,
    datum_pohrane TIMESTAMP,
    opis TEXT,
    tip VARCHAR(8),
    slika BYTEA
);

-- -----------------------------------------------------
-- Table zadaci
-- -----------------------------------------------------

CREATE TABLE zadaci (
    id SERIAL PRIMARY KEY,
    id_biljke INTEGER REFERENCES biljka(id) ON DELETE CASCADE,
    naziv VARCHAR(50),
    opis TEXT,
    datum DATE,
    izvrsen BOOLEAN DEFAULT false
);

-- -----------------------------------------------------
-- Trigger azuriraj_broj_slika
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION azuriraj_broj_slika()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE biljka
    SET broj_slika = broj_slika + 1
    WHERE id = NEW.id_biljke;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE biljka
    SET broj_slika = broj_slika - 1
    WHERE id = OLD.id_biljke;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broj_slika_azuriranje
    AFTER INSERT OR DELETE ON slike_biljke
    FOR EACH ROW
EXECUTE PROCEDURE azuriraj_broj_slika();

-- -----------------------------------------------------
-- Trigger azuriraj_broj_zadataka
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION azuriraj_broj_zadataka()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.izvrsen THEN
    UPDATE biljka
    SET broj_zadataka = broj_zadataka - 1
    WHERE id = NEW.id_biljke;
  ELSE    
    UPDATE biljka
    SET broj_zadataka = broj_zadataka + 1
    WHERE id = NEW.id_biljke;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broj_zadataka_azuriranje
    AFTER INSERT OR UPDATE OF izvrsen ON zadaci
    FOR EACH ROW
EXECUTE PROCEDURE azuriraj_broj_zadataka();


-- -----------------------------------------------------
-- Trigger azuriraj_datum_nadolazecih_zadataka
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION azuriraj_datum_nadolazecih_zadataka()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE biljka
  SET datum_zadnjeg_zadatka = (
    SELECT MIN(datum)
    FROM zadaci
    WHERE id_biljke = NEW.id_biljke AND datum > CURRENT_DATE
  )
  WHERE id = NEW.id_biljke;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER datum_nadolazecih_zadataka_azuriranje
    AFTER INSERT OR UPDATE OF datum ON zadaci
    FOR EACH ROW
EXECUTE PROCEDURE azuriraj_datum_nadolazecih_zadataka();

-- -----------------------------------------------------
-- Optional: uncomment if necessary
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Index
-- -----------------------------------------------------

-- CREATE INDEX idx_zadaci_id_biljke ON zadaci (id_biljke);
-- CREATE INDEX idx_zadaci_kompozitni ON zadaci (id_biljke, EXTRACT(month FROM datum), EXTRACT(year FROM datum));

\dt 
\df 