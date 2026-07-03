document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 0. 旧ハッシュURLからのリダイレクト (SEO & UX対策)
    // ==========================================================================
    if (window.location.hash) {
        const hash = window.location.hash;
        if (hash === '#reservation') {
            window.location.replace('/reservation/');
        } else if (hash === '#profile') {
            window.location.replace('/about/');
        } else if (hash === '#gallery') {
            window.location.replace('/gallery/');
        } else if (hash === '#blog') {
            window.location.replace('/blog/');
        } else if (hash === '#activities') {
            window.location.replace('/events/');
        }
    }

    // ==========================================================================
    // 1. Navigation Active Class & Mobile Drawer (パスベース判定)
    // ==========================================================================
    const path = window.location.pathname;
    let activeNavId = 'nav-home';
    let activeDrawerId = 'drawer-home';
    if (path.includes('/about/')) {
        activeNavId = 'nav-about';
        activeDrawerId = 'drawer-about';
    } else if (path.includes('/gallery/')) {
        activeNavId = 'nav-gallery';
        activeDrawerId = 'drawer-gallery';
    } else if (path.includes('/blog/')) {
        activeNavId = 'nav-blog';
        activeDrawerId = 'drawer-blog';
    } else if (path.includes('/events/')) {
        activeNavId = 'nav-events';
        activeDrawerId = 'drawer-events';
    } else if (path.includes('/reservation/')) {
        activeNavId = 'nav-reservation';
        activeDrawerId = 'drawer-reservation';
    }

    const navLinks = document.querySelectorAll('.header-nav .nav-item, .drawer-nav .drawer-item');
    navLinks.forEach(link => {
        if (link.id === activeNavId || link.id === activeDrawerId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // モバイル用メニュー（ドロワー）開閉トグル
    const mobileDrawer = document.getElementById('mobile-drawer');
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle && mobileDrawer) {
        menuToggle.addEventListener('click', () => {
            mobileDrawer.classList.toggle('active');
            menuToggle.classList.toggle('active');
            // 背景スクロールを禁止
            document.body.classList.toggle('no-scroll');
        });
    }

    // スクロール時にヘッダーに影をつける
    const header = document.getElementById('site-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // ==========================================================================
    // 2. Schedule Data Preprocessing (displayDate Auto-generation)
    // ==========================================================================
    if (typeof SCHEDULE_DATA !== 'undefined') {
        SCHEDULE_DATA.forEach(event => {
            event.rawDate = event.date; // JSON-LD生成用
            let dateStr = event.date;
            let endTimeStr = '';

            const match = dateStr.match(/^(.*?\s+\d{1,2}:\d{2})\s*[-〜~]\s*(\d{1,2}:\d{2})$/);
            if (match) {
                dateStr = match[1];
                endTimeStr = match[2];
                event.date = dateStr;
            }

            if (!event.displayDate && event.date) {
                const d = new Date(event.date);
                if (!isNaN(d)) {
                    const month = d.getMonth() + 1;
                    const date = d.getDate();
                    const days = ['日', '月', '火', '水', '木', '金', '土'];
                    const day = days[d.getDay()];
                    const h = d.getHours();
                    const m = d.getMinutes().toString().padStart(2, '0');

                    if (endTimeStr) {
                        event.displayDate = `${month}/${date}(${day}) ${h}:${m}〜${endTimeStr}`;
                    } else {
                        event.displayDate = `${month}/${date}(${day}) ${h}:${m}〜`;
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 3. アコーディオン開閉ロジック
    // ==========================================================================
    const accordionBtns = document.querySelectorAll('.accordion-toggle-btn');
    accordionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.parentElement;
            const content = parent.querySelector('.accordion-content');
            const arrow = btn.querySelector('.accordion-arrow');

            parent.classList.toggle('active');
            if (parent.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + 'px';
                arrow.textContent = '▲';
            } else {
                content.style.maxHeight = '0px';
                arrow.textContent = '▼';
            }
        });
    });

    // ==========================================================================
    // 4. FAQ アコーディオン制御 (★NEW)
    // ==========================================================================
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(qBtn => {
        qBtn.addEventListener('click', () => {
            const parent = qBtn.parentElement;
            const answer = parent.querySelector('.faq-answer');
            const icon = qBtn.querySelector('.faq-icon');

            parent.classList.toggle('active');
            if (parent.classList.contains('active')) {
                answer.style.display = 'block';
                icon.textContent = '▲';
            } else {
                answer.style.display = 'none';
                icon.textContent = '▼';
            }
        });
    });

    // ==========================================================================
    // 5. Two-Stage Linked Dropdowns Setup (二段階連動セレクトボックス)
    // ==========================================================================
    const studyGroupTypeSelect = document.getElementById('study-group-type');
    const studyGroupDateSelect = document.getElementById('study-group-date');

    // ボードゲーム会種類に応じた日程セレクトの動的更新
    function updateDateDropdown(typeKey) {
        if (!studyGroupDateSelect || typeof SCHEDULE_DATA === 'undefined' || typeof GAME_MEETING_TYPES === 'undefined') return;

        const now = new Date();
        studyGroupDateSelect.innerHTML = ''; // クリア

        // 選択されたゲーム会に紐付く未来日程を取得
        const matchedSchedules = SCHEDULE_DATA.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= now && event.typeKey === typeKey;
        });

        if (matchedSchedules.length > 0) {
            const defaultOpt = document.createElement('option');
            defaultOpt.value = "";
            defaultOpt.disabled = true;
            defaultOpt.selected = true;
            defaultOpt.textContent = "日程を選択してください";
            studyGroupDateSelect.appendChild(defaultOpt);

            matchedSchedules.forEach(event => {
                const typeLabel = event.location === 'オンライン' ? '【オンライン】' : '【オフライン】';
                const locName = event.location === 'オンライン' ? 'Zoom' : event.location;

                const option = document.createElement('option');
                option.value = event.id;

                let spotsText = '';
                if (event.spotsLeft === 0) {
                    spotsText = ' (満席)';
                    option.disabled = true;
                } else {
                    spotsText = ` (残り枠: ${event.spotsLeft}名)`;
                }

                option.textContent = `${event.displayDate} (場所: ${locName}) - ${typeLabel}${spotsText}`;
                studyGroupDateSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = "";
            option.disabled = true;
            option.selected = true;
            option.textContent = "現在予定されている日程はありません";
            studyGroupDateSelect.appendChild(option);
        }
    }

    // 予約フォームセレクトの初期設定
    if (studyGroupTypeSelect && studyGroupDateSelect && typeof GAME_MEETING_TYPES !== 'undefined') {
        studyGroupTypeSelect.innerHTML = '<option value="" disabled selected>選択してください</option>';
        Object.keys(GAME_MEETING_TYPES).forEach(key => {
            const typeInfo = GAME_MEETING_TYPES[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = typeInfo.name;
            studyGroupTypeSelect.appendChild(option);
        });

        // 種類変更時の日程連動リスナー
        studyGroupTypeSelect.addEventListener('change', (e) => {
            updateDateDropdown(e.target.value);
        });

        // URLクエリパラメータの解析 (?event=catan) による自動セット
        const urlParams = new URLSearchParams(window.location.search);
        const eventParam = urlParams.get('event');
        if (eventParam && GAME_MEETING_TYPES[eventParam]) {
            studyGroupTypeSelect.value = eventParam;
            updateDateDropdown(eventParam);

            // 未来の有効な日程を自動選択
            const now = new Date();
            const matchedEvent = SCHEDULE_DATA.find(event => {
                const eventDate = new Date(event.date);
                return eventDate >= now && event.typeKey === eventParam && event.spotsLeft > 0;
            });

            if (matchedEvent) {
                studyGroupDateSelect.value = matchedEvent.id;
            }
        }
    }

    // ==========================================================================
    // 6. Reservation Form Confirm & Submit (二段階セレクト対応)
    // ==========================================================================
    const reservationForm = document.getElementById('reservation-form');
    const btnConfirmSubmit = document.getElementById('btn-confirm-submit');
    const btnConfirmBack = document.getElementById('btn-confirm-back');
    const confirmButtonsArea = document.getElementById('confirm-buttons-area');

    let tempFormData = {};

    function showReservationConfirmStep(step) {
        const resFormSec = document.getElementById('reservation');
        const resConfirmSec = document.getElementById('reservation-confirm');
        
        if (step === 'input') {
            if (resFormSec) resFormSec.style.display = 'block';
            if (resConfirmSec) resConfirmSec.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (step === 'confirm') {
            if (resFormSec) resFormSec.style.display = 'none';
            if (resConfirmSec) resConfirmSec.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }

    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const typeKey = studyGroupTypeSelect.value;
            const eventId = studyGroupDateSelect.value;
            const message = document.getElementById('message').value;

            if (!typeKey || !eventId) {
                alert('ボードゲーム会と日程をそれぞれ選択してください。');
                return;
            }

            const selectedEvent = SCHEDULE_DATA.find(evt => evt.id === eventId);
            if (!selectedEvent) {
                alert('選択された日程が見つかりません。');
                return;
            }

            const typeInfo = GAME_MEETING_TYPES[typeKey];
            const typeName = typeInfo ? typeInfo.name : 'ボードゲーム会';
            const typeLabel = selectedEvent.location === 'オンライン' ? '【オンライン】' : '【オフライン】';
            const locName = selectedEvent.location === 'オンライン' ? 'Zoom' : selectedEvent.location;
            const eventText = `${selectedEvent.displayDate} (場所: ${locName}) - ${typeLabel} ${typeName}`;

            tempFormData = {
                name: name,
                email: email,
                eventId: eventId,
                eventText: eventText,
                selectedEvent: selectedEvent,
                message: message || 'なし'
            };

            document.getElementById('confirm-name').textContent = tempFormData.name;
            document.getElementById('confirm-email').textContent = tempFormData.email;
            document.getElementById('confirm-event').textContent = tempFormData.eventText;
            document.getElementById('confirm-message').textContent = tempFormData.message;

            const formSuccessMsg = document.getElementById('form-success-message');
            if (formSuccessMsg) formSuccessMsg.style.display = 'none';
            if (confirmButtonsArea) confirmButtonsArea.style.display = 'block';

            showReservationConfirmStep('confirm');
        });
    }

    if (btnConfirmBack) {
        btnConfirmBack.addEventListener('click', () => {
            showReservationConfirmStep('input');
        });
    }

    if (btnConfirmSubmit) {
        btnConfirmSubmit.addEventListener('click', async () => {
            if (!tempFormData.eventId || typeof emailjs === 'undefined') {
                alert('システム設定エラー、またはデータが見つかりません。');
                return;
            }

            const event = tempFormData.selectedEvent;
            const isOnline = event.location === 'オンライン';
            let guidanceText = '';
            if (isOnline) {
                guidanceText = `当日は以下のZoomリンクからご参加ください。リラックスして楽しく遊びましょう！\n参加Zoom URL：${event.locationUrl}`;
            } else {
                guidanceText = `当日は以下の会場へお越しください。直接お会いできるのを楽しみにしております！\n会場住所：${event.locationAddress}\nGoogle Map：${event.mapUrl}`;
            }

            const typeInfo = GAME_MEETING_TYPES[event.typeKey];
            const eventTitle = typeInfo ? typeInfo.name : 'ボードゲーム会';

            const templateParams = {
                user_name: tempFormData.name,
                user_email: tempFormData.email,
                event_datetime: event.displayDate,
                event_title: eventTitle,
                guidance_text: guidanceText,
                message: tempFormData.message
            };

            btnConfirmSubmit.textContent = '確定処理中...';
            btnConfirmSubmit.disabled = true;
            if (btnConfirmBack) btnConfirmBack.disabled = true;

            try {
                const SERVICE_ID = 'service_404f0gb';
                const TEMPLATE_ID = 'template_71qn708';
                const PUBLIC_KEY = 'AUtbs1pcI8vM52o-q';

                if (SERVICE_ID === 'YOUR_SERVICE_ID') {
                    console.log('【EmailJSデモ確定送信】デモ動作を行います：', templateParams);
                    setTimeout(() => {
                        showSuccessScreen();
                    }, 800);
                } else {
                    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
                    showSuccessScreen();
                }

            } catch (error) {
                console.error('EmailJS Error:', error);
                alert('予約確定メールの送信に失敗しました。時間をおいて再度お試しいただくか、別途ご連絡ください。');
                btnConfirmSubmit.textContent = 'この内容で確定する';
                btnConfirmSubmit.disabled = false;
                if (btnConfirmBack) btnConfirmBack.disabled = false;
            }
        });
    }

    function showSuccessScreen() {
        if (confirmButtonsArea) confirmButtonsArea.style.display = 'none';

        const successMessage = document.getElementById('form-success-message');
        if (successMessage) {
            successMessage.style.display = 'block';
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (reservationForm) {
            reservationForm.reset();
        }

        if (studyGroupDateSelect) {
            studyGroupDateSelect.innerHTML = '<option value="" disabled selected>まずボードゲーム会を選択してください</option>';
        }

        tempFormData = {};
    }
});
