-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  user_id text NOT NULL,
  username text NOT NULL,
  email text,
  password text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.product (
  product_code text NOT NULL,
  user_id text,
  nama text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT product_pkey PRIMARY KEY (product_code),
  CONSTRAINT product_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.color (
  color_id text NOT NULL,
  color text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT color_pkey PRIMARY KEY (color_id)
);
CREATE TABLE public.product_color (
  product_id text NOT NULL,
  color_id text NOT NULL,
  harga numeric NOT NULL DEFAULT 0,
  stok integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT product_color_pkey PRIMARY KEY (product_id, color_id),
  CONSTRAINT product_color_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_code),
  CONSTRAINT product_color_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.color(color_id)
);
CREATE TABLE public.color_img (
  color_img_id text NOT NULL,
  product_id text,
  color_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  image_path text,
  CONSTRAINT color_img_pkey PRIMARY KEY (color_img_id),
  CONSTRAINT color_img_product_id_color_id_fkey FOREIGN KEY (product_id) REFERENCES public.product_color(product_id),
  CONSTRAINT color_img_product_id_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.product_color(color_id)
);
CREATE TABLE public.restock (
  restock_id text NOT NULL,
  user_id text,
  tanggal date NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT restock_pkey PRIMARY KEY (restock_id),
  CONSTRAINT restock_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.excel_file (
  file_id text NOT NULL,
  filename text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT excel_file_pkey PRIMARY KEY (file_id)
);
CREATE TABLE public.restock_item (
  restock_id text NOT NULL,
  file_id text,
  demand integer NOT NULL DEFAULT 0,
  ischecked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  color_id text,
  product_code text,
  CONSTRAINT restock_item_restock_id_fkey FOREIGN KEY (restock_id) REFERENCES public.restock(restock_id),
  CONSTRAINT restock_item_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.excel_file(file_id),
  CONSTRAINT restock_product_color FOREIGN KEY (product_code) REFERENCES public.product_color(product_id),
  CONSTRAINT restock_product_color FOREIGN KEY (color_id) REFERENCES public.product_color(color_id)
);
CREATE TABLE public.unreg_product (
  sku text NOT NULL,
  restock_id text,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT unreg_product_pkey PRIMARY KEY (sku),
  CONSTRAINT unreg_product_restock_id_fkey FOREIGN KEY (restock_id) REFERENCES public.restock(restock_id)
);
CREATE TABLE public.unreg_variasi (
  sku text NOT NULL,
  file_id text,
  warna text NOT NULL,
  demand integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT unreg_variasi_pkey PRIMARY KEY (sku),
  CONSTRAINT unreg_variasi_sku_fkey FOREIGN KEY (sku) REFERENCES public.unreg_product(sku),
  CONSTRAINT unreg_variasi_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.excel_file(file_id)
);
CREATE TABLE public.sku (
  id_sku text NOT NULL,
  product_code text,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT sku_pkey PRIMARY KEY (id_sku),
  CONSTRAINT sku_product_code_fkey FOREIGN KEY (product_code) REFERENCES public.product(product_code)
);