-- SisOS Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Auditorias table
create table auditorias (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  fiscalizada text not null,
  municipio text,
  data_inicio date,
  data_vencimento date,
  ri text,
  os text,
  cnpj text,
  me_epp boolean default false,
  acidente_trabalho boolean default false,
  embargo_interdicao text,
  status text default 'em_andamento' check (status in ('em_andamento', 'finalizada')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notificações DET
create table dets (
  id uuid default uuid_generate_v4() primary key,
  auditoria_id uuid references auditorias(id) on delete cascade not null,
  codigo text not null,
  data_notificacao date,
  data_entrega date,
  created_at timestamptz default now()
);

-- Autos de Infração
create table autos (
  id uuid default uuid_generate_v4() primary key,
  auditoria_id uuid references auditorias(id) on delete cascade not null,
  descricao text not null,
  lavrado boolean default false,
  created_at timestamptz default now()
);

-- Atualizações (log de atividades)
create table atualizacoes (
  id uuid default uuid_generate_v4() primary key,
  auditoria_id uuid references auditorias(id) on delete cascade not null,
  texto text not null,
  created_at timestamptz default now()
);

-- Pendências
create table pendencias (
  id uuid default uuid_generate_v4() primary key,
  auditoria_id uuid references auditorias(id) on delete cascade not null,
  descricao text not null,
  realizada boolean default false,
  created_at timestamptz default now()
);

-- RLS Policies
alter table auditorias enable row level security;
alter table dets enable row level security;
alter table autos enable row level security;
alter table atualizacoes enable row level security;
alter table pendencias enable row level security;

-- Auditorias: users can only see their own
create policy "Users can view own auditorias" on auditorias
  for select using (auth.uid() = user_id);
create policy "Users can insert own auditorias" on auditorias
  for insert with check (auth.uid() = user_id);
create policy "Users can update own auditorias" on auditorias
  for update using (auth.uid() = user_id);
create policy "Users can delete own auditorias" on auditorias
  for delete using (auth.uid() = user_id);

-- DETs: via auditoria ownership
create policy "Users can manage dets" on dets
  for all using (
    auditoria_id in (select id from auditorias where user_id = auth.uid())
  );

-- Autos: via auditoria ownership
create policy "Users can manage autos" on autos
  for all using (
    auditoria_id in (select id from auditorias where user_id = auth.uid())
  );

-- Atualizações: via auditoria ownership
create policy "Users can manage atualizacoes" on atualizacoes
  for all using (
    auditoria_id in (select id from auditorias where user_id = auth.uid())
  );

-- Pendências: via auditoria ownership
create policy "Users can manage pendencias" on pendencias
  for all using (
    auditoria_id in (select id from auditorias where user_id = auth.uid())
  );

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger auditorias_updated_at
  before update on auditorias
  for each row execute function update_updated_at();
