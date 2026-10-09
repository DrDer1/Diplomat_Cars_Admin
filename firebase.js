var firebaseApp = null;
var firebaseStorage = null;

function initFirebase() {
    var config = getFirebaseConfig();
    if (!config || !config.apiKey) {
        console.error('Firebase config not found');
        return false;
    }
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return false;
        }
        if (firebaseApp) {
            firebaseApp = null;
            firebaseStorage = null;
        }
        firebaseApp = firebase.initializeApp(config);
        firebaseStorage = firebase.storage();
        return true;
    } catch (e) {
        if (e.code === 'app/duplicate-app') {
            firebaseApp = firebase.app();
            firebaseStorage = firebase.storage();
            return true;
        }
        console.error('Firebase init error:', e);
        return false;
    }
}

function getStorageRef(path) {
    if (!firebaseStorage) {
        if (!initFirebase()) return null;
    }
    return firebaseStorage.ref(path);
}

function uploadCarImage(carKey, file) {
    return new Promise(function(resolve, reject) {
        if (!initFirebase()) {
            reject(new Error('تعذر الاتصال بـ Firebase'));
            return;
        }
        if (!file) {
            reject(new Error('لم يتم اختيار ملف'));
            return;
        }
        if (CONFIG.ALLOWED_IMAGE_TYPES.indexOf(file.type) === -1) {
            reject(new Error('نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, WebP'));
            return;
        }
        if (file.size > CONFIG.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            reject(new Error('حجم الملف كبير جداً. الحد الأقصى: ' + CONFIG.MAX_IMAGE_SIZE_MB + 'MB'));
            return;
        }
        var fileName = getCarImageFileName(carKey);
        var fullPath = CONFIG.FIREBASE_STORAGE_PATH + '/' + fileName;
        var storageRef = getStorageRef(fullPath);
        if (!storageRef) {
            reject(new Error('تعذر الاتصال بالتخزين'));
            return;
        }
        var metadata = {
            contentType: file.type,
            cacheControl: 'public,max-age=31536000'
        };
        var uploadTask = storageRef.put(file, metadata);
        uploadTask.on('state_changed',
            function(snapshot) {},
            function(error) {
                reject(new Error('فشل رفع الصورة: ' + error.message));
            },
            function() {
                uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
                    resolve(downloadURL);
                }).catch(function(error) {
                    reject(new Error('فشل الحصول على رابط الصورة: ' + error.message));
                });
            }
        );
    });
}

function deleteCarImage(carKey) {
    return new Promise(function(resolve) {
        if (!initFirebase()) { resolve(); return; }
        var fileName = getCarImageFileName(carKey);
        var fullPath = CONFIG.FIREBASE_STORAGE_PATH + '/' + fileName;
        var storageRef = getStorageRef(fullPath);
        if (!storageRef) { resolve(); return; }
        storageRef.delete().then(function() {
            resolve();
        }).catch(function(error) {
            if (error.code === 'storage/object-not-found') { resolve(); }
            else { console.warn('Error deleting image:', error); resolve(); }
        });
    });
}

function getCarImageUrl(carKey) {
    return new Promise(function(resolve) {
        if (!initFirebase()) { resolve(null); return; }
        var fileName = getCarImageFileName(carKey);
        var fullPath = CONFIG.FIREBASE_STORAGE_PATH + '/' + fileName;
        var storageRef = getStorageRef(fullPath);
        if (!storageRef) { resolve(null); return; }
        storageRef.getDownloadURL().then(function(url) {
            resolve(url);
        }).catch(function() {
            resolve(null);
        });
    });
}

function loadAllCarImages(carKeys) {
    return new Promise(function(resolve) {
        if (!carKeys || carKeys.length === 0) { resolve({}); return; }
        if (!initFirebase()) { resolve({}); return; }
        var results = {};
        var completed = 0;
        carKeys.forEach(function(carKey) {
            getCarImageUrl(carKey).then(function(url) {
                results[carKey] = url;
                completed++;
                if (completed >= carKeys.length) { resolve(results); }
            });
        });
        setTimeout(function() { resolve(results); }, 10000);
    });
}
