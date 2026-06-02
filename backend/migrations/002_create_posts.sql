CREATE TYPE post_media_type AS ENUM ('image', 'video', 'text');
CREATE TYPE post_format AS ENUM ('vlog', 'photo', 'tip', 'debate');
CREATE TYPE post_season AS ENUM ('spring', 'summer', 'autumn', 'winter');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'hidden', 'deleted');

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT,
  caption TEXT NOT NULL,
  media_url TEXT,
  media_type post_media_type NOT NULL DEFAULT 'text',
  format post_format NOT NULL,
  location TEXT,
  season post_season,
  status post_status NOT NULL DEFAULT 'published',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT posts_caption_not_blank CHECK (char_length(btrim(caption)) > 0),
  CONSTRAINT posts_published_at_required CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tags_name_key ON tags (lower(name));
CREATE UNIQUE INDEX tags_slug_key ON tags (lower(slug));

CREATE TABLE post_tags (
  post_id UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX posts_feed_idx ON posts (status, published_at DESC, id DESC)
  WHERE status = 'published';
CREATE INDEX posts_author_date_idx ON posts (author_id, created_at DESC);
CREATE INDEX posts_date_idx ON posts (created_at DESC);
CREATE INDEX posts_season_date_idx ON posts (season, published_at DESC)
  WHERE status = 'published';
CREATE INDEX post_tags_tag_post_idx ON post_tags (tag_id, post_id);
