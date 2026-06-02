const express = require('express');

const { mapService } = require('../../../services/map.service');

const mapV1Router = express.Router();

mapV1Router.get('/categories', (_req, res) => {
  res.json({ items: mapService.categories });
});

mapV1Router.get('/places', (req, res) => {
  res.json({
    items: mapService.listPlaces({
      category: req.query.category,
      lat: req.query.lat,
      lng: req.query.lng,
      radiusKm: req.query.radiusKm,
    }),
  });
});

module.exports = {
  mapV1Router,
};
