function getGitHubApiUrl(owner, repo, path, branch) {
    return 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path + '?ref=' + branch;
}

function getGitHubRawUrl(owner, repo, branch, path, fileName) {
    return 'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + branch + '/' + path + '/' + fileName;
}

function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() {
            var result = reader.result;
            var base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = function() { reject(new Error('فشل قراءة الملف')); };
        reader.readAsDataURL(file);
    });
}

function githubRequest(url, options) {
    return fetch(url, options).then(function(response) {
        if (response.status === 404) return null;
        return response.json().then(function(data) {
            if (!response.ok) {
                var msg = data && data.message ? data.message : 'خطأ في الاتصال بـ GitHub';
                throw new Error(msg);
            }
            return data;
        });
    });
}

function getFileShaFromGitHub(fileName) {
    var cfg = getGitHubConfig();
    if (!cfg.token || !cfg.owner || !cfg.repo) return Promise.resolve(null);
    var url = getGitHubApiUrl(cfg.owner, cfg.repo, cfg.path + '/' + fileName, cfg.branch);
    return githubRequest(url, {
        headers: {
            'Authorization': 'token ' + cfg.token,
            'Accept': 'application/vnd.github+json'
        }
    }).then(function(data) {
        return data && data.sha ? data.sha : null;
    }).catch(function() { return null; });
}

function uploadCarImage(carKey, file) {
    return new Promise(function(resolve, reject) {
        var cfg = getGitHubConfig();
        if (!cfg.token || !cfg.owner || !cfg.repo) {
            reject(new Error('الرجاء إعداد GitHub من صفحة الإعدادات'));
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
        var filePath = cfg.path + '/' + fileName;
        var apiUrl = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + filePath;

        fileToBase64(file).then(function(base64) {
            return getFileShaFromGitHub(fileName).then(function(existingSha) {
                var body = {
                    message: 'Update car image: ' + fileName,
                    content: base64,
                    branch: cfg.branch
                };
                if (existingSha) body.sha = existingSha;
                return fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'token ' + cfg.token,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }).then(function(response) {
                    return response.json().then(function(data) {
                        if (!response.ok) {
                            var msg = data && data.message ? data.message : 'فشل رفع الصورة';
                            throw new Error(msg);
                        }
                        var rawUrl = getGitHubRawUrl(cfg.owner, cfg.repo, cfg.branch, cfg.path, fileName);
                        resolve(rawUrl);
                    });
                });
            });
        }).catch(function(error) {
            reject(error);
        });
    });
}

function deleteCarImage(carKey) {
    return new Promise(function(resolve) {
        var cfg = getGitHubConfig();
        if (!cfg.token || !cfg.owner || !cfg.repo) { resolve(); return; }
        var fileName = getCarImageFileName(carKey);
        var filePath = cfg.path + '/' + fileName;
        var apiUrl = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + filePath;

        getFileShaFromGitHub(fileName).then(function(sha) {
            if (!sha) { resolve(); return; }
            fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'token ' + cfg.token,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Delete car image: ' + fileName,
                    sha: sha,
                    branch: cfg.branch
                })
            }).then(function() {
                resolve();
            }).catch(function() {
                resolve();
            });
        }).catch(function() {
            resolve();
        });
    });
}

function getCarImageUrl(carKey) {
    return new Promise(function(resolve) {
        var cfg = getGitHubConfig();
        if (!cfg.owner || !cfg.repo || !cfg.branch || !cfg.path) { resolve(null); return; }
        var fileName = getCarImageFileName(carKey);
        var rawUrl = getGitHubRawUrl(cfg.owner, cfg.repo, cfg.branch, cfg.path, fileName);
        fetch(rawUrl, { method: 'HEAD' }).then(function(response) {
            resolve(response.ok ? rawUrl : null);
        }).catch(function() {
            resolve(null);
        });
    });
}

function loadAllCarImages(carKeys) {
    return new Promise(function(resolve) {
        if (!carKeys || carKeys.length === 0) { resolve({}); return; }
        var cfg = getGitHubConfig();
        if (!cfg.owner || !cfg.repo || !cfg.branch || !cfg.path) { resolve({}); return; }
        var results = {};
        var completed = 0;
        var total = carKeys.length;
        carKeys.forEach(function(carKey) {
            getCarImageUrl(carKey).then(function(url) {
                results[carKey] = url;
                completed++;
                if (completed >= total) resolve(results);
            });
        });
        setTimeout(function() { resolve(results); }, 15000);
    });
}
