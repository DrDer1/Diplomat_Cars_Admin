const CONFIG = {
    STORAGE_KEYS: {
        SETUP_DONE: 'dc_admin_setup_done',
        FIREBASE_CONFIG: 'dc_admin_firebase_config',
        ONESIGNAL_APP_ID: 'dc_admin_onesignal_app_id',
        ONESIGNAL_REST_API: 'dc_admin_onesignal_rest_api',
        GOOGLE_SHEETS_CSV: 'dc_admin_gs_csv_url',
        ADMIN_PASSWORD: 'dc_admin_password',
        WHATSAPP_NUMBERS: 'dc_admin_whatsapp_numbers',
        CAR_IMAGE_MAP: 'dc_admin_car_image_map',
        LAST_UPDATE: 'dc_admin_last_update',
        LAST_KNOWN_CARS: 'dc_admin_last_known_cars',
        SCHEDULED_NOTIFICATIONS: 'dc_admin_scheduled_notifications',
        NOTIF_CHECK_INTERVAL: 'dc_admin_notif_check_interval'
    },
    DEFAULTS: {
        CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTWnnQ_mk_fXgnpWGc54yVlNP3s0SES-3iHb50o_F4t0HLu_ilMn5G9uLN9UUdF6XLdYXkfyNqCpHNF/pub?gid=0&single=true&output=csv',
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
        CHECK_INTERVAL_MINUTES: 30
    },
    FIREBASE_STORAGE_PATH: 'car_images',
    MAX_IMAGE_SIZE_MB: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    TOAST_DURATION: 3000,
    SIDEBAR_BREAKPOINT: 900
};

function getStorageItem(key, defaultValue) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? JSON.parse(value) : defaultValue;
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

function removeStorageItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        return false;
    }
}

function getFirebaseConfig() {
    return getStorageItem(CONFIG.STORAGE_KEYS.FIREBASE_CONFIG, null);
}

function getOneSignalAppId() {
    return getStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_APP_ID, '');
}

function getOneSignalRestApiKey() {
    return getStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_REST_API, '');
}

function getGoogleSheetsCsvUrl() {
    return getStorageItem(CONFIG.STORAGE_KEYS.GOOGLE_SHEETS_CSV, CONFIG.DEFAULTS.CSV_URL);
}

function getAdminPassword() {
    return getStorageItem(CONFIG.STORAGE_KEYS.ADMIN_PASSWORD, '');
}

function getWhatsAppNumbers() {
    return getStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, CONFIG.DEFAULTS.WHATSAPP_NUMBERS);
}

function getCarImageMap() {
    return getStorageItem(CONFIG.STORAGE_KEYS.CAR_IMAGE_MAP, {});
}

function getLastKnownCars() {
    return getStorageItem(CONFIG.STORAGE_KEYS.LAST_KNOWN_CARS, []);
}

function getScheduledNotifications() {
    return getStorageItem(CONFIG.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, []);
}

function getNotifCheckInterval() {
    return getStorageItem(CONFIG.STORAGE_KEYS.NOTIF_CHECK_INTERVAL, CONFIG.DEFAULTS.CHECK_INTERVAL_MINUTES);
}

function isSetupDone() {
    return getStorageItem(CONFIG.STORAGE_KEYS.SETUP_DONE, false);
}

function generateCarKey(carName, category, model, branch) {
    var str = (branch + '_' + carName + '_' + category + '_' + model).toLowerCase();
    return str.replace(/[^a-z0-9\u0600-\u06FF_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
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

function formatDateTime(dateStr) {
    if (!dateStr) return '--:--';
    try {
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        var options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
        return d.toLocaleString('ar-SA', options);
    } catch (e) {
        return dateStr;
    }
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
