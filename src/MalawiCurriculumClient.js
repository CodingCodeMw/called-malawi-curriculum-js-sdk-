
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
     * @param {string} [config.baseUrl] - API Base URL
     * @param {string} [config.firebaseToken] - Firebase ID Token (for paid resource access)
     */
    constructor({ apiKey, baseUrl, firebaseToken }) {
        if (!apiKey) throw new Error('API Key is required');

        this.apiKey = apiKey;
        this.baseUrl = baseUrl || 'https://malawi-curricular-api-production.up.railway.app/api/v1';
        this.firebaseToken = firebaseToken;
    }

    /**
     * Set or update the Firebase ID Token
     * @param {string} token 
     */
    setFirebaseToken(token) {
        this.firebaseToken = token;
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
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        if (this.firebaseToken) {
            headers['X-Firebase-Token'] = this.firebaseToken;
        }

        try {
            const response = await fetch(url, { headers });

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
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        if (this.firebaseToken) {
            headers['X-Firebase-Token'] = this.firebaseToken;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
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
        // This old endpoint is gone/legacy, but for SDK compat we redirect to new flow if possible or just fail?
        // Since strict mode is on, we should probably advise new flow.
        // But let's try to map it to new flow if possible?
        // "downloadResource(id)" implies purpose=download.
        return this.download(id, 'download');
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

    /**
     * Helper to make authenticated DELETE requests
     * @private
     */
    async _delete(endpoint) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        if (this.firebaseToken) {
            headers['X-Firebase-Token'] = this.firebaseToken;
        }

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers
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
     * Initiate a payment (Subscription or Purchase).
     * @param {Object} data - Payment details
     * @param {'subscription'|'purchase'} data.type - Payment type
     * @param {string} data.mobile - Mobile number
     * @param {'TNM'|'AIRTEL'} data.operator - Mobile operator
     * @param {string} data.email - Email address
     * @param {string} [data.tier] - Subscription tier (for type='subscription')
     * @param {string} [data.developerId] - Developer ID (for type='purchase')
     * @param {number} [data.resourceId] - Resource ID (for type='purchase')
     * @param {number} [data.amount] - Amount (for type='purchase')
     * @returns {Promise<Object>} - { success, charge_id, status, message }
     */
    async initiatePayment(data) {
        return this._post('/payments/initiate', data);
    }

    /**
     * Verify a payment status.
     * @param {string} chargeId - The charge ID returned from initiatePayment
     * @returns {Promise<Object>} - { success, status, data }
     */
    async verifyPayment(chargeId) {
        return this._get(`/payments/verify/${chargeId}`, {}, (data) => data);
    }

    /**
     * Get related resources for a given resource
     * @param {number} resourceId - ID of the source resource
     * @returns {Promise<Resource[]>} Up to 5 related resources
     */
    async getRelatedResources(resourceId) {
        const response = await this._request(`/resources/${resourceId}/related`);
        return response.data || [];
    }

    /**
     * List bookmarked resources
     * @param {Object} [options]
     * @param {number} [options.limit] - Max results (1-100)
     * @param {number} [options.offset] - Pagination offset
     * @returns {Promise<Object[]>} Bookmarked resources with metadata
     */
    async getBookmarks(options = {}) {
        const response = await this._request('/bookmarks', options);
        return response.data || [];
    }

    /**
     * Bookmark a resource
     * @param {number} resourceId - ID of the resource to bookmark
     * @returns {Promise<Object>} Bookmark record
     */
    async addBookmark(resourceId) {
        const response = await this._post('/bookmarks', { resource_id: resourceId });
        return response.data;
    }

    /**
     * Remove a bookmark
     * @param {number} resourceId - ID of the resource to un-bookmark
     * @returns {Promise<Object>} Confirmation
     */
    async removeBookmark(resourceId) {
        return await this._delete(`/bookmarks/${resourceId}`);
    }
}
