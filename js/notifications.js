// BASED DAYANA ($DAYA) - Notification System
// Enhanced notification system for user feedback

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        // Create notification container
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Auto remove after duration
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        
        const icon = this.getIcon(type);
        const colors = this.getColors(type);
        
        notification.style.cssText = `
            background: ${colors.background};
            color: ${colors.text};
            border: 1px solid ${colors.border};
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        `;

        notification.innerHTML = `
            <div class="flex items-center">
                <i class="${icon} text-lg"></i>
                <span class="flex-1">${message}</span>
                <button class="ml-2 text-white hover:text-gray-300" onclick="window.notificationSystem.remove(this.parentElement.parentElement)">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `;

        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: 'fa-solid fa-check-circle text-green-400',
            error: 'fa-solid fa-exclamation-circle text-red-400',
            warning: 'fa-solid fa-exclamation-triangle text-yellow-400',
            info: 'fa-solid fa-info-circle text-blue-400',
            loading: 'fa-solid fa-spinner fa-spin text-orange-400'
        };
        return icons[type] || icons.info;
    }

    getColors(type) {
        const colorSchemes = {
            success: {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                text: '#ffffff',
                border: '#10b981'
            },
            error: {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                text: '#ffffff',
                border: '#ef4444'
            },
            warning: {
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                text: '#ffffff',
                border: '#f59e0b'
            },
            info: {
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                text: '#ffffff',
                border: '#3b82f6'
            },
            loading: {
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                text: '#ffffff',
                border: '#f97316'
            }
        };
        return colorSchemes[type] || colorSchemes.info;
    }

    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }

    // Convenience methods
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    loading(message, duration = 0) {
        return this.show(message, 'loading', duration);
    }
}

// Initialize notification system
window.notificationSystem = new NotificationSystem();

// Global convenience functions
window.showNotification = (message, type = 'info', duration = 5000) => {
    return window.notificationSystem.show(message, type, duration);
};

window.showSuccess = (message, duration = 5000) => {
    return window.notificationSystem.success(message, duration);
};

window.showError = (message, duration = 7000) => {
    return window.notificationSystem.error(message, duration);
};

window.showWarning = (message, duration = 6000) => {
    return window.notificationSystem.warning(message, duration);
};

window.showInfo = (message, duration = 5000) => {
    return window.notificationSystem.info(message, duration);
};

window.showLoading = (message, duration = 0) => {
    return window.notificationSystem.loading(message, duration);
};

console.log('🔔 Notification system loaded');


