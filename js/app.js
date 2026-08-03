(function() {
    'use strict';

    var carsData = { rustaq: [], mabela: [] };
    var currentBranch = 'rustaq';
    var carImageUrls = {};
    var currentPage = 'home';
    var sidebarOpen = false;
    var isOnline = navigator.onLine;

    var SHEETS = {
        rustaq: '1KIgAoTO0sbKtvVNt775ZCyuSAW8Bf8HbFyUXCY9pIV0',
        mabela: '1C_zsV_9l_SN0O5YN118OT49ng9H67sFIBWvk1Qr_3Gg'
    };

    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    var elements = {};

    function cacheElements() {
        elements.setupScreen = $('#setup-screen');
        elements.passwordScreen = $('#password-screen');
        elements.createPasswordScreen = $('#create-password-screen');
        elements.mainScreen = $('#main-screen');
        elements.setupForm = $('#setup-form');
        elements.passwordForm = $('#password-form');
        elements.createPasswordForm = $('#create-password-form');
        elements.sidebar = $('#sidebar');
        elements.overlay = $('#overlay');
        elements.menuToggle = $('#menu-toggle');
        elements.content = $('#content');
        elements.carsGrid = $('#cars-grid');
        elements.carsEmpty = $('#cars-empty');
        elements.carsSearch = $('#cars-search');
        elements.carsFilter = $('#cars-filter');
        elements.carsCount = $('#cars-count');
        elements.lastUpdate = $('#last-update');
        elements.refreshBtn = $('#refresh-btn');
        elements.manualNotifForm = $('#manual-notif-form');
        elements.scheduledNotifs = $('#scheduled-notifs');
        elements.addScheduledBtn = $('#add-scheduled-btn');
        elements.whatsappNumbers = $('#whatsapp-numbers');
        elements.addWhatsappBtn = $('#add-whatsapp-btn');
        elements.changePasswordForm = $('#change-password-form');
        elements.resetSettingsBtn = $('#reset-settings-btn');
        elements.exportSharedDataBtn = $('#export-shared-data-btn');
        elements.toast = $('#toast');
        elements.modal = $('#modal');
        elements.modalTitle = document.querySelector('.modal-title');
        elements.modalBody = document.querySelector('.modal-body');
        elements.modalClose = document.querySelector('.modal-close');
        elements.modalBackdrop = document.querySelector('.modal-backdrop');
        elements.sidebarMenuItems = $$('.sidebar-menu li');
        elements.pages = $$('.page');
        elements.branchTabBtns = $$('.branch-tab-btn');
    }

    function showScreen(screen) {
        var screens = [elements.setupScreen, elements.passwordScreen, elements.createPasswordScreen, elements.mainScreen];
        screens.forEach(function(s) {
            if (s) s.classList.add('hidden');
        });
        if (screen) screen.classList.remove('hidden');
    }

    function showToast(message, type) {
        if (!elements.toast) return;
        elements.toast.textContent = message;
        elements.toast.className = 'toast ' + (type || '');
        elements.toast.classList.remove('hidden');
        clearTimeout(elements.toast._timeout);
        elements.toast._timeout = setTimeout(function() {
            elements.toast.classList.add('hidden');
        }, CONFIG.TOAST_DURATION);
    }

    function openModal(title, contentHTML) {
        if (!elements.modal || !elements.modalTitle || !elements.modalBody) return;
        elements.modalTitle.textContent = title;
        elements.modalBody.innerHTML = contentHTML;
        elements.modal.classList.remove('hidden');
    }

    function closeModal() {
        if (!elements.modal) return;
        elements.modal.classList.add('hidden');
    }

    function toggleSidebar() {
        if (!elements.sidebar || !elements.overlay) return;
        sidebarOpen = !sidebarOpen;
        if (sidebarOpen) {
            elements.sidebar.classList.add('open');
            elements.overlay.classList.remove('hidden');
        } else {
            elements.sidebar.classList.remove('open');
            elements.overlay.classList.add('hidden');
        }
    }

    function closeSidebar() {
        if (!elements.sidebar || !elements.overlay) return;
        sidebarOpen = false;
        elements.sidebar.classList.remove('open');
        elements.overlay.classList.add('hidden');
    }

    function navigateTo(pageName) {
        currentPage = pageName;
        elements.pages.forEach(function(p) { p.classList.remove('active'); });
        var pageEl = $('#page-' + pageName);
        if (pageEl) pageEl.classList.add('active');
        elements.sidebarMenuItems.forEach(function(item) {
            item.classList.remove('active');
            if (item.dataset.page === pageName) item.classList.add('active');
        });
        closeSidebar();
        if (pageName === 'cars') {
            renderCars();
        }
        if (pageName === 'notifications') {
            renderScheduledNotifications();
        }
        if (pageName === 'whatsapp') {
            renderWhatsAppNumbers();
        }
        if (pageName === 'home') {
            updateHomeStats();
        }
    }

    function updateHomeStats() {
        var total = (carsData.rustaq ? carsData.rustaq.length : 0) + (carsData.mabela ? carsData.mabela.length : 0);
        if (elements.carsCount) elements.carsCount.textContent = total;
        if (elements.lastUpdate) {
            var lastUpdate = getStorageItem(CONFIG.STORAGE_KEYS.LAST_UPDATE, null);
            elements.lastUpdate.textContent = lastUpdate ? formatTimeAgo(lastUpdate) : '--:--';
        }
    }

    function parseCSV(csvText, branch) {
        var lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];
        var cars = [];
        var cat = 'أخرى';
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i].trim();
            if (!l) continue;
            var c = l.split(',').map(function(x) { return x.replace(/^"|"$/g, '').trim(); });
            var ne = c.filter(function(x) { return x !== ''; });
            if (ne.length === 0) continue;
            if (ne.length === 1 && !/^\d+$/.test(c[0]) && !/^(19|20)\d{2}$/.test(c[0]) && c[0].length < 50) {
                cat = c[0].trim();
                continue;
            }
            if (cat && ne.length >= 2) {
                var carName = c[3] || '';
                var carModel = c[2] || '';
                var carColor = c[1] || '';
                var carPrice = c[0] || '';
                var carKey = generateCarKey(carName, cat, carModel, branch);
                cars.push({
                    name: carName,
                    category: cat,
                    model: carModel,
                    color: carColor,
                    price: carPrice,
                    carKey: carKey,
                    branch: branch
                });
            }
        }
        if (cars.length > 0) cars.pop();
        return cars;
    }

    function fetchCarsFromSheets(branch) {
        var sheetId = SHEETS[branch];
        var url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/export?format=csv';
        var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
        return fetch(proxyUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('فشل الاتصال بـ Google Sheets');
                return response.text();
            })
            .then(function(csvText) {
                return parseCSV(csvText, branch);
            });
    }

    function loadAllCarsData() {
        showToast('جاري تحميل بيانات السيارات...', '');
        Promise.all([
            fetchCarsFromSheets('rustaq'),
            fetchCarsFromSheets('mabela')
        ]).then(function(results) {
            carsData.rustaq = results[0];
            carsData.mabela = results[1];
            setStorageItem(CONFIG.STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
            var allCarKeys = [];
            carsData.rustaq.forEach(function(c) { allCarKeys.push(c.carKey); });
            carsData.mabela.forEach(function(c) { allCarKeys.push(c.carKey); });
            loadCarImageUrls(allCarKeys);
            updateHomeStats();
            populateFilters();
            var total = carsData.rustaq.length + carsData.mabela.length;
            showToast('تم تحميل ' + total + ' سيارة بنجاح', 'success');
            if (currentPage === 'cars') renderCars();
        }).catch(function(error) {
            showToast('خطأ: ' + error.message, 'error');
        });
    }

    function populateFilters() {
        if (!elements.carsFilter) return;
        var categories = [];
        var allCars = carsData[currentBranch] || [];
        allCars.forEach(function(car) {
            if (car.category && categories.indexOf(car.category) === -1) {
                categories.push(car.category);
            }
        });
        categories.sort();
        elements.carsFilter.innerHTML = '<option value="all">جميع الفئات</option>';
        categories.forEach(function(cat) {
            var option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            elements.carsFilter.appendChild(option);
        });
    }

    function switchBranch(branch) {
        currentBranch = branch;
        elements.branchTabBtns.forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.dataset.branch === branch) btn.classList.add('active');
        });
        populateFilters();
        renderCars();
    }

    function getFilteredCars() {
        var searchTerm = elements.carsSearch ? elements.carsSearch.value.trim().toLowerCase() : '';
        var filterCat = elements.carsFilter ? elements.carsFilter.value : 'all';
        var allCars = carsData[currentBranch] || [];
        return allCars.filter(function(car) {
            var matchSearch = true;
            if (searchTerm) {
                matchSearch = car.name.toLowerCase().includes(searchTerm) ||
                    car.category.toLowerCase().includes(searchTerm) ||
                    car.model.toLowerCase().includes(searchTerm);
            }
            var matchCat = filterCat === 'all' || car.category === filterCat;
            return matchSearch && matchCat;
        });
    }

    function renderCars() {
        if (!elements.carsGrid) return;
        var filtered = getFilteredCars();
        if (filtered.length === 0) {
            elements.carsGrid.innerHTML = '';
            if (elements.carsEmpty) elements.carsEmpty.classList.remove('hidden');
            return;
        }
        if (elements.carsEmpty) elements.carsEmpty.classList.add('hidden');
        var html = '';
        filtered.forEach(function(car) {
            var imgUrl = carImageUrls[car.carKey] || '';
            var imgSrc = imgUrl ? imgUrl : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'150\' fill=\'%23333\'%3E%3Crect width=\'200\' height=\'150\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23555\' font-size=\'14\'%3E🚗%3C/text%3E%3C/svg%3E';
            html += '<div class="car-card" data-carkey="' + car.carKey + '" data-branch="' + car.branch + '">';
            html += '<img class="car-card-image" src="' + imgSrc + '" alt="' + car.name + '" loading="lazy">';
            html += '<div class="car-card-info">';
            html += '<div class="car-card-name">' + car.name + '</div>';
            html += '<div class="car-card-category">' + car.category + ' | ' + car.model + ' | ' + (car.branch === 'rustaq' ? 'الرستاق' : 'المعبيلة') + '</div>';
            html += '<div class="car-card-price">' + (car.price ? formatPrice(car.price) + ' ر.ع' : '') + '</div>';
            html += '</div></div>';
        });
        elements.carsGrid.innerHTML = html;
        var carCards = $$('.car-card');
        carCards.forEach(function(card) {
            card.addEventListener('click', function() {
                var carKey = card.dataset.carkey;
                var branch = card.dataset.branch;
                openImageChangeModal(carKey, branch);
            });
        });
    }

    function openImageChangeModal(carKey, branch) {
        var allCars = carsData[branch] || [];
        var car = allCars.find(function(c) { return c.carKey === carKey; });
        if (!car) return;
        var currentImg = carImageUrls[carKey] || '';
        var imgPreview = currentImg ? '<img src="' + currentImg + '" style="width:100%;border-radius:8px;margin-bottom:12px;">' :
            '<div style="width:100%;aspect-ratio:4/3;background:#222;border-radius:8px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;font-size:40px;">🚗</div>';
        var html = '<div style="text-align:center;">';
        html += '<p style="margin-bottom:8px;font-weight:600;">' + car.name + '</p>';
        html += '<p style="margin-bottom:12px;color:#aaa;font-size:13px;">' + car.category + ' | ' + car.model + ' | ' + (branch === 'rustaq' ? 'فرع الرستاق' : 'فرع المعبيلة') + '</p>';
        html += imgPreview;
        html += '<input type="file" id="image-file-input" accept="image/jpeg,image/png,image/webp" style="margin-bottom:12px;">';
        html += '<button id="upload-image-btn" class="btn-primary full-width" style="margin-top:0;">رفع الصورة</button>';
        if (currentImg) {
            html += '<button id="delete-image-btn" class="btn-danger full-width">حذف الصورة الحالية</button>';
        }
        html += '</div>';
        openModal('تغيير صورة السيارة', html);
        setTimeout(function() {
            var uploadBtn = $('#upload-image-btn');
            var deleteBtn = $('#delete-image-btn');
            var fileInput = $('#image-file-input');
            if (uploadBtn && fileInput) {
                uploadBtn.addEventListener('click', function() {
                    var file = fileInput.files[0];
                    if (!file) {
                        showToast('الرجاء اختيار صورة', 'error');
                        return;
                    }
                    uploadBtn.disabled = true;
                    uploadBtn.textContent = 'جاري الرفع...';
                    uploadCarImage(carKey, file).then(function(url) {
                        carImageUrls[carKey] = url;
                        var imageMap = getCarImageMap();
                        imageMap[carKey] = url;
                        setStorageItem(CONFIG.STORAGE_KEYS.CAR_IMAGE_MAP, imageMap);
                        showToast('تم رفع الصورة بنجاح', 'success');
                        closeModal();
                        if (currentPage === 'cars') renderCars();
                    }).catch(function(error) {
                        showToast(error.message, 'error');
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'رفع الصورة';
                    });
                });
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    if (!confirm('هل أنت متأكد من حذف الصورة؟')) return;
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = 'جاري الحذف...';
                    deleteCarImage(carKey).then(function() {
                        delete carImageUrls[carKey];
                        var imageMap = getCarImageMap();
                        delete imageMap[carKey];
                        setStorageItem(CONFIG.STORAGE_KEYS.CAR_IMAGE_MAP, imageMap);
                        showToast('تم حذف الصورة', 'success');
                        closeModal();
                        if (currentPage === 'cars') renderCars();
                    }).catch(function() {
                        showToast('حدث خطأ أثناء الحذف', 'error');
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = 'حذف الصورة الحالية';
                    });
                });
            }
        }, 200);
    }

    function loadCarImageUrls(carKeys) {
        var cachedMap = getCarImageMap();
        carImageUrls = {};
        carKeys.forEach(function(key) {
            carImageUrls[key] = cachedMap[key] || null;
        });
        if (typeof loadAllCarImages === 'function') {
            loadAllCarImages(carKeys).then(function(freshUrls) {
                var updated = false;
                Object.keys(freshUrls).forEach(function(key) {
                    if (freshUrls[key]) {
                        carImageUrls[key] = freshUrls[key];
                        if (cachedMap[key] !== freshUrls[key]) {
                            cachedMap[key] = freshUrls[key];
                            updated = true;
                        }
                    }
                });
                if (updated) {
                    setStorageItem(CONFIG.STORAGE_KEYS.CAR_IMAGE_MAP, cachedMap);
                }
                if (currentPage === 'cars') renderCars();
            });
        }
    }

    function exportSharedData() {
        var imageMap = getCarImageMap();
        var whatsappNumbers = getWhatsAppNumbers();
        var data = {
            whatsapp_numbers: {
                rustaq: whatsappNumbers.rustaq || [
                    {"phone": "96872222242", "label": "مالك المعرض"},
                    {"phone": "96898825877", "label": "خدمة عملاء الرستاق"},
                    {"phone": "96895096865", "label": "مدير فرع الرستاق"}
                ],
                mabela: whatsappNumbers.mabela || [
                    {"phone": "96892256223", "label": "مبيعات المعبيلة"},
                    {"phone": "96878080132", "label": "خدمة عملاء المعبيلة"}
                ]
            },
            car_images: imageMap,
            last_updated: new Date().toISOString()
        };
        var blob = new Blob([JSON.stringify(data, null, 4)], {type: 'application/json'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'shared-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('تم تصدير shared-data.json. استبدل الملف في مجلد data/ في كلا المشروعين', 'success');
    }

    function sendManualNotification(title, message, imageUrl) {
        var appId = getOneSignalAppId();
        var restApiKey = getOneSignalRestApiKey();
        if (!appId || !restApiKey) {
            showToast('بيانات OneSignal غير مكتملة', 'error');
            return Promise.reject(new Error('OneSignal config missing'));
        }
        var payload = {
            app_id: appId,
            contents: { en: message },
            headings: { en: title },
            included_segments: ['All']
        };
        if (imageUrl && imageUrl.trim()) {
            payload.big_picture = imageUrl.trim();
            payload.ios_attachments = { id1: imageUrl.trim() };
            payload.chrome_web_image = imageUrl.trim();
        }
        return fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + restApiKey
            },
            body: JSON.stringify(payload)
        }).then(function(response) {
            return response.json();
        });
    }

    function renderScheduledNotifications() {
        if (!elements.scheduledNotifs) return;
        var notifs = getScheduledNotifications();
        if (notifs.length === 0) {
            elements.scheduledNotifs.innerHTML = '<div class="empty-card">لا توجد إشعارات دورية</div>';
            return;
        }
        var html = '';
        notifs.forEach(function(notif, index) {
            html += '<div class="card-item">';
            html += '<div class="card-item-info">';
            html += '<div class="card-item-title">' + (notif.title || '') + '</div>';
            html += '<div class="card-item-subtitle">' + (notif.message || '').substring(0, 50) + ' | كل ' + notif.interval + ' ' + notif.intervalUnit + '</div>';
            html += '</div>';
            html += '<div class="card-item-actions">';
            html += '<button class="btn-icon-sm delete" data-delete-scheduled="' + index + '">🗑️</button>';
            html += '</div>';
            html += '</div>';
        });
        elements.scheduledNotifs.innerHTML = html;
        $$('[data-delete-scheduled]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(btn.dataset.deleteScheduled);
                deleteScheduledNotification(idx);
            });
        });
    }

    function deleteScheduledNotification(index) {
        var notifs = getScheduledNotifications();
        notifs.splice(index, 1);
        setStorageItem(CONFIG.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, notifs);
        renderScheduledNotifications();
        showToast('تم حذف الإشعار الدوري', 'success');
    }

    function openAddScheduledModal() {
        var html = '<label>عنوان الإشعار</label>';
        html += '<input type="text" id="sched-title" placeholder="عنوان الإشعار" required>';
        html += '<label>نص الرسالة</label>';
        html += '<textarea id="sched-message" rows="3" placeholder="نص الرسالة" required></textarea>';
        html += '<label>رابط الصورة (اختياري)</label>';
        html += '<input type="text" id="sched-image" placeholder="https://...">';
        html += '<label>التكرار</label>';
        html += '<div style="display:flex;gap:8px;">';
        html += '<input type="number" id="sched-interval" value="1" min="1" style="flex:1;">';
        html += '<select id="sched-unit" style="flex:1;">';
        html += '<option value="minutes">دقيقة</option>';
        html += '<option value="hours">ساعة</option>';
        html += '<option value="days">يوم</option>';
        html += '<option value="weeks">أسبوع</option>';
        html += '</select>';
        html += '</div>';
        html += '<button id="save-scheduled-btn" class="btn-primary full-width">حفظ الإشعار الدوري</button>';
        openModal('إضافة إشعار دوري', html);
        setTimeout(function() {
            var saveBtn = $('#save-scheduled-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    var title = $('#sched-title').value.trim();
                    var message = $('#sched-message').value.trim();
                    var image = $('#sched-image').value.trim();
                    var interval = parseInt($('#sched-interval').value) || 1;
                    var unit = $('#sched-unit').value;
                    if (!title || !message) {
                        showToast('العنوان والرسالة مطلوبان', 'error');
                        return;
                    }
                    var notifs = getScheduledNotifications();
                    notifs.push({
                        title: title,
                        message: message,
                        image: image,
                        interval: interval,
                        intervalUnit: unit,
                        lastSent: null,
                        createdAt: new Date().toISOString()
                    });
                    setStorageItem(CONFIG.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, notifs);
                    closeModal();
                    renderScheduledNotifications();
                    showToast('تم إضافة الإشعار الدوري', 'success');
                });
            }
        }, 200);
    }

    function checkScheduledNotifications() {
        var notifs = getScheduledNotifications();
        if (notifs.length === 0) return;
        var now = new Date();
        var updated = false;
        notifs.forEach(function(notif) {
            if (!notif.lastSent) {
                notif.lastSent = now.toISOString();
                updated = true;
                sendScheduledNotification(notif);
                return;
            }
            var lastSent = new Date(notif.lastSent);
            var diffMs = now - lastSent;
            var intervalMs = notif.interval;
            switch (notif.intervalUnit) {
                case 'minutes': intervalMs *= 60000; break;
                case 'hours': intervalMs *= 3600000; break;
                case 'days': intervalMs *= 86400000; break;
                case 'weeks': intervalMs *= 604800000; break;
                default: intervalMs *= 3600000;
            }
            if (diffMs >= intervalMs) {
                notif.lastSent = now.toISOString();
                updated = true;
                sendScheduledNotification(notif);
            }
        });
        if (updated) {
            setStorageItem(CONFIG.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, notifs);
        }
    }

    function sendScheduledNotification(notif) {
        sendManualNotification(notif.title, notif.message, notif.image).catch(function(err) {
            console.warn('Scheduled notification failed:', err);
        });
    }

    function renderWhatsAppNumbers() {
        if (!elements.whatsappNumbers) return;
        var allNumbers = getWhatsAppNumbers();
        var rustaqNums = (allNumbers && allNumbers.rustaq) ? allNumbers.rustaq : [];
        var mabelaNums = (allNumbers && allNumbers.mabela) ? allNumbers.mabela : [];
        if (rustaqNums.length === 0 && mabelaNums.length === 0) {
            elements.whatsappNumbers.innerHTML = '<div class="empty-card">لا توجد أرقام مضافة</div>';
            return;
        }
        var html = '';
        if (rustaqNums.length > 0) {
            html += '<div class="section-title" style="margin-top:0;">🏛️ فرع الرستاق</div>';
            rustaqNums.forEach(function(number, index) {
                html += '<div class="card-item">';
                html += '<div class="card-item-info">';
                html += '<div class="card-item-title">📱 ' + number.phone + '</div>';
                html += '<div class="card-item-subtitle">' + (number.label || 'بدون تسمية') + '</div>';
                html += '</div>';
                html += '<div class="card-item-actions">';
                html += '<button class="btn-icon-sm" data-edit-whatsapp="rustaq_' + index + '">✏️</button>';
                html += '<button class="btn-icon-sm delete" data-delete-whatsapp="rustaq_' + index + '">🗑️</button>';
                html += '</div>';
                html += '</div>';
            });
        }
        if (mabelaNums.length > 0) {
            html += '<div class="section-title">🏛️ فرع المعبيلة</div>';
            mabelaNums.forEach(function(number, index) {
                html += '<div class="card-item">';
                html += '<div class="card-item-info">';
                html += '<div class="card-item-title">📱 ' + number.phone + '</div>';
                html += '<div class="card-item-subtitle">' + (number.label || 'بدون تسمية') + '</div>';
                html += '</div>';
                html += '<div class="card-item-actions">';
                html += '<button class="btn-icon-sm" data-edit-whatsapp="mabela_' + index + '">✏️</button>';
                html += '<button class="btn-icon-sm delete" data-delete-whatsapp="mabela_' + index + '">🗑️</button>';
                html += '</div>';
                html += '</div>';
            });
        }
        elements.whatsappNumbers.innerHTML = html;
        $$('[data-delete-whatsapp]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var parts = btn.dataset.deleteWhatsapp.split('_');
                var branch = parts[0];
                var idx = parseInt(parts[1]);
                deleteWhatsAppNumber(branch, idx);
            });
        });
        $$('[data-edit-whatsapp]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var parts = btn.dataset.editWhatsapp.split('_');
                var branch = parts[0];
                var idx = parseInt(parts[1]);
                openEditWhatsAppModal(branch, idx);
            });
        });
    }

    function deleteWhatsAppNumber(branch, index) {
        if (!confirm('هل أنت متأكد من حذف هذا الرقم؟')) return;
        var allNumbers = getWhatsAppNumbers();
        if (allNumbers && allNumbers[branch]) {
            allNumbers[branch].splice(index, 1);
        }
        setStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, allNumbers);
        renderWhatsAppNumbers();
        showToast('تم حذف الرقم', 'success');
    }

    function openAddWhatsAppModal() {
        var html = '<label>الفرع</label>';
        html += '<select id="wa-branch"><option value="rustaq">الرستاق</option><option value="mabela">المعبيلة</option></select>';
        html += '<label>رقم الواتساب</label>';
        html += '<input type="text" id="wa-phone" placeholder="968XXXXXXXX" required>';
        html += '<label>تسمية (اختياري)</label>';
        html += '<input type="text" id="wa-label" placeholder="مثال: مبيعات، خدمة عملاء">';
        html += '<button id="save-whatsapp-btn" class="btn-primary full-width">حفظ الرقم</button>';
        openModal('إضافة رقم واتساب', html);
        setTimeout(function() {
            var saveBtn = $('#save-whatsapp-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    var branch = $('#wa-branch').value;
                    var phone = $('#wa-phone').value.trim();
                    var label = $('#wa-label').value.trim();
                    if (!phone) {
                        showToast('الرجاء إدخال رقم الهاتف', 'error');
                        return;
                    }
                    var allNumbers = getWhatsAppNumbers();
                    if (!allNumbers) allNumbers = {};
                    if (!allNumbers[branch]) allNumbers[branch] = [];
                    allNumbers[branch].push({ phone: phone, label: label });
                    setStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, allNumbers);
                    closeModal();
                    renderWhatsAppNumbers();
                    showToast('تم إضافة الرقم', 'success');
                });
            }
        }, 200);
    }

    function openEditWhatsAppModal(branch, index) {
        var allNumbers = getWhatsAppNumbers();
        var num = allNumbers && allNumbers[branch] ? allNumbers[branch][index] : null;
        if (!num) return;
        var html = '<p style="margin-bottom:12px;color:#aaa;">الفرع: ' + (branch === 'rustaq' ? 'الرستاق' : 'المعبيلة') + '</p>';
        html += '<label>رقم الواتساب</label>';
        html += '<input type="text" id="wa-phone" value="' + num.phone + '" required>';
        html += '<label>تسمية (اختياري)</label>';
        html += '<input type="text" id="wa-label" value="' + (num.label || '') + '">';
        html += '<button id="update-whatsapp-btn" class="btn-primary full-width">تحديث الرقم</button>';
        openModal('تعديل رقم واتساب', html);
        setTimeout(function() {
            var updateBtn = $('#update-whatsapp-btn');
            if (updateBtn) {
                updateBtn.addEventListener('click', function() {
                    var phone = $('#wa-phone').value.trim();
                    var label = $('#wa-label').value.trim();
                    if (!phone) {
                        showToast('الرجاء إدخال رقم الهاتف', 'error');
                        return;
                    }
                    allNumbers[branch][index] = { phone: phone, label: label };
                    setStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, allNumbers);
                    closeModal();
                    renderWhatsAppNumbers();
                    showToast('تم تحديث الرقم', 'success');
                });
            }
        }, 200);
    }

    function resetAllSettings() {
        if (!confirm('⚠️ هل أنت متأكد من إعادة ضبط جميع الإعدادات؟\nسيتم حذف جميع البيانات المحلية وستحتاج إلى إعادة الإعداد من البداية.')) return;
        localStorage.clear();
        showToast('تم إعادة ضبط الإعدادات. جاري إعادة التحميل...', 'success');
        setTimeout(function() {
            location.reload();
        }, 1500);
    }

    function bindEvents() {
        if (elements.menuToggle) {
            elements.menuToggle.addEventListener('click', toggleSidebar);
        }
        if (elements.overlay) {
            elements.overlay.addEventListener('click', closeSidebar);
        }
        elements.sidebarMenuItems.forEach(function(item) {
            item.addEventListener('click', function() {
                navigateTo(item.dataset.page);
            });
        });
        elements.branchTabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                switchBranch(btn.dataset.branch);
            });
        });
        if (elements.setupForm) {
            elements.setupForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var fbConfig = {
                    apiKey: document.getElementById('fb-apiKey').value.trim(),
                    authDomain: document.getElementById('fb-authDomain').value.trim(),
                    projectId: document.getElementById('fb-projectId').value.trim(),
                    storageBucket: document.getElementById('fb-storageBucket').value.trim(),
                    messagingSenderId: document.getElementById('fb-messagingSenderId').value.trim(),
                    appId: document.getElementById('fb-appId').value.trim()
                };
                var osAppId = document.getElementById('os-appId').value.trim();
                var osRestApi = document.getElementById('os-restApiKey').value.trim();
                if (!fbConfig.apiKey || !osAppId || !osRestApi) {
                    showToast('جميع الحقول مطلوبة', 'error');
                    return;
                }
                setStorageItem(CONFIG.STORAGE_KEYS.FIREBASE_CONFIG, fbConfig);
                setStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_APP_ID, osAppId);
                setStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_REST_API, osRestApi);
                setStorageItem(CONFIG.STORAGE_KEYS.SETUP_DONE, true);
                showScreen(elements.createPasswordScreen);
            });
        }
        if (elements.createPasswordForm) {
            elements.createPasswordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var pass1 = document.getElementById('new-admin-password').value;
                var pass2 = document.getElementById('confirm-admin-password').value;
                if (!pass1 || pass1.length < 4) {
                    showToast('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error');
                    return;
                }
                if (pass1 !== pass2) {
                    showToast('كلمتا المرور غير متطابقتين', 'error');
                    return;
                }
                setStorageItem(CONFIG.STORAGE_KEYS.ADMIN_PASSWORD, pass1);
                showToast('تم إنشاء كلمة المرور بنجاح', 'success');
                enterMainScreen();
            });
        }
        if (elements.passwordForm) {
            elements.passwordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var enteredPassword = document.getElementById('password-input').value;
                var storedPassword = getAdminPassword();
                if (enteredPassword === storedPassword) {
                    document.getElementById('password-input').value = '';
                    enterMainScreen();
                } else {
                    showToast('كلمة المرور غير صحيحة', 'error');
                    document.getElementById('password-input').value = '';
                }
            });
        }
        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', function() {
                loadAllCarsData();
            });
        }
        if (elements.carsSearch) {
            elements.carsSearch.addEventListener('input', function() {
                renderCars();
            });
        }
        if (elements.carsFilter) {
            elements.carsFilter.addEventListener('change', function() {
                renderCars();
            });
        }
        if (elements.manualNotifForm) {
            elements.manualNotifForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var title = document.getElementById('notif-title').value.trim();
                var message = document.getElementById('notif-message').value.trim();
                var image = document.getElementById('notif-image').value.trim();
                if (!title || !message) {
                    showToast('العنوان والرسالة مطلوبان', 'error');
                    return;
                }
                var submitBtn = elements.manualNotifForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'جاري الإرسال...';
                sendManualNotification(title, message, image).then(function() {
                    showToast('تم إرسال الإشعار بنجاح', 'success');
                    elements.manualNotifForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>📤</span><span>إرسال الإشعار الآن</span>';
                }).catch(function(err) {
                    showToast('فشل الإرسال: ' + err.message, 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>📤</span><span>إرسال الإشعار الآن</span>';
                });
            });
        }
        if (elements.addScheduledBtn) {
            elements.addScheduledBtn.addEventListener('click', openAddScheduledModal);
        }
        if (elements.addWhatsappBtn) {
            elements.addWhatsappBtn.addEventListener('click', openAddWhatsAppModal);
        }
        if (elements.changePasswordForm) {
            elements.changePasswordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var currentPass = document.getElementById('current-password').value;
                var newPass = document.getElementById('new-password').value;
                var confirmPass = document.getElementById('confirm-password').value;
                var storedPassword = getAdminPassword();
                if (currentPass !== storedPassword) {
                    showToast('كلمة المرور الحالية غير صحيحة', 'error');
                    return;
                }
                if (!newPass || newPass.length < 4) {
                    showToast('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل', 'error');
                    return;
                }
                if (newPass !== confirmPass) {
                    showToast('كلمتا المرور غير متطابقتين', 'error');
                    return;
                }
                setStorageItem(CONFIG.STORAGE_KEYS.ADMIN_PASSWORD, newPass);
                elements.changePasswordForm.reset();
                showToast('تم تحديث كلمة المرور بنجاح', 'success');
            });
        }
        if (elements.resetSettingsBtn) {
            elements.resetSettingsBtn.addEventListener('click', resetAllSettings);
        }
        if (elements.exportSharedDataBtn) {
            elements.exportSharedDataBtn.addEventListener('click', exportSharedData);
        }
        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', closeModal);
        }
        if (elements.modalBackdrop) {
            elements.modalBackdrop.addEventListener('click', closeModal);
        }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeModal();
        });
        window.addEventListener('online', function() {
            isOnline = true;
            showToast('تم استعادة الاتصال بالإنترنت', 'success');
        });
        window.addEventListener('offline', function() {
            isOnline = false;
            showToast('أنت غير متصل بالإنترنت', 'error');
        });
        document.addEventListener('click', function(e) {
            if (sidebarOpen && elements.sidebar && elements.menuToggle && !elements.sidebar.contains(e.target) && e.target !== elements.menuToggle) {
                closeSidebar();
            }
        });
    }

    function enterMainScreen() {
        showScreen(elements.mainScreen);
        if (typeof initFirebase === 'function') {
            initFirebase();
        }
        loadAllCarsData();
        updateHomeStats();
        setInterval(function() {
            checkScheduledNotifications();
        }, 30000);
    }

    function init() {
        cacheElements();
        bindEvents();
        if (!isSetupDone()) {
            showScreen(elements.setupScreen);
            return;
        }
        if (!getAdminPassword()) {
            showScreen(elements.createPasswordScreen);
            return;
        }
        showScreen(elements.passwordScreen);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
