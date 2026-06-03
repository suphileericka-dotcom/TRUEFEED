const dataSchema = {
  users: {
    description: 'Comptes utilisateurs et profils TRUEFEED.',
    fields: {
      id: { type: 'string', required: true, unique: true },
      username: { type: 'string', required: true, unique: true },
      email: { type: 'string', required: true, unique: true },
      displayName: { type: 'string', required: true },
      avatarUrl: { type: 'string', required: false },
      bio: { type: 'string', required: false },
      passwordHash: { type: 'string', required: true, private: true },
      role: { type: 'enum', values: ['user', 'moderator', 'admin'], default: 'user' },
      status: { type: 'enum', values: ['active', 'suspended', 'deleted'], default: 'active' },
      emailVerifiedAt: { type: 'datetime', required: false },
      lastSeenAt: { type: 'datetime', required: false },
      createdAt: { type: 'datetime', required: true },
      updatedAt: { type: 'datetime', required: true },
    },
    indexes: [
      { name: 'users_username_key', fields: ['lower(username)'], unique: true },
      { name: 'users_email_key', fields: ['lower(email)'], unique: true },
      { name: 'users_status_created_at_idx', fields: ['status', 'createdAt'] },
    ],
  },
  refreshSessions: {
    description: 'Sessions de refresh token pour renouveler une connexion.',
    fields: {
      id: { type: 'string', required: true, unique: true },
      userId: { type: 'string', required: true, references: 'users.id' },
      tokenHash: { type: 'string', required: true, unique: true, private: true },
      expiresAt: { type: 'datetime', required: true },
      revokedAt: { type: 'datetime', required: false },
      createdAt: { type: 'datetime', required: true },
    },
    indexes: [
      { name: 'refresh_sessions_token_hash_key', fields: ['tokenHash'], unique: true },
      { name: 'refresh_sessions_user_expires_at_idx', fields: ['userId', 'expiresAt'] },
    ],
  },
  posts: {
    description: 'Publications du feed: vlog, photo, bon plan ou debat.',
    fields: {
      id: { type: 'string', required: true, unique: true },
      authorId: { type: 'string', required: true, references: 'users.id' },
      title: { type: 'string', required: false },
      caption: { type: 'string', required: true },
      mediaUrl: { type: 'string', required: false },
      mediaType: { type: 'enum', values: ['image', 'video', 'text'], default: 'text' },
      mediaSizeBytes: { type: 'number', required: false, max: 52428800 },
      format: { type: 'enum', values: ['vlog', 'photo', 'tip', 'debate'], required: true },
      location: { type: 'string', required: false },
      season: { type: 'enum', values: ['spring', 'summer', 'autumn', 'winter'], required: false },
      likesCount: { type: 'number', required: true, default: 0 },
      commentsCount: { type: 'number', required: true, default: 0 },
      sharesCount: { type: 'number', required: true, default: 0 },
      status: {
        type: 'enum',
        values: ['draft', 'published', 'hidden', 'deleted'],
        default: 'published',
      },
      publishedAt: { type: 'datetime', required: false },
      createdAt: { type: 'datetime', required: true },
      updatedAt: { type: 'datetime', required: true },
    },
    rules: ['Un post publie doit avoir publishedAt.'],
    indexes: [
      {
        name: 'posts_feed_idx',
        fields: ['status', 'publishedAt', 'id'],
        where: "status = 'published'",
      },
      { name: 'posts_author_date_idx', fields: ['authorId', 'createdAt'] },
      { name: 'posts_date_idx', fields: ['createdAt'] },
      {
        name: 'posts_season_date_idx',
        fields: ['season', 'publishedAt'],
        where: "status = 'published'",
      },
      {
        name: 'posts_trending_idx',
        fields: ['status', 'likesCount', 'commentsCount', 'sharesCount', 'publishedAt'],
        where: "status = 'published'",
      },
    ],
  },
  tags: {
    description: 'Mots-cles pour classer les posts et faciliter Explore.',
    fields: {
      id: { type: 'string', required: true, unique: true },
      name: { type: 'string', required: true, unique: true },
      slug: { type: 'string', required: true, unique: true },
      createdAt: { type: 'datetime', required: true },
    },
  },
  postTags: {
    description: 'Relation many-to-many entre posts et tags.',
    fields: {
      postId: { type: 'string', required: true, references: 'posts.id' },
      tagId: { type: 'string', required: true, references: 'tags.id' },
    },
    unique: [['postId', 'tagId']],
    indexes: [{ name: 'post_tags_tag_post_idx', fields: ['tagId', 'postId'] }],
  },
  comments: {
    description: 'Commentaires de posts, avec support de reponses imbriquees.',
    fields: {
      id: { type: 'string', required: true, unique: true },
      postId: { type: 'string', required: true, references: 'posts.id' },
      authorId: { type: 'string', required: true, references: 'users.id' },
      parentId: { type: 'string', required: false, references: 'comments.id' },
      content: { type: 'string', required: true },
      status: { type: 'enum', values: ['published', 'hidden', 'deleted'], default: 'published' },
      createdAt: { type: 'datetime', required: true },
      updatedAt: { type: 'datetime', required: true },
    },
    indexes: [
      {
        name: 'comments_post_created_at_idx',
        fields: ['postId', 'createdAt'],
        where: "status = 'published'",
      },
    ],
  },
  likes: {
    description: 'Likes poses par les utilisateurs sur un post ou un commentaire.',
    fields: {
      id: { type: 'string', required: true, unique: true },
      userId: { type: 'string', required: true, references: 'users.id' },
      postId: { type: 'string', required: false, references: 'posts.id' },
      commentId: { type: 'string', required: false, references: 'comments.id' },
      createdAt: { type: 'datetime', required: true },
    },
    rules: ['Un like cible soit postId, soit commentId, jamais les deux.'],
    unique: [
      ['userId', 'postId'],
      ['userId', 'commentId'],
    ],
    indexes: [{ name: 'likes_post_created_at_idx', fields: ['postId', 'createdAt'] }],
  },
  postShares: {
    description: 'Evenements de partage des posts pour maintenir sharesCount.',
    fields: {
      id: { type: 'string', required: true, unique: true },
      userId: { type: 'string', required: false, references: 'users.id' },
      postId: { type: 'string', required: true, references: 'posts.id' },
      createdAt: { type: 'datetime', required: true },
    },
    indexes: [
      { name: 'post_shares_post_created_at_idx', fields: ['postId', 'createdAt'] },
      {
        name: 'post_shares_user_created_at_idx',
        fields: ['userId', 'createdAt'],
        where: 'userId IS NOT NULL',
      },
    ],
  },
  reports: {
    description: 'Signalements moderes par un admin ou moderateur.',
    fields: {
      id: { type: 'string', required: true, unique: true },
      reporterId: { type: 'string', required: true, references: 'users.id' },
      postId: { type: 'string', required: false, references: 'posts.id' },
      commentId: { type: 'string', required: false, references: 'comments.id' },
      reportedUserId: { type: 'string', required: false, references: 'users.id' },
      reason: {
        type: 'enum',
        values: ['spam', 'harassment', 'misinformation', 'illegal_content', 'other'],
        required: true,
      },
      details: { type: 'string', required: false },
      status: {
        type: 'enum',
        values: ['open', 'reviewed', 'dismissed', 'actioned'],
        default: 'open',
      },
      reviewedBy: { type: 'string', required: false, references: 'users.id' },
      reviewedAt: { type: 'datetime', required: false },
      createdAt: { type: 'datetime', required: true },
    },
    rules: ['Un report cible au moins un post, un commentaire ou un utilisateur.'],
  },
};

module.exports = {
  dataSchema,
};
