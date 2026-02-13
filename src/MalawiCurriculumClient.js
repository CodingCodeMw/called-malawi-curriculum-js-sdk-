
/**
 * @typedef {Object} ResourceFilter
 * @property {string} [level] - Education level (e.g., 'MSCE', 'JCE', 'PRIMARY')
 * @property {string} [subject] - Subject name (e.g., 'Mathematics')
 * @property {string} [type] - Resource type (e.g., 'past_paper', 'textbook')
 * @property {number} [year] - Year of the resource
 * @property {number} [limit] - Max number of results (1-100)
 * @property {number} [offset] - Pagination offset
 */

/**
 * @typedef {Object} Resource
 * @property {number} id
 * @property {string} title
 * @property {string} type
 * @property {string} subject
 * @property {string} level
 * @property {number|null} year
 * @property {string|null} description
 * @property {number} price_mwk - Price in MWK (requires API key setup)
 * @property {boolean} is_free - Whether the resource is free for the requesting developer
 */

export class MalawiCurriculumClient {
    /**
     * @param {Object} config
     * @param {string} config.apiKey - Your API Key
     * @param {string} [config.baseUrl] - API Base URL (default: https://malawi-curricular-api-production.up.railway.app/api/v1)
     */
    constructor({ apiKey, baseUrl }) {
        if (!apiKey) throw new Error('API Key is required');

        this.apiKey = apiKey;
        this.baseUrl = baseUrl || 'https://malawi-curricular-api-production.up.railway.app/api/v1';
    }

    /**
     * Helper to make authenticated requests
     * @private
     */
    async _request(endpoint, query = {}) {
        // Filter out undefined query params
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        });

        const url = `${this.baseUrl}${endpoint}?${params.toString()}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const json = await response.json();
            return json;
        } catch (error) {
            if (error.cause) console.error('Network Error Cause:', error.cause);
            throw error;
        }
    }

    /**
     * Helper to make authenticated POST requests
     * @private
     */
    async _post(endpoint, body = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.cause) console.error('Network Error Cause:', error.cause);
            throw error;
        }
    }

    /**
     * Get filtered resources
     * @param {ResourceFilter} filter 
     * @returns {Promise<Resource[]>}
     */
    async getResources(filter = {}) {
        const response = await this._request('/resources', filter);
        return response.data || [];
    }

    /**
     * Get all subjects, optionally filtered by level
     * @param {string} [level] 
     * @returns {Promise<Object[]>}
     */
    async getSubjects(level) {
        const response = await this._request('/subjects', { level });
        return response.data || [];
    }

    /**
     * Get all education levels
     * @returns {Promise<Object[]>}
     */
    async getLevels() {
        const response = await this._request('/levels');
        return response.data || [];
    }

    /**
     * Search resources with plan-tiered filtering
     * @param {Object} options
     * @param {string} options.q - Search query (required, min 2 chars)
     * @param {string} [options.level] - Filter by level (Basic+ plans)
     * @param {string} [options.subject] - Filter by subject (Basic+ plans)
     * @param {string} [options.type] - Filter by type (Pro+ plans)
     * @param {number} [options.year] - Filter by year (Pro+ plans)
     * @param {number} [options.limit] - Max results (capped by plan)
     * @param {number} [options.offset] - Pagination offset
     * @param {string} [options.sort] - Sort order (Enterprise only: 'relevance', 'newest', 'oldest', 'title')
     * @returns {Promise<Object>} Search results with tier info
     */
    async search(options = {}) {
        return await this._request('/search', options);
    }

    /**
     * Request a secure download token
     * @param {number} resourceId - ID of the resource to download
     * @param {string} [purpose='download'] - Intent: 'view' (free preview/full sub access) or 'download' (paid/discounted)
     * @returns {Promise<{token: string, expires_in_seconds: number, download_url: string, access_level: string, pages_allowed: number|null}>}
     */
    async requestDownload(resourceId, purpose = 'download') {
        return await this._post('/downloads/request', { resourceId, purpose });
    }

    /**
     * Redeem a download token to get the file URL
     * @param {string} token - Token from requestDownload()
     * @returns {Promise<{download_url: string, expires_in_seconds: number, attempts_remaining: number}>}
     */
    async redeemDownload(token) {
        return await this._request(`/downloads/${token}`);
    }

    /**
     * Convenience: Request token and redeem in one call
     * @param {number} resourceId
     * @param {string} [purpose='download']
     * @returns {Promise<string>} Signed download URL
     */
    async download(resourceId, purpose = 'download') {
        const { token } = await this.requestDownload(resourceId, purpose);
        const { download_url } = await this.redeemDownload(token);
        return download_url;
    }

    /**
     * @deprecated Use requestDownload() + redeemDownload() or download() instead
     * @param {number} id 
     * @returns {Promise<string>} Signed download URL
     */
    async downloadResource(id) {
        console.warn('[DEPRECATED] downloadResource() is deprecated. Use download() for the secure token flow.');
        const response = await this._request(`/resources/${id}/download`);
        return response.download_url;
    }

    /**
     * Set or update pricing for a resource
     * @param {Object} options
     * @param {number} options.resourceId - ID of the resource to price
     * @param {number} [options.price] - Price in MWK (ignored if isFree is true)
     * @param {boolean} [options.isFree] - Set to true to make the resource free
     * @returns {Promise<{resource_id: number, price_mwk: number, is_free: boolean}>}
     */
    async setPrice({ resourceId, price, isFree }) {
        const response = await this._post('/pricing/set', { resourceId, price, isFree });
        return response.data;
    }

    /**
     * Get the price set for a specific resource
     * @param {number} resourceId - ID of the resource
     * @returns {Promise<{resource_id: number, price_mwk: number, is_free: boolean}>}
     */
    async getPrice(resourceId) {
        const response = await this._request(`/pricing/${resourceId}`);
        return response.data;
    }
}
