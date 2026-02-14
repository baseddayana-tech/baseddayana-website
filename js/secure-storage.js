/**
 * 🔐 SECURE STORAGE - BASED DAYANA
 * Encrypted localStorage for sensitive data protection
 */

class SecureStorage {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
        this.storagePrefix = 'dayana_secure_';
        this.sensitiveKeys = [
            'wallet_address',
            'private_key',
            'mnemonic',
            'user_data',
            'session_token',
            'api_key'
        ];
    }
    
    /**
     * Generate encryption key from browser fingerprint
     * @returns {string} - Base64 encoded key
     */
    generateEncryptionKey() {
        // Create a unique key based on browser characteristics
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 0
        ].join('|');
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert to base64-like string
        return btoa(hash.toString()).substring(0, 32);
    }
    
    /**
     * Encrypt data using simple XOR cipher
     * @param {string} data - Data to encrypt
     * @param {string} key - Encryption key
     * @returns {string} - Encrypted data
     */
    encrypt(data, key = this.encryptionKey) {
        if (!data) return '';
        
        let encrypted = '';
        for (let i = 0; i < data.length; i++) {
            const dataChar = data.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            encrypted += String.fromCharCode(dataChar ^ keyChar);
        }
        
        return btoa(encrypted);
    }
    
    /**
     * Decrypt data using XOR cipher
     * @param {string} encryptedData - Encrypted data
     * @param {string} key - Decryption key
     * @returns {string} - Decrypted data
     */
    decrypt(encryptedData, key = this.encryptionKey) {
        if (!encryptedData) return '';
        
        try {
            const decoded = atob(encryptedData);
            let decrypted = '';
            
            for (let i = 0; i < decoded.length; i++) {
                const dataChar = decoded.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                decrypted += String.fromCharCode(dataChar ^ keyChar);
            }
            
            return decrypted;
        } catch (error) {
            console.error('Decryption failed:', error);
            return '';
        }
    }
    
    /**
     * Check if key contains sensitive data
     * @param {string} key - Key to check
     * @returns {boolean} - True if sensitive
     */
    isSensitiveKey(key) {
        return this.sensitiveKeys.some(sensitiveKey => 
            key.toLowerCase().includes(sensitiveKey.toLowerCase())
        );
    }
    
    /**
     * Set item in secure storage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @param {boolean} forceEncrypt - Force encryption even for non-sensitive data
     */
    setItem(key, value, forceEncrypt = false) {
        if (!key) return;
        
        const fullKey = this.storagePrefix + key;
        const shouldEncrypt = forceEncrypt || this.isSensitiveKey(key);
        
        try {
            const dataToStore = {
                value: value,
                encrypted: shouldEncrypt,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            if (shouldEncrypt) {
                dataToStore.value = this.encrypt(JSON.stringify(value));
            }
            
            localStorage.setItem(fullKey, JSON.stringify(dataToStore));
        } catch (error) {
            console.error('Failed to store data:', error);
        }
    }
    
    /**
     * Get item from secure storage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if not found
     * @returns {any} - Stored value or default
     */
    getItem(key, defaultValue = null) {
        if (!key) return defaultValue;
        
        const fullKey = this.storagePrefix + key;
        
        try {
            const stored = localStorage.getItem(fullKey);
            if (!stored) return defaultValue;
            
            const data = JSON.parse(stored);
            
            // Check if data is encrypted
            if (data.encrypted) {
                const decrypted = this.decrypt(data.value);
                return decrypted ? JSON.parse(decrypted) : defaultValue;
            } else {
                return data.value;
            }
        } catch (error) {
            console.error('Failed to retrieve data:', error);
            return defaultValue;
        }
    }
    
    /**
     * Remove item from secure storage
     * @param {string} key - Storage key
     */
    removeItem(key) {
        if (!key) return;
        
        const fullKey = this.storagePrefix + key;
        localStorage.removeItem(fullKey);
    }
    
    /**
     * Clear all secure storage
     */
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                localStorage.removeItem(key);
            }
        });
    }
    
    /**
     * Get all stored keys
     * @returns {Array} - Array of keys
     */
    getAllKeys() {
        const keys = Object.keys(localStorage);
        return keys
            .filter(key => key.startsWith(this.storagePrefix))
            .map(key => key.substring(this.storagePrefix.length));
    }
    
    /**
     * Check if key exists
     * @param {string} key - Key to check
     * @returns {boolean} - True if exists
     */
    hasItem(key) {
        if (!key) return false;
        
        const fullKey = this.storagePrefix + key;
        return localStorage.getItem(fullKey) !== null;
    }
    
    /**
     * Get storage size information
     * @returns {object} - Storage statistics
     */
    getStorageInfo() {
        const keys = this.getAllKeys();
        let totalSize = 0;
        let encryptedCount = 0;
        
        keys.forEach(key => {
            const fullKey = this.storagePrefix + key;
            const item = localStorage.getItem(fullKey);
            if (item) {
                totalSize += item.length;
                try {
                    const data = JSON.parse(item);
                    if (data.encrypted) encryptedCount++;
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        });
        
        return {
            totalKeys: keys.length,
            totalSize: totalSize,
            encryptedItems: encryptedCount,
            unencryptedItems: keys.length - encryptedCount
        };
    }
    
    /**
     * Clean expired items
     * @param {number} maxAge - Maximum age in milliseconds
     */
    cleanExpired(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        const keys = this.getAllKeys();
        const now = Date.now();
        
        keys.forEach(key => {
            const fullKey = this.storagePrefix + key;
            try {
                const stored = localStorage.getItem(fullKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data.timestamp && (now - data.timestamp) > maxAge) {
                        localStorage.removeItem(fullKey);
                    }
                }
            } catch (error) {
                // Remove corrupted data
                localStorage.removeItem(fullKey);
            }
        });
    }
    
    /**
     * Export encrypted data
     * @returns {string} - Encrypted export data
     */
    exportData() {
        const keys = this.getAllKeys();
        const exportData = {};
        
        keys.forEach(key => {
            exportData[key] = this.getItem(key);
        });
        
        return this.encrypt(JSON.stringify(exportData));
    }
    
    /**
     * Import encrypted data
     * @param {string} encryptedData - Encrypted data to import
     * @returns {boolean} - Success status
     */
    importData(encryptedData) {
        try {
            const decrypted = this.decrypt(encryptedData);
            const data = JSON.parse(decrypted);
            
            Object.entries(data).forEach(([key, value]) => {
                this.setItem(key, value);
            });
            
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }
}

// Create global instance
window.SecureStorage = new SecureStorage();

// Override localStorage methods for automatic encryption
(function() {
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.setItem = function(key, value) {
        // Check if this is a sensitive key
        if (window.SecureStorage.isSensitiveKey(key)) {
            console.warn('Sensitive data detected, using secure storage instead');
            window.SecureStorage.setItem(key, value);
            return;
        }
        
        originalSetItem.call(this, key, value);
    };
    
    localStorage.getItem = function(key) {
        // Check if this is a sensitive key
        if (window.SecureStorage.isSensitiveKey(key)) {
            return window.SecureStorage.getItem(key);
        }
        
        return originalGetItem.call(this, key);
    };
    
    localStorage.removeItem = function(key) {
        // Check if this is a sensitive key
        if (window.SecureStorage.isSensitiveKey(key)) {
            window.SecureStorage.removeItem(key);
            return;
        }
        
        originalRemoveItem.call(this, key);
    };
})();

console.log('🔐 Secure Storage loaded - Data encryption active');
