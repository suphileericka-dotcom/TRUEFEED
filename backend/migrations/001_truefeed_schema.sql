CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE post_media_type AS ENUM ('image', 'video', 'text');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE post_format AS ENUM ('vlog', 'photo', 'tip', 'debate');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE post_season AS ENUM ('spring', 'summer', 'autumn', 'winter');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft', 'published', 'hidden', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE comment_status AS ENUM ('published', 'hidden', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_username_length CHECK (char_length(username) BETWEEN 3 AND 32),
  CONSTRAINT users_email_format CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_status_created_at_idx ON users (status, created_at DESC);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_verification_codes_user_active_idx
  ON email_verification_codes (user_id, expires_at DESC)
  WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS refresh_sessions_token_hash_key ON refresh_sessions (token_hash);
CREATE INDEX IF NOT EXISTS refresh_sessions_user_expires_at_idx ON refresh_sessions (user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT,
  caption TEXT NOT NULL,
  media_url TEXT,
  media_type post_media_type NOT NULL DEFAULT 'text',
  media_size_bytes INTEGER NOT NULL DEFAULT 0,
  format post_format NOT NULL,
  location TEXT,
  season post_season,
  status post_status NOT NULL DEFAULT 'published',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(caption, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(location, '')), 'C')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT posts_caption_not_blank CHECK (char_length(btrim(caption)) > 0),
  CONSTRAINT posts_published_at_required CHECK (status <> 'published' OR published_at IS NOT NULL),
  CONSTRAINT posts_media_size_limit CHECK (media_size_bytes <= 52428800)
);

CREATE INDEX IF NOT EXISTS posts_feed_idx ON posts (status, published_at DESC, id DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS posts_author_date_idx ON posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_date_idx ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_season_date_idx ON posts (season, published_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS posts_trending_idx ON posts (
  status,
  likes_count DESC,
  comments_count DESC,
  shares_count DESC,
  published_at DESC
) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS posts_search_vector_idx ON posts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS posts_feed_payload_idx ON posts (status, published_at DESC)
  INCLUDE (author_id, title, media_type, media_url, likes_count, comments_count, shares_count)
  WHERE status = 'published';

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tags_name_key ON tags (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS tags_slug_key ON tags (lower(slug));

CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS post_tags_tag_post_idx ON post_tags (tag_id, post_id);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status comment_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT comments_content_not_blank CHECK (char_length(btrim(content)) > 0)
);

CREATE INDEX IF NOT EXISTS comments_post_created_at_idx ON comments (post_id, created_at ASC)
  WHERE status = 'published';

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts (id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT likes_single_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS likes_user_post_key ON likes (user_id, post_id)
  WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS likes_user_comment_key ON likes (user_id, comment_id)
  WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS likes_post_created_at_idx ON likes (post_id, created_at DESC)
  WHERE post_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  post_id UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_shares_post_created_at_idx ON post_shares (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_shares_user_created_at_idx ON post_shares (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS post_shares_user_post_key ON post_shares (post_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS debate_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  up_votes INTEGER NOT NULL DEFAULT 0,
  down_votes INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(body, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debate_threads_search_vector_idx ON debate_threads USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS debate_threads_updated_at_idx ON debate_threads (updated_at DESC);

CREATE TABLE IF NOT EXISTS debate_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES debate_threads (id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debate_replies_thread_created_at_idx ON debate_replies (thread_id, created_at ASC);

CREATE TABLE IF NOT EXISTS debate_votes (
  thread_id UUID NOT NULL REFERENCES debate_threads (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  value TEXT NOT NULL CHECK (value IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  score NUMERIC(3, 1) NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS places_category_idx ON places (category);
CREATE INDEX IF NOT EXISTS places_lat_lng_idx ON places (lat, lng);

CREATE TABLE IF NOT EXISTS good_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  place TEXT NOT NULL,
  budget TEXT NOT NULL,
  transport TEXT NOT NULL,
  rating NUMERIC(3, 1) NOT NULL DEFAULT 8.0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT good_tips_place_not_blank CHECK (char_length(btrim(place)) > 0),
  CONSTRAINT good_tips_budget_not_blank CHECK (char_length(btrim(budget)) > 0),
  CONSTRAINT good_tips_transport_not_blank CHECK (char_length(btrim(transport)) > 0)
);

CREATE INDEX IF NOT EXISTS good_tips_location_idx ON good_tips (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS good_tips_user_created_at_idx ON good_tips (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS good_tips_rating_idx ON good_tips (rating DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  badge_number INTEGER NOT NULL CHECK (badge_number BETWEEN 1 AND 10),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_number)
);

CREATE TABLE IF NOT EXISTS user_gifts (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  gift_number INTEGER NOT NULL CHECK (gift_number BETWEEN 1 AND 15),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, gift_number)
);

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users (id) ON DELETE SET NULL,
  storage_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  public_url TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_owner_created_at_idx ON media_assets (owner_id, created_at DESC);

CREATE OR REPLACE FUNCTION sync_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.post_id IS DISTINCT FROM NEW.post_id THEN
      IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
      END IF;
      IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS likes_sync_post_count ON likes;
CREATE TRIGGER likes_sync_post_count
AFTER INSERT OR UPDATE OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION sync_post_likes_count();

CREATE OR REPLACE FUNCTION sync_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.post_id IS DISTINCT FROM NEW.post_id OR OLD.status IS DISTINCT FROM NEW.status THEN
      IF OLD.status = 'published' THEN
        UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
      END IF;
      IF NEW.status = 'published' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_sync_post_count ON comments;
CREATE TRIGGER comments_sync_post_count
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION sync_post_comments_count();

CREATE OR REPLACE FUNCTION sync_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.post_id IS DISTINCT FROM NEW.post_id THEN
    UPDATE posts SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.post_id;
    UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_shares_sync_post_count ON post_shares;
CREATE TRIGGER post_shares_sync_post_count
AFTER INSERT OR UPDATE OR DELETE ON post_shares
FOR EACH ROW EXECUTE FUNCTION sync_post_shares_count();

CREATE OR REPLACE FUNCTION sync_debate_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE debate_threads SET replies_count = replies_count + 1 WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE debate_threads SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.thread_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.thread_id IS DISTINCT FROM NEW.thread_id THEN
    UPDATE debate_threads SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.thread_id;
    UPDATE debate_threads SET replies_count = replies_count + 1 WHERE id = NEW.thread_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS debate_replies_sync_thread_count ON debate_replies;
CREATE TRIGGER debate_replies_sync_thread_count
AFTER INSERT OR UPDATE OR DELETE ON debate_replies
FOR EACH ROW EXECUTE FUNCTION sync_debate_replies_count();

CREATE OR REPLACE FUNCTION sync_debate_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE debate_threads
      SET up_votes = up_votes + CASE WHEN NEW.value = 'up' THEN 1 ELSE 0 END,
          down_votes = down_votes + CASE WHEN NEW.value = 'down' THEN 1 ELSE 0 END
      WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE debate_threads
      SET up_votes = GREATEST(up_votes - CASE WHEN OLD.value = 'up' THEN 1 ELSE 0 END, 0),
          down_votes = GREATEST(down_votes - CASE WHEN OLD.value = 'down' THEN 1 ELSE 0 END, 0)
      WHERE id = OLD.thread_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.thread_id IS DISTINCT FROM NEW.thread_id OR OLD.value IS DISTINCT FROM NEW.value THEN
      UPDATE debate_threads
        SET up_votes = GREATEST(up_votes - CASE WHEN OLD.value = 'up' THEN 1 ELSE 0 END, 0),
            down_votes = GREATEST(down_votes - CASE WHEN OLD.value = 'down' THEN 1 ELSE 0 END, 0)
        WHERE id = OLD.thread_id;
      UPDATE debate_threads
        SET up_votes = up_votes + CASE WHEN NEW.value = 'up' THEN 1 ELSE 0 END,
            down_votes = down_votes + CASE WHEN NEW.value = 'down' THEN 1 ELSE 0 END
        WHERE id = NEW.thread_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS debate_votes_sync_thread_count ON debate_votes;
CREATE TRIGGER debate_votes_sync_thread_count
AFTER INSERT OR UPDATE OR DELETE ON debate_votes
FOR EACH ROW EXECUTE FUNCTION sync_debate_votes_count();

UPDATE posts
SET likes_count = counts.likes_count,
    comments_count = counts.comments_count,
    shares_count = counts.shares_count
FROM (
  SELECT
    posts.id,
    COUNT(DISTINCT likes.id) FILTER (WHERE likes.post_id IS NOT NULL)::INTEGER AS likes_count,
    COUNT(DISTINCT comments.id) FILTER (WHERE comments.status = 'published')::INTEGER AS comments_count,
    COUNT(DISTINCT post_shares.id)::INTEGER AS shares_count
  FROM posts
  LEFT JOIN likes ON likes.post_id = posts.id
  LEFT JOIN comments ON comments.post_id = posts.id
  LEFT JOIN post_shares ON post_shares.post_id = posts.id
  GROUP BY posts.id
) AS counts
WHERE posts.id = counts.id;

UPDATE debate_threads
SET up_votes = counts.up_votes,
    down_votes = counts.down_votes,
    replies_count = counts.replies_count
FROM (
  SELECT
    debate_threads.id,
    COUNT(DISTINCT debate_votes.user_id) FILTER (WHERE debate_votes.value = 'up')::INTEGER AS up_votes,
    COUNT(DISTINCT debate_votes.user_id) FILTER (WHERE debate_votes.value = 'down')::INTEGER AS down_votes,
    COUNT(DISTINCT debate_replies.id)::INTEGER AS replies_count
  FROM debate_threads
  LEFT JOIN debate_votes ON debate_votes.thread_id = debate_threads.id
  LEFT JOIN debate_replies ON debate_replies.thread_id = debate_threads.id
  GROUP BY debate_threads.id
) AS counts
WHERE debate_threads.id = counts.id;

INSERT INTO places (name, category, city, lat, lng, score, tags)
SELECT 'Tour Eiffel', 'Monument', 'Paris', 48.8584, 2.2945, 9.9, ARRAY['vue', 'culture', 'paris']
WHERE NOT EXISTS (
  SELECT 1 FROM places WHERE lower(name) = lower('Tour Eiffel') AND lower(city) = lower('Paris')
);

INSERT INTO places (name, category, city, lat, lng, score, tags)
SELECT 'Musee du Louvre', 'Musee', 'Paris', 48.8606, 2.3376, 9.7, ARRAY['musee', 'culture', 'paris']
WHERE NOT EXISTS (
  SELECT 1 FROM places WHERE lower(name) = lower('Musee du Louvre') AND lower(city) = lower('Paris')
);

INSERT INTO places (name, category, city, lat, lng, score, tags)
SELECT 'Montmartre', 'Vue', 'Paris', 48.8867, 2.3431, 9.6, ARRAY['vue', 'marche', 'paris']
WHERE NOT EXISTS (
  SELECT 1 FROM places WHERE lower(name) = lower('Montmartre') AND lower(city) = lower('Paris')
);

INSERT INTO places (name, category, city, lat, lng, score, tags)
SELECT 'Fushimi Inari', 'Temple', 'Kyoto', 34.9671, 135.7727, 9.8, ARRAY['culture', 'budget', 'hanami']
WHERE NOT EXISTS (
  SELECT 1 FROM places WHERE lower(name) = lower('Fushimi Inari') AND lower(city) = lower('Kyoto')
);

INSERT INTO places (name, category, city, lat, lng, score, tags)
SELECT 'Nishiki Market', 'Food', 'Kyoto', 35.005, 135.7647, 9.5, ARRAY['food', 'ville']
WHERE NOT EXISTS (
  SELECT 1 FROM places WHERE lower(name) = lower('Nishiki Market') AND lower(city) = lower('Kyoto')
);

INSERT INTO places (name, category, city, lat, lng, score, tags)
SELECT 'Aiguille du Midi', 'Montagne', 'Chamonix', 45.8789, 6.8872, 9.4, ARRAY['montagne', 'neige']
WHERE NOT EXISTS (
  SELECT 1 FROM places WHERE lower(name) = lower('Aiguille du Midi') AND lower(city) = lower('Chamonix')
);
