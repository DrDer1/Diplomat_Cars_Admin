let firebaseApp = null;
let firebaseStorage = null;

function initFirebase() {
    const config = getFirebaseConfig();
    if (!config) {
        console.error('Firebase config not found');
        return false;
    }
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return false;
        }
        if (!firebaseApp) {
            firebaseApp = firebase.initializeApp(config);
            firebaseStorage = firebase.storage();
        }
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
    return new Promise((resolve, reject) => {
        if (!initFirebase()) {
            reject(new Error('تعذر الاتصال بـ Firebase'));
            return;
        }
        if (!file) {
            reject(new Error('لم يتم اختيار ملف'));
            return;
        }
        if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            reject(new Error('نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, WebP'));
            return;
        }
        if (file.size > CONFIG.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            reject(new Error(`حجم الملف كبير جداً. الحد الأقصى: ${CONFIG.MAX_IMAGE_SIZE_MB}MB`));
            return;
        }
        const fileName = getCarImageFileName(carKey);
        const fullPath = CONFIG.FIREBASE_STORAGE_PATH + '/' + fileName;
        const storageRef = getStorageRef(fullPath);
        if (!storageRef) {
            reject(new Error('تعذر الاتصال بالتخزين'));
            return;
        }
        const metadata = {
            contentType: file.type,
            cacheControl: 'public,max-age=31536000'
        };
        const uploadTask = storageRef.put(file, metadata);
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
    return new Promise((resolve, reject) => {
        if (!initFirebase()) {
            resolve();
            return;
        }
        const fileName = getCarImageFileName(carKey);
        const fullPath = CONFIG.FIREBASE_STORAGE_PATH + '/' + fileName;
        const storageRef = getStorageRef(fullPath);
        if (!storageRef) {
            resolve();
            return;
        }
        storageRef.delete().then(function() {
            resolve();
        }).catch(function(error) {
            if (error.code === 'storage/object-not-found') {
                resolve();
            } else {
                console.warn('Error deleting image:', error);
                resolve();
            }
        });
    });
}

function getCarImageUrl(carKey) {
    return new Promise((resolve) => {
        if (!initFirebase()) {
            resolve(null);
            return;
        }
        const fileName = getCarImageFileName(carKey);
        const fullPath = CONFIG.FIREBASE_STORAGE_PATH + '/' + fileName;
        const storageRef = getStorageRef(fullPath);
        if (!storageRef) {
            resolve(null);
            return;
        }
        storageRef.getDownloadURL().then(function(url) {
            resolve(url);
        }).catch(function() {
            resolve(null);
        });
    });
}

function loadAllCarImages(carKeys) {
    return new Promise((resolve) => {
        if (!carKeys || carKeys.length === 0) {
            resolve({});
            return;
        }
        if (!initFirebase()) {
            resolve({});
            return;
        }
        const results = {};
        let completed = 0;
        carKeys.forEach(function(carKey) {
            getCarImageUrl(carKey).then(function(url) {
                results[carKey] = url;
                completed++;
                if (completed >= carKeys.length) {
                    resolve(results);
                }
            });
        });
        setTimeout(function() {
            resolve(results);
        }, 10000);
    });
}
