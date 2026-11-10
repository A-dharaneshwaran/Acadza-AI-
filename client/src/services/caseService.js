import { apiRequest } from './api';

/**
 * Fetch all investigation cases grouped by question
 */
export async function getInvestigationCases() {
  return await apiRequest('/cases');
}

/**
 * Fetch a single investigation case by caseId or questionId
 */
export async function getCaseDetails(caseId) {
  return await apiRequest(`/cases/${caseId}`);
}

/**
 * Fetch authoritative taxonomy rules
 */
export async function getTaxonomy() {
  return await apiRequest('/taxonomy');
}

export default {
  getInvestigationCases,
  getCaseDetails,
  getTaxonomy
};

