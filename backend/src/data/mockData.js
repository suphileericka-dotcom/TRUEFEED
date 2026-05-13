const feed = [
  {
    id: 'feed-1',
    author: 'maya_explores',
    location: 'Santorin, Grece',
    caption:
      "Le coucher de soleil le plus dingue de ma vie. Oia a 19h, baguette locale et vue sur la caldeira.",
    format: 'vlog',
    season: 'summer',
    likes: 2847,
  },
];

const destinations = [
  {
    id: 'dest-kyoto',
    city: 'Kyoto',
    country: 'Japon',
    area: 'Kansai',
    rating: 4.9,
    posts: '12k',
    tips: 847,
  },
  {
    id: 'dest-chamonix',
    city: 'Chamonix',
    country: 'France',
    area: 'Alpes',
    rating: 4.8,
    posts: '3.4k',
    tips: 390,
  },
];

const debates = [
  {
    id: 'debate-1',
    title: 'Le Japon en Hanami : surestime ou incontournable ?',
    category: 'Culture',
    responses: 142,
    votes: {
      yes: 67,
      no: 33,
    },
  },
  {
    id: 'debate-2',
    title: 'Voyager avec 7kg max : une liberte ou une contrainte ?',
    category: 'Sac a dos',
    responses: 96,
    votes: {
      yes: 54,
      no: 46,
    },
  },
];

module.exports = {
  debates,
  destinations,
  feed,
};
