const express = require('express');

const { mapService } = require('../../../services/map.service');

const mapV1Router = express.Router();

mapV1Router.get('/categories', async (_req, res, next) => {
  try {
    res.json({ items: await mapService.listCategories() });
  } catch (error) {
    next(error);
  }
});

mapV1Router.get('/places', async (req, res, next) => {
  try {
    res.json({
      items: await mapService.listPlaces({
        category: req.query.category,
        lat: req.query.lat,
        lng: req.query.lng,
        radiusKm: req.query.radiusKm,
      }),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  mapV1Router,
};
