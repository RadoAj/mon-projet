--
-- PostgreSQL database dump
-- Système de Gestion État Civil - Fianarantsoa
-- Version nettoyée pour import
--

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =====================================================
-- SUPPRESSION ET CRÉATION DE LA BASE
-- =====================================================
DROP DATABASE IF EXISTS etat_civil_fianarantsoa;

CREATE DATABASE etat_civil_fianarantsoa 
    WITH TEMPLATE = template0 
    ENCODING = 'UTF8' 
    LOCALE_PROVIDER = libc 
    LOCALE = 'French_France.1252';

ALTER DATABASE etat_civil_fianarantsoa OWNER TO postgres;

\connect etat_civil_fianarantsoa

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- =====================================================
-- TABLE 1 : ACTES DE DÉCÈS
-- =====================================================
CREATE TABLE public.actes_deces (
    id integer NOT NULL,
    numero_acte character varying(50) NOT NULL,
    annee integer NOT NULL,
    defunt_id integer,
    nom character varying(100) NOT NULL,
    prenoms character varying(200) NOT NULL,
    date_naissance date,
    lieu_naissance character varying(200),
    age integer,
    sexe character varying(10),
    profession character varying(150),
    domicile text,
    nom_pere character varying(100),
    prenoms_pere character varying(200),
    nom_mere character varying(100),
    prenoms_mere character varying(200),
    date_deces date NOT NULL,
    heure_deces time without time zone,
    lieu_deces character varying(200) NOT NULL,
    cause_deces text,
    declarant_nom character varying(100),
    declarant_prenoms character varying(200),
    declarant_qualite character varying(100),
    declarant_age integer,
    declarant_domicile text,
    medecin_nom character varying(100),
    medecin_prenoms character varying(200),
    certificat_medical boolean DEFAULT false,
    officier_etat_civil character varying(200),
    user_id integer,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_modification timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pere_date_naissance date,
    pere_lieu_naissance character varying(200),
    pere_profession character varying(150),
    mere_date_naissance date,
    mere_lieu_naissance character varying(200),
    mere_profession character varying(150),
    declarant_profession character varying(150),
    declarant_date_naissance date,
    declarant_lieu_naissance character varying(200),
    date_declaration date DEFAULT CURRENT_DATE,
    heure_declaration time without time zone DEFAULT '16:00:00'::time without time zone,
    pere_statut character varying(20),
    mere_statut character varying(20),
    parents_adresse text,
    fokontany character varying(50) DEFAULT 'Fianarantsoa I'::character varying,
    etat_matrimonial character varying(50),
    defunt_fokontany character varying(50),
    declarant_fokontany character varying(50),
    CONSTRAINT actes_deces_etat_matrimonial_check CHECK (((etat_matrimonial)::text = ANY ((ARRAY['celibataire'::character varying, 'marie'::character varying, 'divorce'::character varying, 'veuf'::character varying])::text[]))),
    CONSTRAINT actes_deces_mere_statut_check CHECK (((mere_statut)::text = ANY ((ARRAY['vivant'::character varying, 'decede'::character varying])::text[]))),
    CONSTRAINT actes_deces_pere_statut_check CHECK (((pere_statut)::text = ANY ((ARRAY['vivant'::character varying, 'decede'::character varying])::text[]))),
    CONSTRAINT actes_deces_sexe_check CHECK (((sexe)::text = ANY ((ARRAY['M'::character varying, 'F'::character varying])::text[])))
);

ALTER TABLE public.actes_deces OWNER TO postgres;

CREATE SEQUENCE public.actes_deces_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.actes_deces_id_seq OWNER TO postgres;
ALTER SEQUENCE public.actes_deces_id_seq OWNED BY public.actes_deces.id;

-- =====================================================
-- TABLE 2 : ACTES DE MARIAGE
-- =====================================================
CREATE TABLE public.actes_mariage (
    id integer NOT NULL,
    numero_acte character varying(50) NOT NULL,
    annee integer NOT NULL,
    epoux_id integer,
    epoux_nom character varying(100) NOT NULL,
    epoux_prenoms character varying(200) NOT NULL,
    epoux_date_naissance date,
    epoux_lieu_naissance character varying(200),
    epoux_profession character varying(150),
    epoux_domicile text,
    epoux_pere_nom character varying(100),
    epoux_pere_prenoms character varying(200),
    epoux_mere_nom character varying(100),
    epoux_mere_prenoms character varying(200),
    epouse_id integer,
    epouse_nom character varying(100) NOT NULL,
    epouse_prenoms character varying(200) NOT NULL,
    epouse_date_naissance date,
    epouse_lieu_naissance character varying(200),
    epouse_profession character varying(150),
    epouse_domicile text,
    epouse_pere_nom character varying(100),
    epouse_pere_prenoms character varying(200),
    epouse_mere_nom character varying(100),
    epouse_mere_prenoms character varying(200),
    date_mariage date NOT NULL,
    lieu_mariage character varying(200) NOT NULL,
    regime_matrimonial character varying(100) DEFAULT 'Communaute de biens'::character varying,
    temoin1_nom character varying(100),
    temoin1_prenoms character varying(200),
    temoin1_qualite character varying(100),
    temoin2_nom character varying(100),
    temoin2_prenoms character varying(200),
    temoin2_qualite character varying(100),
    officier_etat_civil character varying(200),
    user_id integer,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_modification timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    heure_mariage time without time zone,
    epoux_pere_profession character varying(150),
    epoux_mere_profession character varying(150),
    epouse_pere_profession character varying(150),
    epouse_mere_profession character varying(150),
    temoin1_profession character varying(150),
    temoin1_date_naissance date,
    temoin1_lieu_naissance character varying(200),
    temoin1_domicile text,
    temoin2_profession character varying(150),
    temoin2_date_naissance date,
    temoin2_lieu_naissance character varying(200),
    temoin2_domicile text
);

ALTER TABLE public.actes_mariage OWNER TO postgres;

CREATE SEQUENCE public.actes_mariage_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.actes_mariage_id_seq OWNER TO postgres;
ALTER SEQUENCE public.actes_mariage_id_seq OWNED BY public.actes_mariage.id;

-- =====================================================
-- TABLE 3 : ACTES DE NAISSANCE
-- =====================================================
CREATE TABLE public.actes_naissance (
    id integer NOT NULL,
    numero_acte character varying(50) NOT NULL,
    annee integer NOT NULL,
    personne_id integer,
    date_naissance date NOT NULL,
    heure_naissance time without time zone,
    lieu_naissance character varying(200) NOT NULL,
    sexe character varying(10),
    nom_pere character varying(100),
    prenoms_pere character varying(200),
    age_pere integer,
    profession_pere character varying(150),
    domicile_pere text,
    nom_mere character varying(100),
    prenoms_mere character varying(200),
    age_mere integer,
    profession_mere character varying(150),
    domicile_mere text,
    temoin1_nom character varying(100),
    temoin1_prenoms character varying(200),
    temoin1_age integer,
    temoin1_profession character varying(150),
    temoin2_nom character varying(100),
    temoin2_prenoms character varying(200),
    temoin2_age integer,
    temoin2_profession character varying(150),
    declarant_nom character varying(100),
    declarant_prenoms character varying(200),
    declarant_qualite character varying(100),
    date_declaration date DEFAULT CURRENT_DATE,
    officier_etat_civil character varying(200),
    user_id integer,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_modification timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    nom character varying(100),
    prenoms character varying(200),
    pere_date_naissance date,
    pere_lieu_naissance character varying(200),
    mere_date_naissance date,
    mere_lieu_naissance character varying(200),
    declarant_profession character varying(150),
    declarant_date_naissance date,
    declarant_lieu_naissance character varying(200),
    declarant_domicile text,
    heure_declaration time without time zone DEFAULT '16:00:00'::time without time zone,
    numero_registre character varying(50),
    date_transcription date,
    CONSTRAINT actes_naissance_sexe_check CHECK (((sexe)::text = ANY ((ARRAY['M'::character varying, 'F'::character varying])::text[])))
);

ALTER TABLE public.actes_naissance OWNER TO postgres;

CREATE SEQUENCE public.actes_naissance_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.actes_naissance_id_seq OWNER TO postgres;
ALTER SEQUENCE public.actes_naissance_id_seq OWNED BY public.actes_naissance.id;

-- =====================================================
-- TABLE 4 : COPIES DÉLIVRÉES
-- =====================================================
CREATE TABLE public.copies_delivrees (
    id integer NOT NULL,
    numero_copie character varying(50) NOT NULL,
    type_acte character varying(20),
    acte_id integer NOT NULL,
    numero_acte character varying(50) NOT NULL,
    type_copie character varying(20),
    demandeur_nom character varying(100) NOT NULL,
    demandeur_prenoms character varying(200) NOT NULL,
    demandeur_qualite character varying(100),
    demandeur_piece_identite character varying(100),
    date_demande date DEFAULT CURRENT_DATE,
    date_delivrance date,
    motif_demande character varying(200),
    observations text,
    montant_paye numeric(10,2),
    reference_paiement character varying(100),
    user_id integer,
    delivre_par character varying(200),
    statut character varying(20) DEFAULT 'en_attente'::character varying,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT copies_delivrees_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_attente'::character varying, 'delivree'::character varying, 'rejetee'::character varying])::text[]))),
    CONSTRAINT copies_delivrees_type_acte_check CHECK (((type_acte)::text = ANY ((ARRAY['naissance'::character varying, 'mariage'::character varying, 'deces'::character varying])::text[]))),
    CONSTRAINT copies_delivrees_type_copie_check CHECK (((type_copie)::text = ANY ((ARRAY['premiere_copie'::character varying, 'duplicata'::character varying])::text[])))
);

ALTER TABLE public.copies_delivrees OWNER TO postgres;

CREATE SEQUENCE public.copies_delivrees_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.copies_delivrees_id_seq OWNER TO postgres;
ALTER SEQUENCE public.copies_delivrees_id_seq OWNED BY public.copies_delivrees.id;

-- =====================================================
-- TABLE 5 : MENTIONS EN MARGE
-- =====================================================
CREATE TABLE public.mentions_marge (
    id integer NOT NULL,
    numero_mention character varying(50) NOT NULL,
    date_mention date DEFAULT CURRENT_DATE,
    type_acte character varying(20),
    acte_id integer NOT NULL,
    numero_acte_concerne character varying(50) NOT NULL,
    type_mention character varying(50),
    contenu text NOT NULL,
    reference_acte character varying(100),
    user_id integer,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT mentions_marge_type_acte_check CHECK (((type_acte)::text = ANY ((ARRAY['naissance'::character varying, 'mariage'::character varying, 'deces'::character varying])::text[]))),
    CONSTRAINT mentions_marge_type_mention_check CHECK (((type_mention)::text = ANY ((ARRAY['adoption'::character varying, 'reconnaissance'::character varying, 'mariage'::character varying, 'divorce'::character varying, 'deces'::character varying, 'rectification'::character varying, 'autre'::character varying])::text[])))
);

ALTER TABLE public.mentions_marge OWNER TO postgres;

CREATE SEQUENCE public.mentions_marge_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.mentions_marge_id_seq OWNER TO postgres;
ALTER SEQUENCE public.mentions_marge_id_seq OWNED BY public.mentions_marge.id;

-- =====================================================
-- TABLE 6 : PARAMÈTRES SYSTÈME
-- =====================================================
CREATE TABLE public.parametres_systeme (
    id integer NOT NULL,
    cle character varying(100) NOT NULL,
    valeur text,
    description text,
    date_modification timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.parametres_systeme OWNER TO postgres;

CREATE SEQUENCE public.parametres_systeme_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.parametres_systeme_id_seq OWNER TO postgres;
ALTER SEQUENCE public.parametres_systeme_id_seq OWNED BY public.parametres_systeme.id;

-- =====================================================
-- TABLE 7 : PERSONNES
-- =====================================================
CREATE TABLE public.personnes (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    prenoms character varying(200) NOT NULL,
    date_naissance date,
    lieu_naissance character varying(200),
    sexe character varying(10),
    nationalite character varying(100) DEFAULT 'Malagasy'::character varying,
    profession character varying(150),
    domicile text,
    nom_pere character varying(100),
    prenoms_pere character varying(200),
    profession_pere character varying(150),
    nom_mere character varying(100),
    prenoms_mere character varying(200),
    profession_mere character varying(150),
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT personnes_sexe_check CHECK (((sexe)::text = ANY ((ARRAY['M'::character varying, 'F'::character varying])::text[])))
);

ALTER TABLE public.personnes OWNER TO postgres;

CREATE SEQUENCE public.personnes_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.personnes_id_seq OWNER TO postgres;
ALTER SEQUENCE public.personnes_id_seq OWNED BY public.personnes.id;

-- =====================================================
-- TABLE 8 : USERS
-- =====================================================
CREATE TABLE public.users (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    prenoms character varying(200) NOT NULL,
    email character varying(150) NOT NULL,
    mot_de_passe character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'agent'::character varying,
    actif boolean DEFAULT true,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion timestamp without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'agent'::character varying, 'responsable'::character varying])::text[])))
);

ALTER TABLE public.users OWNER TO postgres;

CREATE SEQUENCE public.users_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNER TO postgres;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

-- =====================================================
-- DÉFINITION DES ID PAR DÉFAUT
-- =====================================================
ALTER TABLE ONLY public.actes_deces ALTER COLUMN id SET DEFAULT nextval('public.actes_deces_id_seq'::regclass);
ALTER TABLE ONLY public.actes_mariage ALTER COLUMN id SET DEFAULT nextval('public.actes_mariage_id_seq'::regclass);
ALTER TABLE ONLY public.actes_naissance ALTER COLUMN id SET DEFAULT nextval('public.actes_naissance_id_seq'::regclass);
ALTER TABLE ONLY public.copies_delivrees ALTER COLUMN id SET DEFAULT nextval('public.copies_delivrees_id_seq'::regclass);
ALTER TABLE ONLY public.mentions_marge ALTER COLUMN id SET DEFAULT nextval('public.mentions_marge_id_seq'::regclass);
ALTER TABLE ONLY public.parametres_systeme ALTER COLUMN id SET DEFAULT nextval('public.parametres_systeme_id_seq'::regclass);
ALTER TABLE ONLY public.personnes ALTER COLUMN id SET DEFAULT nextval('public.personnes_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

-- =====================================================
-- INSERTION DES DONNÉES
-- =====================================================

-- Utilisateurs de test
INSERT INTO public.users VALUES (1, 'ADMIN', 'Systémes', 'admin@fianarantsoa.mg', '$2a$10$V0De.pEFw0mdiGmMe8ulnOZK/Jb/QHb/9eRj.1rEm2aKLAZ6QNdKW', 'admin', true, '2025-09-19 13:31:06.428871', NULL);
INSERT INTO public.users VALUES (3, 'RAKOTO', 'Marie Joseph', 'agent@fianarantsoa.mg', '$2a$10$d0CpHrrlrJ3B8mLk8xROKeXdY1aRgdDcKJYMTxUBE2chkBqW6x77S', 'agent', true, '2025-11-16 12:15:17.174859', NULL);

-- Paramètres système
INSERT INTO public.parametres_systeme VALUES (1, 'commune_nom', 'Commune Urbaine de Fianarantsoa', 'Nom de la commune', '2025-09-19 13:31:03.981424');
INSERT INTO public.parametres_systeme VALUES (2, 'commune_region', 'Haute Matsiatra', 'Région de la commune', '2025-09-19 13:31:03.981424');
INSERT INTO public.parametres_systeme VALUES (3, 'annee_courante', '2025', 'Année courante pour les numérotations', '2025-09-19 13:31:03.981424');
INSERT INTO public.parametres_systeme VALUES (4, 'format_numero_naissance', 'N{YYYY}-{0000}', 'Format des numéros d''actes de naissance', '2025-09-19 13:31:03.981424');
INSERT INTO public.parametres_systeme VALUES (5, 'format_numero_mariage', 'M{YYYY}-{0000}', 'Format des numéros d''actes de mariage', '2025-09-19 13:31:03.981424');
INSERT INTO public.parametres_systeme VALUES (6, 'format_numero_deces', 'D{YYYY}-{0000}', 'Format des numéros d''actes de décès', '2025-09-19 13:31:03.981424');

-- =====================================================
-- RÉINITIALISATION DES SÉQUENCES
-- =====================================================
SELECT pg_catalog.setval('public.actes_deces_id_seq', 1, false);
SELECT pg_catalog.setval('public.actes_mariage_id_seq', 1, false);
SELECT pg_catalog.setval('public.actes_naissance_id_seq', 1, false);
SELECT pg_catalog.setval('public.copies_delivrees_id_seq', 1, false);
SELECT pg_catalog.setval('public.mentions_marge_id_seq', 1, false);
SELECT pg_catalog.setval('public.parametres_systeme_id_seq', 6, true);
SELECT pg_catalog.setval('public.personnes_id_seq', 1, false);
SELECT pg_catalog.setval('public.users_id_seq', 3, true);

-- =====================================================
-- CONTRAINTES PRIMARY KEY
-- =====================================================
ALTER TABLE ONLY public.actes_deces ADD CONSTRAINT actes_deces_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.actes_deces ADD CONSTRAINT actes_deces_numero_acte_key UNIQUE (numero_acte);

ALTER TABLE ONLY public.actes_mariage ADD CONSTRAINT actes_mariage_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.actes_mariage ADD CONSTRAINT actes_mariage_numero_acte_key UNIQUE (numero_acte);

ALTER TABLE ONLY public.actes_naissance ADD CONSTRAINT actes_naissance_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.actes_naissance ADD CONSTRAINT actes_naissance_numero_acte_key UNIQUE (numero_acte);

ALTER TABLE ONLY public.copies_delivrees ADD CONSTRAINT copies_delivrees_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.mentions_marge ADD CONSTRAINT mentions_marge_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.mentions_marge ADD CONSTRAINT mentions_marge_type_acte_acte_id_numero_mention_key UNIQUE (type_acte, acte_id, numero_mention);

ALTER TABLE ONLY public.parametres_systeme ADD CONSTRAINT parametres_systeme_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.parametres_systeme ADD CONSTRAINT parametres_systeme_cle_key UNIQUE (cle);

ALTER TABLE ONLY public.personnes ADD CONSTRAINT personnes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);

-- =====================================================
-- INDEX POUR PERFORMANCE
-- =====================================================
CREATE INDEX idx_actes_deces_numero ON public.actes_deces USING btree (numero_acte);
CREATE INDEX idx_actes_deces_annee ON public.actes_deces USING btree (annee);
CREATE INDEX idx_actes_deces_defunt ON public.actes_deces USING btree (defunt_id);

CREATE INDEX idx_actes_mariage_numero ON public.actes_mariage USING btree (numero_acte);
CREATE INDEX idx_actes_mariage_annee ON public.actes_mariage USING btree (annee);
CREATE INDEX idx_actes_mariage_epoux ON public.actes_mariage USING btree (epoux_id);
CREATE INDEX idx_actes_mariage_epouse ON public.actes_mariage USING btree (epouse_id);

CREATE INDEX idx_actes_naissance_numero ON public.actes_naissance USING btree (numero_acte);
CREATE INDEX idx_actes_naissance_annee ON public.actes_naissance USING btree (annee);
CREATE INDEX idx_actes_naissance_personne ON public.actes_naissance USING btree (personne_id);

CREATE INDEX idx_mentions_acte ON public.mentions_marge USING btree (type_acte, acte_id);
CREATE INDEX idx_copies_acte ON public.copies_delivrees USING btree (type_acte, acte_id);
CREATE INDEX idx_personnes_nom_prenoms ON public.personnes USING btree (nom, prenoms);

-- =====================================================
-- FOREIGN KEYS (CLÉS ÉTRANGÈRES)
-- =====================================================
ALTER TABLE ONLY public.actes_deces ADD CONSTRAINT actes_deces_defunt_id_fkey FOREIGN KEY (defunt_id) REFERENCES public.personnes(id);
ALTER TABLE ONLY public.actes_deces ADD CONSTRAINT actes_deces_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.actes_mariage ADD CONSTRAINT actes_mariage_epouse_id_fkey FOREIGN KEY (epouse_id) REFERENCES public.personnes(id);
ALTER TABLE ONLY public.actes_mariage ADD CONSTRAINT actes_mariage_epoux_id_fkey FOREIGN KEY (epoux_id) REFERENCES public.personnes(id);
ALTER TABLE ONLY public.actes_mariage ADD CONSTRAINT actes_mariage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.actes_naissance ADD CONSTRAINT actes_naissance_personne_id_fkey FOREIGN KEY (personne_id) REFERENCES public.personnes(id);
ALTER TABLE ONLY public.actes_naissance ADD CONSTRAINT actes_naissance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.copies_delivrees ADD CONSTRAINT copies_delivrees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.mentions_marge ADD CONSTRAINT mentions_marge_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================