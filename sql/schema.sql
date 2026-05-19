SET statement_timeout = 0;
SET lock_timeout = 0;
SET timezone = 'Asia/Tokyo';
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- member
CREATE TABLE public.member (
    id          serial PRIMARY KEY,
    login_id    text NOT NULL UNIQUE,
    email       text,
    email_hash  text,
    password    text NOT NULL,
    salt        text NOT NULL,
    create_time timestamp without time zone DEFAULT now() NOT NULL,
    update_time timestamp without time zone DEFAULT now() NOT NULL
);

-- メール確認待ち（登録前の一時保管）
CREATE TABLE public.member_pending (
    id          serial PRIMARY KEY,
    login_id    text NOT NULL UNIQUE,
    email       text NOT NULL,
    email_hash  text NOT NULL,
    password    text NOT NULL,
    salt        text NOT NULL,
    code        text NOT NULL,
    expires_at  timestamp without time zone NOT NULL,
    created_at  timestamp without time zone DEFAULT now() NOT NULL
);

-- admin（member とは独立）
CREATE TABLE public.admin (
    id          serial PRIMARY KEY,
    login_id    text NOT NULL UNIQUE,
    password    text NOT NULL,
    salt        text NOT NULL,
    create_time timestamp without time zone DEFAULT now() NOT NULL,
    update_time timestamp without time zone DEFAULT now() NOT NULL
);
