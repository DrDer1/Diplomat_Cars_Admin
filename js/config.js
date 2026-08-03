const CONFIG = {
    STORAGE_KEYS: {
        FIREBASE_CONFIG: 'dc_admin_firebase_config',
        ONESIGNAL_APP_ID: 'dc_admin_onesignal_app_id',
        ONESIGNAL_REST_API: 'dc_admin_onesignal_rest_api',
        ADMIN_PASSWORD: 'dc_admin_password',
        WHATSAPP_NUMBERS: 'dc_admin_whatsapp_numbers',
        CAR_IMAGE_MAP: 'dc_admin_car_image_map',
        LAST_UPDATE: 'dc_admin_last_update',
        SCHEDULED_NOTIFICATIONS: 'dc_admin_scheduled_notifications'
    },
    DEFAULTS: {
        ADMIN_PASSWORD: 'admin',
        WHATSAPP_NUMBERS: {
            rustaq: [
                {"phone": "96872222242", "label": "مالك المعرض"},
                {"phone": "96898825877", "label": "خدمة عملاء الرستاق"},
                {"phone": "96895096865", "label": "مدير فرع الرستاق"}
            ],
            mabela: [
                {"phone": "96892256223", "label": "مبيعات المعبيلة"},
                {"phone": "96878080132", "label": "خدمة عملاء المعبيلة"}
            ]
        },
        FIREBASE_CONFIG: {
            apiKey: "AIzaSyAQXzehspAW6XYellWZVues_Px9Au4Pb4Q",
            authDomain: "diplomat-cars-70ed3.firebaseapp.com",
            projectId: "diplomat-cars-70ed3",
            storageBucket: "diplomat-cars-70ed3.firebasestorage.app",
            messagingSenderId: "189200582804",
            appId: "1:189200582804:web:8651f2945b86dcfafa0c81"
        },
        ONESIGNAL_APP_ID: 'a5ef5e42-56c9-4af7-a4e2-4cf17c8d7505',
        ONESIGNAL_REST_API: 'YOUR_REST_API_KEY'
    },
    FIREBASE_STORAGE_PATH: 'car_images',
    MAX_IMAGE_SIZE_MB: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    TOAST_DURATION: 3000
};

function getStorageItem(key, defaultValue) {
    try {
        var value = localStorage.getItem(key);
        if (value === null || value === undefined) return defaultValue;
        return JSON.parse(value);
    } catch (e) {
        return defaultValue;
    }
}

function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        return false;
    }
}

function getFirebaseConfig() {
    return getStorageItem(CONFIG.STORAGE_KEYS.FIREBASE_CONFIG, CONFIG.DEFAULTS.FIREBASE_CONFIG);
}

function getOneSignalAppId() {
    return getStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_APP_ID, CONFIG.DEFAULTS.ONESIGNAL_APP_ID);
}

function getOneSignalRestApiKey() {
    return getStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_REST_API, CONFIG.DEFAULTS.ONESIGNAL_REST_API);
}

function getAdminPassword() {
    return getStorageItem(CONFIG.STORAGE_KEYS.ADMIN_PASSWORD, CONFIG.DEFAULTS.ADMIN_PASSWORD);
}

function getWhatsAppNumbers() {
    return getStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, CONFIG.DEFAULTS.WHATSAPP_NUMBERS);
}

function getCarImageMap() {
    return getStorageItem(CONFIG.STORAGE_KEYS.CAR_IMAGE_MAP, {});
}

function getScheduledNotifications() {
    return getStorageItem(CONFIG.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, []);
}

function generateCarKey(carName, category, model, branch) {
    var str = (branch || '') + '_' + (carName || '') + '_' + (category || '') + '_' + (model || '');
    str = str.toLowerCase();
    str = str.replace(/[^a-z0-9\u0600-\u06FF_]/g, '_');
    str = str.replace(/_+/g, '_');
    str = str.replace(/^_|_$/g, '');
    return str;
}

function getCarImageFileName(carKey) {
    return carKey + '.jpg';
}

function formatPrice(price) {
    if (!price) return '';
    var num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return String(price);
    return num.toLocaleString('en-US');
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    try {
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var now = new Date();
        var diffMs = now - d;
        var diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return 'منذ ' + diffMins + ' دقيقة';
        var diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return 'منذ ' + diffHours + ' ساعة';
        var diffDays = Math.floor(diffHours / 24);
        return 'منذ ' + diffDays + ' يوم';
    } catch (e) {
        return '';
    }
}
