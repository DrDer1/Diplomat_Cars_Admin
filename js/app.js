(function() {
    'use strict';

    var carsData = { rustaq: [], mabela: [] };
    var currentBranch = 'rustaq';
    var carImageUrls = {};
    var currentPage = 'home';
    var sidebarOpen = false;

    var SHEETS = {
        rustaq: '1KIgAoTO0sbKtvVNt775ZCyuSAW8Bf8HbFyUXCY9pIV0',
        mabela: '1C_zsV_9l_SN0O5YN118OT49ng9H67sFIBWvk1Qr_3Gg'
    };

    function $(selector) { return document.querySelector(selector); }
    function $$(selector) { return document.querySelectorAll(selector); }

    var elements = {};

    function cacheElements() {
        elements.passwordScreen = $('#password-screen');
        elements.mainScreen = $('#main-screen');
        elements.passwordForm = $('#password-form');
        elements.sidebar = $('#sidebar');
        elements.overlay = $('#overlay');
        elements.menuToggle = $('#menu-toggle');
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
        elements.firebaseSettingsForm = $('#firebase-settings-form');
        elements.onesignalSettingsForm = $('#onesignal-settings-form');
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
        if (elements.passwordScreen) elements.passwordScreen.classList.add('hidden');
        if (elements.mainScreen) elements.mainScreen.classList.add('hidden');
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
        if (pageName === 'cars') renderCars();
        if (pageName === 'notifications') renderScheduledNotifications();
        if (pageName === 'whatsapp') renderWhatsAppNumbers();
        if (pageName === 'settings') loadSettingsData();
        if (pageName === 'home') updateHomeStats();
    }

    function updateHomeStats() {
        var total = (carsData.rustaq.length + carsData.mabela.length);
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
                var carPrice = c[0] || '';
                var carKey = generateCarKey(carName, cat, carModel, branch);
                cars.push({
                    name: carName,
                    category: cat,
                    model: carModel,
                    color: c[1] || '',
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
            showToast('تم تحميل ' + total + ' سيارة', 'success');
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
        $$('.car-card').forEach(function(card) {
            card.addEventListener('click', function() {
                openImageChangeModal(card.dataset.carkey, card.dataset.branch);
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
                    if (!file) { showToast('الرجاء اختيار صورة', 'error'); return; }
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
        carKeys.forEach(function(key) { carImageUrls[key] = cachedMap[key] || null; });
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
                if (updated) setStorageItem(CONFIG.STORAGE_KEYS.CAR_IMAGE_MAP, cachedMap);
                if (currentPage === 'cars') renderCars();
            });
        }
    }

    function exportSharedData() {
        var imageMap = getCarImageMap();
        var whatsappNumbers = getWhatsAppNumbers();
        var data = {
            whatsapp_numbers: {
                rustaq: whatsappNumbers.rustaq || [],
                mabela: whatsappNumbers.mabela || []
            },
            car_images: imageMap,
            last_updated: new Date().toISOString()
        };
        var blob = new Blob([JSON.stringify(data, null, 4)], {type: 'application/json'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'shared-data.json';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('تم تصدير shared-data.json', 'success');
    }

    function sendManualNotification(title, message, imageUrl) {
        var appId = getOneSignalAppId();
        var restApiKey = getOneSignalRestApiKey();
        if (!appId || !restApiKey || restApiKey === 'YOUR_REST_API_KEY') {
            showToast('الرجاء إدخال REST API Key في صفحة الإعدادات', 'error');
            return Promise.reject(new Error('Missing REST API Key'));
        }
        var payload = {
            app_id: appId,
            contents: { en: message },
            headings: { en: title },
            included_segments: ['Total Subscriptions']
        };
        if (imageUrl && imageUrl.trim()) {
            payload.big_picture = imageUrl.trim();
            payload.chrome_web_image = imageUrl.trim();
        }
        return fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': 'Basic ' + restApiKey
            },
            body: JSON.stringify(payload)
        }).then(function(response) {
            if (!response.ok) {
                return response.json().then(function(err) {
                    throw new Error(err.errors ? err.errors.join(', ') : 'خطأ في الإرسال');
                });
            }
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
            html += '<div class="card-item-info"><div class="card-item-title">' + (notif.title || '') + '</div>';
            html += '<div class="card-item-subtitle">' + (notif.message || '').substring(0, 50) + ' | كل ' + notif.interval + ' ' + notif.intervalUnit + '</div></div>';
            html += '<div class="card-item-actions"><button class="btn-icon-sm delete" data-delete-scheduled="' + index + '">🗑️</button></div>';
            html += '</div>';
        });
        elements.scheduledNotifs.innerHTML = html;
        $$('[data-delete-scheduled]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var notifs = getScheduledNotifications();
                notifs.splice(parseInt(btn.dataset.deleteScheduled), 1);
                setStorageItem(CONFIG.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, notifs);
                renderScheduledNotifications();
                showToast('تم حذف الإشعار الدوري', 'success');
            });
        });
    }

    function openAddScheduledModal() {
        var html = '<label>عنوان الإشعار</label><input type="text" id="sched-title" required>';
        html += '<label>نص الرسالة</label><textarea id="sched-message" rows="3" required></textarea>';
        html += '<label>رابط الصورة (اختياري)</label><input type="text" id="sched-image">';
        html += '<label>التكرار</label><div style="display:flex;gap:8px;"><input type="number" id="sched-interval" value="1" min="1" style="flex:1;"><select id="sched-unit" style="flex:1;"><option value="hours">ساعة</option><option value="days">يوم</option><option value="weeks">أسبوع</option></select></div>';
        html += '<button id="save-scheduled-btn" class="btn-primary full-width">حفظ</button>';
        openModal('إضافة إشعار دوري', html);
        setTimeout(function() {
            var saveBtn = $('#save-scheduled-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    var title = $('#sched-title').value.trim();
                    var message = $('#sched-message').value.trim();
                    if (!title || !message) { showToast('العنوان والرسالة مطلوبان', 'error'); return; }
                    var notifs = getScheduledNotifications();
                    notifs.push({
                        title: title, message: message,
                        image: $('#sched-image').value.trim(),
                        interval: parseInt($('#sched-interval').value) || 1,
                        intervalUnit: $('#sched-unit').value,
                        lastSent: null, createdAt: new Date().toISOString()
                    });
                    setStorageItem(CONFIG.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, notifs);
                    closeModal(); renderScheduledNotifications();
                    showToast('تم إضافة الإشعار الدوري', 'success');
                });
            }
        }, 200);
    }

    function checkScheduledNotifications() {
        var notifs = getScheduledNotifications();
        if (notifs.length === 0) return;
        var now = new Date(), updated = false;
        notifs.forEach(function(notif) {
            if (!notif.lastSent) { notif.lastSent = now.toISOString(); updated = true; sendScheduledNotification(notif); return; }
            var lastSent = new Date(notif.lastSent);
            var diffMs = now - lastSent;
            var intervalMs = notif.interval;
            switch (notif.intervalUnit) {
                case 'hours': intervalMs *= 3600000; break;
                case 'days': intervalMs *= 86400000; break;
                case 'weeks': intervalMs *= 604800000; break;
                default: intervalMs *= 3600000;
            }
            if (diffMs >= intervalMs) { notif.lastSent = now.toISOString(); updated = true; sendScheduledNotification(notif); }
        });
        if (updated) setStorageItem(CONFIG.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, notifs);
    }

    function sendScheduledNotification(notif) {
        sendManualNotification(notif.title, notif.message, notif.image).catch(function() {});
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
            rustaqNums.forEach(function(n, i) {
                html += '<div class="card-item"><div class="card-item-info"><div class="card-item-title">📱 ' + n.phone + '</div><div class="card-item-subtitle">' + (n.label || '') + '</div></div>';
                html += '<div class="card-item-actions"><button class="btn-icon-sm" data-edit-w="rustaq_' + i + '">✏️</button><button class="btn-icon-sm delete" data-del-w="rustaq_' + i + '">🗑️</button></div></div>';
            });
        }
        if (mabelaNums.length > 0) {
            html += '<div class="section-title">🏛️ فرع المعبيلة</div>';
            mabelaNums.forEach(function(n, i) {
                html += '<div class="card-item"><div class="card-item-info"><div class="card-item-title">📱 ' + n.phone + '</div><div class="card-item-subtitle">' + (n.label || '') + '</div></div>';
                html += '<div class="card-item-actions"><button class="btn-icon-sm" data-edit-w="mabela_' + i + '">✏️</button><button class="btn-icon-sm delete" data-del-w="mabela_' + i + '">🗑️</button></div></div>';
            });
        }
        elements.whatsappNumbers.innerHTML = html;
        $$('[data-del-w]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var parts = btn.dataset.delW.split('_');
                if (!confirm('حذف هذا الرقم؟')) return;
                var nums = getWhatsAppNumbers();
                nums[parts[0]].splice(parseInt(parts[1]), 1);
                setStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, nums);
                renderWhatsAppNumbers(); showToast('تم الحذف', 'success');
            });
        });
        $$('[data-edit-w]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var parts = btn.dataset.editW.split('_');
                var nums = getWhatsAppNumbers();
                var num = nums[parts[0]][parseInt(parts[1])];
                if (!num) return;
                var h = '<p style="color:#aaa;margin-bottom:12px;">' + (parts[0] === 'rustaq' ? 'الرستاق' : 'المعبيلة') + '</p>';
                h += '<label>الرقم</label><input type="text" id="wa-phone" value="' + num.phone + '">';
                h += '<label>التسمية</label><input type="text" id="wa-label" value="' + (num.label || '') + '">';
                h += '<button id="update-wa-btn" class="btn-primary full-width">تحديث</button>';
                openModal('تعديل رقم', h);
                setTimeout(function() {
                    var b = $('#update-wa-btn');
                    if (b) b.addEventListener('click', function() {
                        nums[parts[0]][parseInt(parts[1])] = { phone: $('#wa-phone').value.trim(), label: $('#wa-label').value.trim() };
                        setStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, nums);
                        closeModal(); renderWhatsAppNumbers(); showToast('تم التحديث', 'success');
                    });
                }, 200);
            });
        });
    }

    function openAddWhatsAppModal() {
        var html = '<label>الفرع</label><select id="wa-branch"><option value="rustaq">الرستاق</option><option value="mabela">المعبيلة</option></select>';
        html += '<label>الرقم</label><input type="text" id="wa-phone" placeholder="968XXXXXXXX">';
        html += '<label>التسمية</label><input type="text" id="wa-label" placeholder="مبيعات">';
        html += '<button id="save-wa-btn" class="btn-primary full-width">حفظ</button>';
        openModal('إضافة رقم', html);
        setTimeout(function() {
            var b = $('#save-wa-btn');
            if (b) b.addEventListener('click', function() {
                var phone = $('#wa-phone').value.trim();
                if (!phone) { showToast('أدخل الرقم', 'error'); return; }
                var nums = getWhatsAppNumbers();
                if (!nums[$('#wa-branch').value]) nums[$('#wa-branch').value] = [];
                nums[$('#wa-branch').value].push({ phone: phone, label: $('#wa-label').value.trim() });
                setStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, nums);
                closeModal(); renderWhatsAppNumbers(); showToast('تمت الإضافة', 'success');
            });
        }, 200);
    }

    function loadSettingsData() {
        var fb = getFirebaseConfig();
        if (fb) {
            var fbApiKey = $('#settings-fb-apiKey'); if (fbApiKey) fbApiKey.value = fb.apiKey || '';
            var fbAuth = $('#settings-fb-authDomain'); if (fbAuth) fbAuth.value = fb.authDomain || '';
            var fbProj = $('#settings-fb-projectId'); if (fbProj) fbProj.value = fb.projectId || '';
            var fbStor = $('#settings-fb-storageBucket'); if (fbStor) fbStor.value = fb.storageBucket || '';
            var fbMsg = $('#settings-fb-messagingSenderId'); if (fbMsg) fbMsg.value = fb.messagingSenderId || '';
            var fbApp = $('#settings-fb-appId'); if (fbApp) fbApp.value = fb.appId || '';
        }
        var osApp = $('#settings-os-appId'); if (osApp) osApp.value = getOneSignalAppId();
        var osKey = $('#settings-os-restApiKey'); if (osKey) osKey.value = getOneSignalRestApiKey();
    }

    function resetAllSettings() {
        if (!confirm('⚠️ إعادة ضبط جميع الإعدادات؟')) return;
        localStorage.clear();
        showToast('تم إعادة الضبط', 'success');
        setTimeout(function() { location.reload(); }, 1500);
    }

    function bindEvents() {
        if (elements.menuToggle) elements.menuToggle.addEventListener('click', toggleSidebar);
        if (elements.overlay) elements.overlay.addEventListener('click', closeSidebar);
        elements.sidebarMenuItems.forEach(function(item) {
            item.addEventListener('click', function() { navigateTo(item.dataset.page); });
        });
        elements.branchTabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() { switchBranch(btn.dataset.branch); });
        });

        if (elements.passwordForm) {
            elements.passwordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                if (document.getElementById('password-input').value === getAdminPassword()) {
                    document.getElementById('password-input').value = '';
                    enterMainScreen();
                } else {
                    showToast('كلمة المرور غير صحيحة', 'error');
                }
            });
        }

        if (elements.refreshBtn) elements.refreshBtn.addEventListener('click', loadAllCarsData);
        if (elements.carsSearch) elements.carsSearch.addEventListener('input', renderCars);
        if (elements.carsFilter) elements.carsFilter.addEventListener('change', renderCars);

        if (elements.manualNotifForm) {
            elements.manualNotifForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var title = $('#notif-title').value.trim();
                var message = $('#notif-message').value.trim();
                if (!title || !message) { showToast('العنوان والرسالة مطلوبان', 'error'); return; }
                var btn = elements.manualNotifForm.querySelector('button');
                btn.disabled = true; btn.textContent = 'جاري الإرسال...';
                sendManualNotification(title, message, $('#notif-image').value.trim()).then(function() {
                    showToast('تم الإرسال', 'success');
                    elements.manualNotifForm.reset();
                    btn.disabled = false; btn.innerHTML = '<span>📤</span><span>إرسال الإشعار الآن</span>';
                }).catch(function(err) {
                    showToast('فشل: ' + err.message, 'error');
                    btn.disabled = false; btn.innerHTML = '<span>📤</span><span>إرسال الإشعار الآن</span>';
                });
            });
        }

        if (elements.addScheduledBtn) elements.addScheduledBtn.addEventListener('click', openAddScheduledModal);
        if (elements.addWhatsappBtn) elements.addWhatsappBtn.addEventListener('click', openAddWhatsAppModal);

        if (elements.changePasswordForm) {
            elements.changePasswordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var curr = $('#current-password').value;
                var newP = $('#new-password').value;
                var conf = $('#confirm-password').value;
                if (curr !== getAdminPassword()) { showToast('كلمة المرور الحالية غير صحيحة', 'error'); return; }
                if (!newP || newP.length < 4) { showToast('كلمة المرور الجديدة قصيرة', 'error'); return; }
                if (newP !== conf) { showToast('كلمتا المرور غير متطابقتين', 'error'); return; }
                setStorageItem(CONFIG.STORAGE_KEYS.ADMIN_PASSWORD, newP);
                elements.changePasswordForm.reset();
                showToast('تم تحديث كلمة المرور', 'success');
            });
        }

        if (elements.firebaseSettingsForm) {
            elements.firebaseSettingsForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var config = {
                    apiKey: $('#settings-fb-apiKey').value.trim(),
                    authDomain: $('#settings-fb-authDomain').value.trim(),
                    projectId: $('#settings-fb-projectId').value.trim(),
                    storageBucket: $('#settings-fb-storageBucket').value.trim(),
                    messagingSenderId: $('#settings-fb-messagingSenderId').value.trim(),
                    appId: $('#settings-fb-appId').value.trim()
                };
                setStorageItem(CONFIG.STORAGE_KEYS.FIREBASE_CONFIG, config);
                if (typeof initFirebase === 'function') initFirebase();
                showToast('تم حفظ إعدادات Firebase', 'success');
            });
        }

        if (elements.onesignalSettingsForm) {
            elements.onesignalSettingsForm.addEventListener('submit', function(e) {
                e.preventDefault();
                setStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_APP_ID, $('#settings-os-appId').value.trim());
                setStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_REST_API, $('#settings-os-restApiKey').value.trim());
                showToast('تم حفظ إعدادات OneSignal', 'success');
            });
        }

        if (elements.resetSettingsBtn) elements.resetSettingsBtn.addEventListener('click', resetAllSettings);
        if (elements.exportSharedDataBtn) elements.exportSharedDataBtn.addEventListener('click', exportSharedData);
        if (elements.modalClose) elements.modalClose.addEventListener('click', closeModal);
        if (elements.modalBackdrop) elements.modalBackdrop.addEventListener('click', closeModal);

        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });
        document.addEventListener('click', function(e) {
            if (sidebarOpen && elements.sidebar && elements.menuToggle && !elements.sidebar.contains(e.target) && e.target !== elements.menuToggle) {
                closeSidebar();
            }
        });
    }

    function enterMainScreen() {
        showScreen(elements.mainScreen);
        if (typeof initFirebase === 'function') initFirebase();
        loadAllCarsData();
        updateHomeStats();
        setInterval(checkScheduledNotifications, 60000);
    }

    function init() {
        cacheElements();
        bindEvents();
        showScreen(elements.passwordScreen);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
