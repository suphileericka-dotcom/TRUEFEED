const postsService = {
  createDraft(payload = {}) {
    return {
      receivedAt: new Date().toISOString(),
      payload,
    };
  },
};

module.exports = {
  postsService,
};
