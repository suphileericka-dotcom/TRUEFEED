// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const flaggedTerms = ['spam', 'arnaque', 'scam', 'haine', 'insulte'];
const reports = [];

function autoFlag({ content = '', reason = 'other', targetType, targetId, reporterId }) {
  const normalized = String(content).toLowerCase();
  const matchedTerms = flaggedTerms.filter((term) => normalized.includes(term));
  const severity = matchedTerms.length > 0 || reason === 'harassment' ? 'review' : 'low';
  const report = {
    id: `report_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    targetType,
    targetId,
    reporterId,
    reason,
    matchedTerms,
    status: severity === 'review' ? 'auto_flagged' : 'open',
    createdAt: new Date().toISOString(),
  };

  reports.push(report);
  return report;
}

function listReports() {
  return reports.slice().reverse();
}

module.exports = {
  moderationService: {
    autoFlag,
    listReports,
  },
};
