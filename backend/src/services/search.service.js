const { postsService } = require('./posts.service');

const destinations = [
  {
    id: 'kyoto',
    type: 'destination',
    name: 'Kyoto',
    country: 'Japon',
    tags: ['ville', 'culture', 'food'],
  },
  {
    id: 'santorin',
    type: 'destination',
    name: 'Santorin',
    country: 'Grece',
    tags: ['soleil', 'plage'],
  },
  {
    id: 'chamonix',
    type: 'destination',
    name: 'Chamonix',
    country: 'France',
    tags: ['neige', 'montagne'],
  },
];

const users = [
  { id: 'seed_maya', type: 'user', username: 'maya_explores', displayName: 'Maya Explores' },
  { id: 'seed_nora', type: 'user', username: 'nora.nomad', displayName: 'Nora Nomad' },
  { id: 'seed_sophie', type: 'user', username: 'sophie_bpkt', displayName: 'Sophie Backpack' },
];

const tags = [
  'soleil',
  'plage',
  'roadtrip',
  'festival',
  'ville',
  'food',
  'neige',
  'montagne',
  'hanami',
  'culture',
  'slowtravel',
].map((name) => ({ id: name, type: 'tag', name }));

function includesQuery(value, query) {
  return String(value || '')
    .toLowerCase()
    .includes(query);
}

function search({ q = '', type = 'all', limit = 8 }) {
  const query = String(q).trim().toLowerCase();
  const safeLimit = Math.min(Number(limit) || 8, 20);

  if (!query) {
    return { query, items: [] };
  }

  const postItems = postsService
    .listFeed({ limit: 20, sort: 'recent' })
    .items.filter(
      (post) =>
        includesQuery(post.title, query) ||
        includesQuery(post.caption, query) ||
        includesQuery(post.location, query) ||
        post.tags.some((tag) => includesQuery(tag, query)),
    )
    .map((post) => ({ ...post, type: 'post' }));

  const pools = {
    destination: destinations.filter(
      (item) =>
        includesQuery(item.name, query) ||
        includesQuery(item.country, query) ||
        item.tags.some((tag) => includesQuery(tag, query)),
    ),
    tag: tags.filter((item) => includesQuery(item.name, query)),
    user: users.filter(
      (item) => includesQuery(item.username, query) || includesQuery(item.displayName, query),
    ),
    post: postItems,
  };

  const items =
    type === 'all'
      ? [...pools.destination, ...pools.tag, ...pools.user, ...pools.post]
      : pools[type] || [];

  return {
    query,
    type,
    items: items.slice(0, safeLimit),
  };
}

module.exports = {
  searchService: {
    search,
  },
};
