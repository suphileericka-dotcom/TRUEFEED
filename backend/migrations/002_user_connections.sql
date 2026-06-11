-- Ce fichier ajoute les vraies demandes d'ami entre utilisateurs.
DO $$ BEGIN
  CREATE TYPE user_connection_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status user_connection_status NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_connections_no_self CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS user_connections_addressee_status_idx
  ON user_connections (addressee_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS user_connections_requester_status_idx
  ON user_connections (requester_id, status, created_at DESC);
