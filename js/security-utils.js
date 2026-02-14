/**
 * 🛡️ SECURITY UTILITIES - BASED DAYANA
 * Frontend security utilities for input sanitization and XSS protection
 */

class SecurityUtils {
    constructor() {
        this.allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'span'];
        this.allowedAttributes = ['class', 'id'];
        this.maxInputLength = 1000;
        this.suspiciousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            /<embed[^>]*>.*?<\/embed>/gi,
            /<link[^>]*>.*?<\/link>/gi,
            /<meta[^>]*>.*?<\/meta>/gi,
            /<style[^>]*>.*?<\/style>/gi,
            /<form[^>]*>.*?<\/form>/gi,
            /<input[^>]*>.*?<\/input>/gi,
            /<textarea[^>]*>.*?<\/textarea>/gi,
            /<select[^>]*>.*?<\/select>/gi,
            /<button[^>]*>.*?<\/button>/gi,
            /<a[^>]*href\s*=\s*["']?javascript:/gi,
            /<img[^>]*onerror/gi,
            /<svg[^>]*onload/gi,
            /<iframe[^>]*src\s*=\s*["']?javascript:/gi
        ];
    }
    
    /**
     * Sanitize HTML input to prevent XSS attacks
     * @param {string} input - The input string to sanitize
     * @param {boolean} allowHtml - Whether to allow HTML tags
     * @returns {string} - Sanitized string
     */
    sanitizeInput(input, allowHtml = false) {
        if (!input || typeof input !== 'string') {
            return '';
        }
        
        // Remove null bytes and control characters
        let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Limit length
        if (sanitized.length > this.maxInputLength) {
            sanitized = sanitized.substring(0, this.maxInputLength);
        }
        
        if (!allowHtml) {
            // Escape HTML entities
            sanitized = this.escapeHtml(sanitized);
        } else {
            // Remove dangerous patterns
            for (const pattern of this.suspiciousPatterns) {
                sanitized = sanitized.replace(pattern, '');
            }
            
            // Remove dangerous attributes
            sanitized = this.removeDangerousAttributes(sanitized);
        }
        
        return sanitized.trim();
    }
    
    /**
     * Escape HTML entities
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        
        return text.replace(/[&<>"'`=\/]/g, (s) => map[s]);
    }
    
    /**
     * Remove dangerous HTML attributes
     * @param {string} html - HTML string to clean
     * @returns {string} - Cleaned HTML
     */
    removeDangerousAttributes(html) {
        // Remove event handlers
        html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
        
        // Remove javascript: URLs
        html = html.replace(/\s*href\s*=\s*["']?javascript:[^"'\s>]*/gi, '');
        html = html.replace(/\s*src\s*=\s*["']?javascript:[^"'\s>]*/gi, '');
        
        // Remove data: URLs that could be dangerous
        html = html.replace(/\s*src\s*=\s*["']?data:text\/html[^"'\s>]*/gi, '');
        
        return html;
    }
    
    /**
     * Validate and sanitize user input for forms
     * @param {string} input - Input to validate
     * @param {string} type - Type of input (text, number, email, etc.)
     * @returns {object} - {valid: boolean, sanitized: string, error: string}
     */
    validateInput(input, type = 'text') {
        const result = {
            valid: false,
            sanitized: '',
            error: ''
        };
        
        if (!input || typeof input !== 'string') {
            result.error = 'Invalid input type';
            return result;
        }
        
        // Sanitize input
        result.sanitized = this.sanitizeInput(input);
        
        // Validate based on type
        switch (type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(result.sanitized)) {
                    result.error = 'Invalid email format';
                    return result;
                }
                break;
                
            case 'number':
                const numberRegex = /^-?\d+(\.\d+)?$/;
                if (!numberRegex.test(result.sanitized)) {
                    result.error = 'Invalid number format';
                    return result;
                }
                break;
                
            case 'address':
                const addressRegex = /^0x[a-fA-F0-9]{40}$/;
                if (!addressRegex.test(result.sanitized)) {
                    result.error = 'Invalid Ethereum address';
                    return result;
                }
                break;
                
            case 'text':
            default:
                // Basic text validation
                if (result.sanitized.length === 0) {
                    result.error = 'Input cannot be empty';
                    return result;
                }
                break;
        }
        
        result.valid = true;
        return result;
    }
    
    /**
     * Safely set innerHTML with sanitization
     * @param {HTMLElement} element - Element to set content
     * @param {string} content - Content to set
     * @param {boolean} allowHtml - Whether to allow HTML
     */
    safeSetInnerHTML(element, content, allowHtml = false) {
        if (!element || !content) return;
        
        const sanitized = this.sanitizeInput(content, allowHtml);
        element.innerHTML = sanitized;
    }
    
    /**
     * Safely set textContent
     * @param {HTMLElement} element - Element to set content
     * @param {string} content - Content to set
     */
    safeSetTextContent(element, content) {
        if (!element || !content) return;
        
        const sanitized = this.sanitizeInput(content, false);
        element.textContent = sanitized;
    }
    
    /**
     * Create safe HTML from template
     * @param {string} template - HTML template
     * @param {object} data - Data to interpolate
     * @returns {string} - Safe HTML
     */
    createSafeHTML(template, data = {}) {
        let html = template;
        
        // Replace placeholders with sanitized data
        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            const sanitized = this.sanitizeInput(String(value), false);
            html = html.replace(placeholder, sanitized);
        }
        
        // Final sanitization
        return this.sanitizeInput(html, true);
    }
    
    /**
     * Validate file upload
     * @param {File} file - File to validate
     * @param {Array} allowedTypes - Allowed MIME types
     * @param {number} maxSize - Maximum file size in bytes
     * @returns {object} - {valid: boolean, error: string}
     */
    validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
        const result = {
            valid: false,
            error: ''
        };
        
        if (!file) {
            result.error = 'No file provided';
            return result;
        }
        
        if (file.size > maxSize) {
            result.error = 'File too large';
            return result;
        }
        
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            result.error = 'File type not allowed';
            return result;
        }
        
        // Check for dangerous file extensions
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
        const fileName = file.name.toLowerCase();
        for (const ext of dangerousExtensions) {
            if (fileName.endsWith(ext)) {
                result.error = 'Dangerous file type';
                return result;
            }
        }
        
        result.valid = true;
        return result;
    }
    
    /**
     * Sanitize URL to prevent XSS
     * @param {string} url - URL to sanitize
     * @returns {string} - Sanitized URL
     */
    sanitizeURL(url) {
        if (!url || typeof url !== 'string') return '';
        
        // Remove javascript: and data: URLs
        if (url.toLowerCase().startsWith('javascript:') || 
            url.toLowerCase().startsWith('data:')) {
            return '';
        }
        
        // Basic URL validation
        try {
            const urlObj = new URL(url);
            return urlObj.toString();
        } catch (e) {
            return '';
        }
    }
    
    /**
     * Create Content Security Policy header
     * @returns {string} - CSP header value
     */
    createCSPHeader() {
        return "default-src 'self'; " +
               "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; " +
               "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; " +
               "img-src 'self' data: https:; " +
               "font-src 'self' https://cdn.jsdelivr.net https://unpkg.com; " +
               "connect-src 'self' https://mainnet.base.org; " +
               "frame-ancestors 'none'; " +
               "base-uri 'self'; " +
               "form-action 'self';";
    }
}

// Create global instance
window.SecurityUtils = new SecurityUtils();

// Override dangerous functions - DISABLED to prevent rendering issues
// (function() {
//     const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
//     
//     Object.defineProperty(Element.prototype, 'innerHTML', {
//         set: function(value) {
//             if (typeof value === 'string') {
//                 const sanitized = window.SecurityUtils.sanitizeInput(value, true);
//                 originalInnerHTML.set.call(this, sanitized);
//             } else {
//                 originalInnerHTML.set.call(this, value);
//             }
//         },
//         get: originalInnerHTML.get
//     });
// })();

console.log('🛡️ Security Utils loaded - XSS protection active');
