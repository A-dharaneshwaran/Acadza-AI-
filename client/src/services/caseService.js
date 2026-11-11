import { apiRequest } from './api';

/**
 * Fetch all investigation cases grouped by question
 */
export async function getInvestigationCases() {
  return await apiRequest('/cases');
}

/**
 * Fetch paginated investigation cases with search, filters, and sorting
 */
export async function getPaginatedCases(queryParams = {}) {
  const params = new URLSearchParams(queryParams);
  return await apiRequest(`/cases/paginated?${params.toString()}`);
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
  getPaginatedCases,
  getCaseDetails,
  getTaxonomy
};

