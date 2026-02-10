
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
     * Get download URL for a resource (Paid plans only)
     * @param {number} id 
     * @returns {Promise<string>} Signed download URL
     */
    async downloadResource(id) {
        const response = await this._request(`/resources/${id}/download`);
        return response.download_url;
    }
}
