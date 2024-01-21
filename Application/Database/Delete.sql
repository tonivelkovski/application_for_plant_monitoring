\c odrzavanje_biljaka

-- -----------------------------------------------------
-- Triggers: brisanje
-- -----------------------------------------------------

DROP TRIGGER IF EXISTS broj_slika_azuriranje ON slike_biljke;
DROP TRIGGER IF EXISTS broj_zadataka_azuriranje ON zadaci;
DROP TRIGGER IF EXISTS datum_nadolazecih_zadataka_azuriranje ON zadaci;

-- -----------------------------------------------------
-- Functions: brisanje
-- -----------------------------------------------------

DROP FUNCTION IF EXISTS azuriraj_broj_slika();
DROP FUNCTION IF EXISTS azuriraj_broj_zadataka();
DROP FUNCTION IF EXISTS azuriraj_datum_nadolazecih_zadataka();

-- -----------------------------------------------------
-- Tables: brisanje
-- -----------------------------------------------------

--DROP TABLE IF EXISTS dogadaji;
DROP TABLE IF EXISTS slike_biljke;
DROP TABLE IF EXISTS zadaci;
DROP TABLE IF EXISTS biljka;
DROP TABLE IF EXISTS vrsta_biljke;

-- -----------------------------------------------------
-- Optional: uncomment if necessary
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Indexes: brisanje
-- -----------------------------------------------------

-- DROP INDEX IF EXISTS idx_zadaci_id_biljke;
-- DROP INDEX IF EXISTS idx_zadaci_kompozitni;