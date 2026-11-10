const Taxonomy = require('../../models/Taxonomy');

/**
 * Taxonomy Service
 * Provides structured, cached access to the closed taxonomy rules stored in MongoDB.
 * Governs permitted verdicts, valid repairs, automation permissions, and field boundaries.
 */
class TaxonomyService {
  constructor() {
    this.cachedTaxonomy = null;
    this.lastFetchedAt = 0;
    this.CACHE_TTL_MS = 60000; // 1 minute memory cache
  }

  /**
   * Retrieve the authoritative taxonomy document.
   */
  async getTaxonomy() {
    const now = Date.now();
    if (this.cachedTaxonomy && (now - this.lastFetchedAt < this.CACHE_TTL_MS)) {
      return this.cachedTaxonomy;
    }

    const doc = await Taxonomy.findById('acadza_taxonomy_v1').lean();
    if (!doc) {
      throw new Error('Authoritative taxonomy "acadza_taxonomy_v1" not found in MongoDB. Ensure import script has run.');
    }

    this.cachedTaxonomy = doc;
    this.lastFetchedAt = now;
    return doc;
  }

  /**
   * Get list of all permitted verdict keys.
   */
  async getVerdicts() {
    const tax = await this.getTaxonomy();
    return Object.keys(tax.verdicts || {});
  }

  /**
   * Check if a given verdict is valid.
   */
  async isValidVerdict(verdict) {
    const verdicts = await this.getVerdicts();
    return verdicts.includes(verdict);
  }

  /**
   * Get map of all permitted repairs and their metadata.
   */
  async getRepairs() {
    const tax = await this.getTaxonomy();
    return tax.repairs || {};
  }

  /**
   * Check if a repair key is valid.
   */
  async isValidRepair(repair) {
    if (!repair) return true; // repair can be null for no_error etc.
    const repairs = await this.getRepairs();
    return Object.prototype.hasOwnProperty.call(repairs, repair);
  }

  /**
   * Retrieve repair rule metadata (allowed fields, auto flag, label).
   */
  async getRepairRule(repair) {
    const repairs = await this.getRepairs();
    return repairs[repair] || null;
  }

  /**
   * Check if a repair type is permitted to be automated.
   */
  async isAutoEligible(repair) {
    const rule = await this.getRepairRule(repair);
    return rule ? rule.auto === true : false;
  }

  /**
   * Get allowed fields that a repair type is permitted to modify.
   */
  async getAllowedFields(repair) {
    const rule = await this.getRepairRule(repair);
    return rule ? rule.fields : [];
  }
}

module.exports = new TaxonomyService();

