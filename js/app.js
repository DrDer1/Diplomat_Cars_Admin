(function() {
    'use strict';

    let carsData = [];
    let carImageUrls = {};
    let currentPage = 'home';
    let sidebarOpen = false;
    let isOnline = navigator.onLine;

    const $ = function(selector) {
        return document.querySelector(selector);
    };
    const $$ = function(selector) {
        return document.querySelectorAll(selector);
    };

    const elements = {};
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
        elements.toast = $('#toast');
        elements.modal = $('#modal');
        elements.modalTitle = $('.modal-title');
        elements.modalBody = $('.modal-body');
        elements.modalClose = $('.modal-close');
        elements.modalBackdrop = $('.modal-backdrop');
        elements.sidebarMenuItems = $$('.sidebar-menu li');
        elements.pages = $$('.page');
    }

    function showScreen(screen) {
        [elements.setupScreen, elements.passwordScreen, elements.createPasswordScreen, elements.mainScreen].forEach(function(s) {
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
        if (!elements.modal) return;
        elements.modalTitle.textContent = title;
        elements.modalBody.innerHTML = contentHTML;
        elements.modal.classList.remove('hidden');
    }

    function closeModal() {
        if (!elements.modal) return;
        elements.modal.classList.add('hidden');
    }

    function toggleSidebar() {
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
        if (pageName === 'cars' && carsData.length === 0) {
            loadCarsData();
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
        if (elements.carsCount) elements.carsCount.textContent = carsData.length;
        if (elements.lastUpdate) {
            var lastUpdate = getStorageItem(CONFIG.STORAGE_KEYS.LAST_UPDATE, null);
            elements.lastUpdate.textContent = lastUpdate ? formatTimeAgo(lastUpdate) : '--:--';
        }
    }

    function parseCSV(csvText) {
        var lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];
        var headers = parseCSVLine(lines[0]);
        var nameIdx = headers.findIndex(function(h) { return h.toLowerCase().includes('name') || h === 'Car Name'; });
        var catIdx = headers.findIndex(function(h) { return h.toLowerCase().includes('categor') || h.toLowerCase().includes('categ') || h === 'Category'; });
        var modelIdx = headers.findIndex(function(h) { return h.toLowerCase().includes('model') || h === 'Model'; });
        var colorIdx = headers.findIndex(function(h) { return h.toLowerCase().includes('color') || h === 'Color'; });
        var priceIdx = headers.findIndex(function(h) { return h.toLowerCase().includes('price') || h === 'Price'; });
        var linkIdx = headers.findIndex(function(h) { return h.toLowerCase().includes('link') || h === 'Link'; });
        var cars = [];
        for (var i = 1; i < lines.length; i++) {
            var values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;
            var carName = nameIdx >= 0 ? (values[nameIdx] || '').trim() : '';
            if (!carName) continue;
            var category = catIdx >= 0 ? (values[catIdx] || '').trim() : '';
            var model = modelIdx >= 0 ? (values[modelIdx] || '').trim() : '';
            var color = colorIdx >= 0 ? (values[colorIdx] || '').trim() : '';
            var price = priceIdx >= 0 ? (values[priceIdx] || '').trim() : '';
            var link = linkIdx >= 0 ? (values[linkIdx] || '').trim() : '';
            var carKey = generateCarKey(carName, category, model);
            cars.push({
                name: carName,
                category: category,
                model: model,
                color: color,
                price: price,
                link: link,
                carKey: carKey
            });
        }
        return cars;
    }

    function parseCSVLine(line) {
        var result = [];
        var current = '';
        var inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    result.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        result.push(current);
        return result;
    }

    function fetchCarsFromSheets() {
        var csvUrl = getGoogleSheetsCsvUrl();
        var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(csvUrl);
        return fetch(proxyUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('فشل الاتصال بـ Google Sheets');
                return response.text();
            })
            .then(function(csvText) {
                return parseCSV(csvText);
            });
    }

    function loadCarsData() {
        showToast('جاري تحميل بيانات السيارات...', '');
        fetchCarsFromSheets().then(function(cars) {
            carsData = cars;
            setStorageItem(CONFIG.STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
            updateHomeStats();
            populateFilters();
            renderCars();
            checkForNewCars(cars);
            showToast('تم تحميل ' + cars.length + ' سيارة بنجاح', 'success');
        }).catch(function(error) {
            showToast('خطأ: ' + error.message, 'error');
        });
    }

    function populateFilters() {
        if (!elements.carsFilter) return;
        var categories = [];
        carsData.forEach(function(car) {
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

    function getFilteredCars() {
        var searchTerm = elements.carsSearch ? elements.carsSearch.value.trim().toLowerCase() : '';
        var filterCat = elements.carsFilter ? elements.carsFilter.value : 'all';
        return carsData.filter(function(car) {
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
            elements.carsEmpty.classList.remove('hidden');
            return;
        }
        elements.carsEmpty.classList.add('hidden');
        var html = '';
        filtered.forEach(function(car) {
            var imgUrl = carImageUrls[car.carKey] || '';
            var imgSrc = imgUrl ? imgUrl : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'150\' fill=\'%23333\'%3E%3Crect width=\'200\' height=\'150\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23555\' font-size=\'14\'%3E🚗%3C/text%3E%3C/svg%3E';
            html += '<div class="car-card" data-carkey="' + car.carKey + '">';
            html += '<img class="car-card-image" src="' + imgSrc + '" alt="' + car.name + '" loading="lazy">';
            html += '<div class="car-card-info">';
            html += '<div class="car-card-name">' + car.name + '</div>';
            html += '<div class="car-card-category">' + car.category + ' | ' + car.model + '</div>';
            html += '<div class="car-card-price">' + (car.price ? formatPrice(car.price) + ' ريال' : '') + '</div>';
            html += '</div></div>';
        });
        elements.carsGrid.innerHTML = html;
        var carCards = $$('.car-card');
        carCards.forEach(function(card) {
            card.addEventListener('click', function() {
                var carKey = card.dataset.carkey;
                openImageChangeModal(carKey);
            });
        });
    }

    function openImageChangeModal(carKey) {
        var car = carsData.find(function(c) { return c.carKey === carKey; });
        if (!car) return;
        var currentImg = carImageUrls[carKey] || '';
        var imgPreview = currentImg ? '<img src="' + currentImg + '" style="width:100%;border-radius:8px;margin-bottom:12px;">' :
            '<div style="width:100%;aspect-ratio:4/3;background:#222;border-radius:8px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;font-size:40px;">🚗</div>';
        var html = '<div style="text-align:center;">';
        html += '<p style="margin-bottom:8px;font-weight:600;">' + car.name + '</p>';
        html += '<p style="margin-bottom:12px;color:#aaa;font-size:13px;">' + car.category + ' | ' + car.model + '</p>';
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
                        renderCars();
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
                        renderCars();
                    }).catch(function() {
                        showToast('حدث خطأ أثناء الحذف', 'error');
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = 'حذف الصورة الحالية';
                    });
                });
            }
        }, 200);
    }

    function loadCarImageUrls() {
        var carKeys = carsData.map(function(c) { return c.carKey; });
        var cachedMap = getCarImageMap();
        carImageUrls = {};
        carKeys.forEach(function(key) {
            carImageUrls[key] = cachedMap[key] || null;
        });
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
            renderCars();
        });
    }

    function checkForNewCars(newCars) {
        var lastKnown = getLastKnownCars();
        var lastKnownKeys = lastKnown.map(function(c) { return c.carKey; });
        var newCarList = newCars.filter(function(c) {
            return lastKnownKeys.indexOf(c.carKey) === -1;
        });
        setStorageItem(CONFIG.STORAGE_KEYS.LAST_KNOWN_CARS, newCars.map(function(c) {
            return { carKey: c.carKey, name: c.name, category: c.category, model: c.model, price: c.price };
        }));
        if (newCarList.length > 0 && lastKnown.length > 0) {
            newCarList.forEach(function(car) {
                sendNewCarNotification(car);
            });
        }
    }

    function sendNewCarNotification(car) {
        var appId = getOneSignalAppId();
        var restApiKey = getOneSignalRestApiKey();
        if (!appId || !restApiKey) return;
        var message = '🚗 ' + car.name + '\n';
        if (car.category) message += 'الفئة: ' + car.category + '\n';
        if (car.model) message += 'الموديل: ' + car.model + '\n';
        if (car.price) message += 'السعر: ' + formatPrice(car.price) + ' ريال';
        var payload = {
            app_id: appId,
            contents: { en: message },
            headings: { en: 'سيارة جديدة! 🆕' },
            included_segments: ['All']
        };
        fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + restApiKey
            },
            body: JSON.stringify(payload)
        }).catch(function(err) {
            console.warn('Failed to send new car notification:', err);
        });
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
            html += '<div class="card-item-title">' + notif.title + '</div>';
            html += '<div class="card-item-subtitle">' + notif.message.substring(0, 50) + ' | كل ' + notif.interval + ' ' + notif.intervalUnit + '</div>';
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
        var numbers = getWhatsAppNumbers();
        if (numbers.length === 0) {
            elements.whatsappNumbers.innerHTML = '<div class="empty-card">لا توجد أرقام مضافة</div>';
            return;
        }
        var html = '';
        numbers.forEach(function(number, index) {
            html += '<div class="card-item">';
            html += '<div class="card-item-info">';
            html += '<div class="card-item-title">📱 ' + number.phone + '</div>';
            html += '<div class="card-item-subtitle">' + (number.label || 'بدون تسمية') + '</div>';
            html += '</div>';
            html += '<div class="card-item-actions">';
            html += '<button class="btn-icon-sm" data-edit-whatsapp="' + index + '">✏️</button>';
            html += '<button class="btn-icon-sm delete" data-delete-whatsapp="' + index + '">🗑️</button>';
            html += '</div>';
            html += '</div>';
        });
        elements.whatsappNumbers.innerHTML = html;
        $$('[data-delete-whatsapp]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(btn.dataset.deleteWhatsapp);
                deleteWhatsAppNumber(idx);
            });
        });
        $$('[data-edit-whatsapp]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(btn.dataset.editWhatsapp);
                openEditWhatsAppModal(idx);
            });
        });
    }

    function deleteWhatsAppNumber(index) {
        if (!confirm('هل أنت متأكد من حذف هذا الرقم؟')) return;
        var numbers = getWhatsAppNumbers();
        numbers.splice(index, 1);
        setStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, numbers);
        renderWhatsAppNumbers();
        showToast('تم حذف الرقم', 'success');
    }

    function openAddWhatsAppModal() {
        var html = '<label>رقم الواتساب</label>';
        html += '<input type="text" id="wa-phone" placeholder="+974XXXXXXXX" required>';
        html += '<label>تسمية (اختياري)</label>';
        html += '<input type="text" id="wa-label" placeholder="مثال: مبيعات، خدمة عملاء">';
        html += '<button id="save-whatsapp-btn" class="btn-primary full-width">حفظ الرقم</button>';
        openModal('إضافة رقم واتساب', html);
        setTimeout(function() {
            var saveBtn = $('#save-whatsapp-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    var phone = $('#wa-phone').value.trim();
                    var label = $('#wa-label').value.trim();
                    if (!phone) {
                        showToast('الرجاء إدخال رقم الهاتف', 'error');
                        return;
                    }
                    var numbers = getWhatsAppNumbers();
                    numbers.push({ phone: phone, label: label });
                    setStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, numbers);
                    closeModal();
                    renderWhatsAppNumbers();
                    showToast('تم إضافة الرقم', 'success');
                });
            }
        }, 200);
    }

    function openEditWhatsAppModal(index) {
        var numbers = getWhatsAppNumbers();
        var num = numbers[index];
        if (!num) return;
        var html = '<label>رقم الواتساب</label>';
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
                    numbers[index] = { phone: phone, label: label };
                    setStorageItem(CONFIG.STORAGE_KEYS.WHATSAPP_NUMBERS, numbers);
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
        elements.menuToggle.addEventListener('click', toggleSidebar);
        elements.overlay.addEventListener('click', closeSidebar);
        elements.sidebarMenuItems.forEach(function(item) {
            item.addEventListener('click', function() {
                navigateTo(item.dataset.page);
            });
        });
        elements.setupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var fbConfig = {
                apiKey: $('#fb-apiKey').value.trim(),
                authDomain: $('#fb-authDomain').value.trim(),
                projectId: $('#fb-projectId').value.trim(),
                storageBucket: $('#fb-storageBucket').value.trim(),
                messagingSenderId: $('#fb-messagingSenderId').value.trim(),
                appId: $('#fb-appId').value.trim()
            };
            var osAppId = $('#os-appId').value.trim();
            var osRestApi = $('#os-restApiKey').value.trim();
            var csvUrl = $('#gs-csvUrl').value.trim();
            if (!fbConfig.apiKey || !osAppId || !osRestApi || !csvUrl) {
                showToast('جميع الحقول مطلوبة', 'error');
                return;
            }
            setStorageItem(CONFIG.STORAGE_KEYS.FIREBASE_CONFIG, fbConfig);
            setStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_APP_ID, osAppId);
            setStorageItem(CONFIG.STORAGE_KEYS.ONESIGNAL_REST_API, osRestApi);
            setStorageItem(CONFIG.STORAGE_KEYS.GOOGLE_SHEETS_CSV, csvUrl);
            setStorageItem(CONFIG.STORAGE_KEYS.SETUP_DONE, true);
            showScreen(elements.createPasswordScreen);
        });
        elements.createPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var pass1 = $('#new-admin-password').value;
            var pass2 = $('#confirm-admin-password').value;
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
        elements.passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var enteredPassword = $('#password-input').value;
            var storedPassword = getAdminPassword();
            if (enteredPassword === storedPassword) {
                $('#password-input').value = '';
                enterMainScreen();
            } else {
                showToast('كلمة المرور غير صحيحة', 'error');
                $('#password-input').value = '';
            }
        });
        elements.refreshBtn.addEventListener('click', function() {
            loadCarsData();
        });
        elements.carsSearch.addEventListener('input', function() {
            renderCars();
        });
        elements.carsFilter.addEventListener('change', function() {
            renderCars();
        });
        elements.manualNotifForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var title = $('#notif-title').value.trim();
            var message = $('#notif-message').value.trim();
            var image = $('#notif-image').value.trim();
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
        elements.addScheduledBtn.addEventListener('click', openAddScheduledModal);
        elements.addWhatsappBtn.addEventListener('click', openAddWhatsAppModal);
        elements.changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var currentPass = $('#current-password').value;
            var newPass = $('#new-password').value;
            var confirmPass = $('#confirm-password').value;
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
        elements.resetSettingsBtn.addEventListener('click', resetAllSettings);
        elements.modalClose.addEventListener('click', closeModal);
        elements.modalBackdrop.addEventListener('click', closeModal);
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
            if (sidebarOpen && !elements.sidebar.contains(e.target) && e.target !== elements.menuToggle) {
                closeSidebar();
            }
        });
    }

    function enterMainScreen() {
        showScreen(elements.mainScreen);
        initFirebase();
        loadCarsData().then;
        updateHomeStats();
        setInterval(function() {
            checkScheduledNotifications();
            var checkInterval = getNotifCheckInterval();
            if (checkInterval > 0) {
                var lastCheck = getStorageItem('dc_admin_last_car_check', null);
                var now = new Date().getTime();
                if (!lastCheck || (now - parseInt(lastCheck)) >= checkInterval * 60000) {
                    setStorageItem('dc_admin_last_car_check', now.toString());
                    if (carsData.length > 0) {
                        fetchCarsFromSheets().then(function(cars) {
                            checkForNewCars(cars);
                        }).catch(function() {});
                    }
                }
            }
        }, 60000);
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
