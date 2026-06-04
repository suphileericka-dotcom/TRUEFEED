const express = require('express');

const { requireAuth } = require('../../../middlewares/auth');
const { goodTipsService } = require('../../../services/goodTips.service');
const { validate } = require('../../../utils/validation');

const goodTipsV1Router = express.Router();

const goodTipSchema = {
  place: { type: 'string', required: true, minLength: 2, maxLength: 160 },
  budget: { type: 'string', required: true, minLength: 1, maxLength: 80 },
  transport: { type: 'string', required: true, minLength: 2, maxLength: 80 },
};

goodTipsV1Router.get('/', async (req, res, next) => {
  try {
    res.json({
      items: await goodTipsService.listTips({ limit: req.query.limit }),
    });
  } catch (error) {
    next(error);
  }
});

goodTipsV1Router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = validate(goodTipSchema, req.body);
    const result = await goodTipsService.createTip(
      {
        ...payload,
        lat: req.body.lat,
        lng: req.body.lng,
      },
      req.user,
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

goodTipsV1Router.get('/me/rewards', requireAuth, async (req, res, next) => {
  try {
    res.json(await goodTipsService.getRewards(req.user));
  } catch (error) {
    next(error);
  }
});

module.exports = {
  goodTipsV1Router,
};
