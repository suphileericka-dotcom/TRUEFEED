// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const { query, transaction } = require('../data/db');
const { createHttpError } = require('../utils/httpError');

const badgeMilestones = [5, 10, 15, 20, 25, 30, 33, 35, 50, 75];
const giftRewards = [
  { unlockAt: 2, giftNumber: 1, stock: 3 },
  { unlockAt: 4, giftNumber: 2, stock: 5 },
  { unlockAt: 6, giftNumber: 3, stock: 3 },
  { unlockAt: 8, giftNumber: 4, stock: 2 },
  { unlockAt: 11, giftNumber: 5, stock: 2 },
  { unlockAt: 13, giftNumber: 6, stock: 1 },
  { unlockAt: 16, giftNumber: 7, stock: 2 },
  { unlockAt: 18, giftNumber: 8, stock: 1 },
  { unlockAt: 22, giftNumber: 9, stock: 2 },
  { unlockAt: 24, giftNumber: 10, stock: 3 },
  { unlockAt: 25, giftNumber: 11, stock: 2 },
  { unlockAt: 27, giftNumber: 12, stock: 1 },
  { unlockAt: 29, giftNumber: 13, stock: 1 },
  { unlockAt: 31, giftNumber: 14, stock: 1 },
  { unlockAt: 34, giftNumber: 15, stock: 1 },
];

const visualCategories = [
  { key: 'restaurant', label: 'Restaurant', keywords: ['restaurant', 'resto', 'diner', 'dejeuner', 'food', 'cuisine', 'bistro', 'brasserie', 'ramen', 'sushi', 'pizza'] },
  { key: 'park', label: 'Parc', keywords: ['parc', 'park', 'jardin', 'garden', 'square', 'nature'] },
  { key: 'museum', label: 'Musee', keywords: ['musee', 'museum', 'galerie', 'gallery', 'exposition', 'expo'] },
  { key: 'cafe', label: 'Cafe', keywords: ['cafe', 'coffee', 'espresso', 'brunch', 'patisserie', 'boulangerie'] },
  { key: 'concert', label: 'Concert', keywords: ['concert', 'musique', 'music', 'live', 'festival', 'scene'] },
  { key: 'hike', label: 'Randonnee', keywords: ['randonnee', 'hike', 'hiking', 'sentier', 'trail', 'montagne', 'mountain'] },
  { key: 'monument', label: 'Monument', keywords: ['monument', 'temple', 'sanctuaire', 'shrine', 'chateau', 'palais', 'tour', 'cathedrale'] },
  { key: 'shopping', label: 'Shopping', keywords: ['shopping', 'boutique', 'magasin', 'mall', 'marche', 'market', 'shop'] },
  { key: 'beach', label: 'Plage', keywords: ['plage', 'beach', 'mer', 'ocean', 'calanque', 'baie'] },
  { key: 'hotel', label: 'Hotel', keywords: ['hotel', 'hostel', 'auberge', 'riad', 'logement', 'suite'] },
  { key: 'bar', label: 'Bar', keywords: ['bar', 'cocktail', 'pub', 'rooftop', 'speakeasy'] },
  { key: 'theater', label: 'Theatre', keywords: ['theatre', 'cinema', 'spectacle', 'show', 'comedie'] },
  { key: 'station', label: 'Gare', keywords: ['gare', 'station', 'metro', 'train', 'bus', 'tram'] },
  { key: 'viewpoint', label: 'Vue', keywords: ['vue', 'view', 'panorama', 'belvedere', 'observatoire', 'sunset'] },
  { key: 'market', label: 'Marche', keywords: ['marche', 'market', 'brocante', 'bazaar', 'souq', 'nishiki'] },
];

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function resolveVisual(payload) {
  const haystack = normalizeSearchText(
    [payload.category, payload.place, payload.address, payload.transport].filter(Boolean).join(' '),
  );
  const match = visualCategories.find((category) =>
    category.keywords.some((keyword) => haystack.includes(normalizeSearchText(keyword))),
  );

  return match || { key: 'generic', label: 'Bon plan' };
}

function toTip(row) {
  return {
    id: row.id,
    userId: row.user_id,
    author: row.author_username,
    place: row.place,
    address: row.address,
    category: row.category,
    visualKey: row.visual_key,
    budget: row.budget,
    transport: row.transport,
    rating: Number(row.rating),
    lat: row.lat,
    lng: row.lng,
    createdAt: row.created_at,
  };
}

async function listTips({ limit = 50 } = {}) {
  const safeLimit = Math.min(Number(limit) || 50, 100);
  const result = await query(
    `SELECT good_tips.*, users.username AS author_username
     FROM good_tips
     INNER JOIN users ON users.id = good_tips.user_id
     ORDER BY good_tips.rating DESC, good_tips.created_at DESC
     LIMIT $1`,
    [safeLimit],
  );

  return result.rows.map(toTip);
}

async function syncRewards(client, userId) {
  const countResult = await client.query(
    `SELECT COUNT(*)::INTEGER AS count FROM good_tips WHERE user_id = $1`,
    [userId],
  );
  const sharedCount = countResult.rows[0].count;

  for (const [index, milestone] of badgeMilestones.entries()) {
    if (sharedCount >= milestone) {
      await client.query(
        `INSERT INTO user_badges (user_id, badge_number)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, index + 1],
      );
    }
  }

  for (const reward of giftRewards) {
    if (sharedCount >= reward.unlockAt) {
      await client.query(
        `INSERT INTO user_gifts (user_id, gift_number, stock)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, gift_number) DO NOTHING`,
        [userId, reward.giftNumber, reward.stock],
      );
    }
  }

  if (sharedCount > 75 && (sharedCount - 75) % 10 === 0) {
    await client.query(
      `UPDATE user_gifts
       SET stock = stock + 1,
           updated_at = now()
       WHERE user_id = $1
         AND stock = (
           SELECT MIN(stock) FROM user_gifts WHERE user_id = $1
         )`,
      [userId],
    );
  }

  if (sharedCount > 75 && (sharedCount - 75) % 50 === 0) {
    await client.query(
      `INSERT INTO user_gifts (user_id, gift_number, stock)
       VALUES ($1, 11, 1)
       ON CONFLICT (user_id, gift_number)
       DO UPDATE SET stock = user_gifts.stock + 1, updated_at = now()`,
      [userId],
    );
  }

  return sharedCount;
}

async function createTip(payload, user) {
  const place = String(payload.place || '').trim();
  const address = String(payload.address || '').trim();
  const budget = String(payload.budget || '').trim();
  const transport = String(payload.transport || '').trim();
  const visual = resolveVisual(payload);
  const category = String(payload.category || visual.label).trim() || visual.label;

  if (place.length < 2 || address.length < 4 || budget.length < 1 || transport.length < 2) {
    throw createHttpError(400, 'invalid_good_tip', 'Lieu, adresse, budget et transport sont requis.');
  }

  return transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO good_tips (user_id, place, address, category, visual_key, budget, transport, rating, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 8.9, $8, $9)
       RETURNING *`,
      [
        user.id,
        place,
        address,
        category,
        visual.key,
        budget,
        transport,
        payload.lat || null,
        payload.lng || null,
      ],
    );
    const sharedCount = await syncRewards(client, user.id);

    return {
      tip: toTip({
        ...result.rows[0],
        author_username: user.username,
      }),
      sharedCount,
    };
  });
}

async function getRewards(user) {
  const badgesResult = await query(
    `SELECT badge_number AS number, unlocked_at
     FROM user_badges
     WHERE user_id = $1
     ORDER BY badge_number ASC`,
    [user.id],
  );
  const giftsResult = await query(
    `SELECT gift_number AS number, stock, unlocked_at
     FROM user_gifts
     WHERE user_id = $1
     ORDER BY gift_number ASC`,
    [user.id],
  );

  return {
    badges: badgesResult.rows,
    gifts: giftsResult.rows,
  };
}

module.exports = {
  goodTipsService: {
    createTip,
    getRewards,
    listTips,
  },
};
