document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. Sidebar Page Navigation (SPA Switching)
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');
    const sidebar = document.querySelector('.site-sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const logoLink = document.getElementById('logo-link');

    function showSection(sectionId) {
        sections.forEach(sec => {
            sec.classList.remove('active');
        });

        const targetSec = document.getElementById(sectionId);
        if (targetSec) {
            targetSec.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'instant' });

            const animatedInSec = targetSec.querySelectorAll('.animate-on-scroll.fade-up');
            animatedInSec.forEach(el => {
                el.classList.add('visible');
            });
        }

        let activeNavId = sectionId;
        if (sectionId === 'blog-detail') activeNavId = 'blog';
        if (sectionId === 'reservation-confirm') activeNavId = 'reservation';

        navItems.forEach(item => {
            if (item.getAttribute('data-section') === activeNavId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        }
    }

    // メニュー項目クリック時のイベントリスナー
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            if (sectionId) {
                if (sectionId === 'reservation') {
                    resetReservationForm();
                }
                showSection(sectionId);
            }
        });
    });

    if (logoLink) {
        logoLink.addEventListener('click', () => {
            showSection('home');
        });
    }

    // ページ内リンク用ボタン
    const internalLinks = document.querySelectorAll('.link-to-section');
    internalLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetSection = link.getAttribute('data-target');
            if (targetSection) {
                if (targetSection === 'reservation') {
                    resetReservationForm();
                }
                showSection(targetSection);
            }
        });
    });

    // モバイル用メニュー開閉トグル
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // ==========================================================================
    // 2. Schedule Data Preprocessing (displayDate Auto-generation)
    // ==========================================================================
    if (typeof SCHEDULE_DATA !== 'undefined') {
        SCHEDULE_DATA.forEach(event => {
            event.rawDate = event.date; // JSON-LD生成用に元の日程フォーマットを保存
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
    // 2.5. Dynamic Generation of JSON-LD Event Structured Data for SEO
    // ==========================================================================
    if (typeof SCHEDULE_DATA !== 'undefined' && typeof GAME_MEETING_TYPES !== 'undefined') {
        const now = new Date();
        const futureEventsForSEO = SCHEDULE_DATA.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= now;
        });

        if (futureEventsForSEO.length > 0) {
            futureEventsForSEO.forEach(event => {
                const typeInfo = GAME_MEETING_TYPES[event.typeKey];
                if (!typeInfo) return;

                let startDateISO = '';
                let endDateISO = '';
                const dateMatch = event.rawDate.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})\s*[-〜~]\s*(\d{1,2}):(\d{2})$/);
                if (dateMatch) {
                    const yr = dateMatch[1];
                    const mo = dateMatch[2].padStart(2, '0');
                    const dy = dateMatch[3].padStart(2, '0');
                    const sh = dateMatch[4].padStart(2, '0');
                    const sm = dateMatch[5].padStart(2, '0');
                    const eh = dateMatch[6].padStart(2, '0');
                    const em = dateMatch[7].padStart(2, '0');
                    startDateISO = `${yr}-${mo}-${dy}T${sh}:${sm}:00+09:00`;
                    endDateISO = `${yr}-${mo}-${dy}T${eh}:${em}:00+09:00`;
                } else {
                    const d = new Date(event.date);
                    if (!isNaN(d)) {
                        startDateISO = d.toISOString();
                        const endD = new Date(d.getTime() + 2 * 60 * 60 * 1000);
                        endDateISO = endD.toISOString();
                    }
                }

                let price = 0;
                const feeStr = typeInfo.fee;
                if (feeStr && !feeStr.includes('無料')) {
                    const priceMatch = feeStr.match(/\d+/);
                    if (priceMatch) {
                        price = parseInt(priceMatch[0], 10);
                    }
                }

                const isOnline = event.location === 'オンライン';
                const eventSchema = {
                    "@context": "https://schema.org",
                    "@type": "Event",
                    "name": typeInfo.name,
                    "description": typeInfo.desc,
                    "startDate": startDateISO,
                    "endDate": endDateISO,
                    "eventStatus": "https://schema.org/EventScheduled",
                    "eventAttendanceMode": isOnline ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
                    "image": typeInfo.imagePath ? `https://ohigesan.netlify.app/${typeInfo.imagePath}` : "https://ohigesan.netlify.app/images/fv_bg.png",
                    "offers": {
                        "@type": "Offer",
                        "price": price.toString(),
                        "priceCurrency": "JPY",
                        "availability": "https://schema.org/InStock",
                        "url": "https://ohigesan.netlify.app/#reservation"
                    },
                    "organizer": {
                        "@type": "Person",
                        "name": "おひげさん",
                        "url": "https://ohigesan.netlify.app/"
                    }
                };

                if (isOnline) {
                    eventSchema.location = {
                        "@type": "VirtualLocation",
                        "url": event.locationUrl || "https://ohigesan.netlify.app/#reservation"
                    };
                } else {
                    eventSchema.location = {
                        "@type": "Place",
                        "name": event.locationAddress || event.location,
                        "address": {
                            "@type": "PostalAddress",
                            "addressCountry": "JP",
                            "addressRegion": "東京都"
                        }
                    };
                }

                const scriptEl = document.createElement('script');
                scriptEl.type = 'application/ld+json';
                scriptEl.text = JSON.stringify(eventSchema);
                document.head.appendChild(scriptEl);
            });
        }
    }

    // ==========================================================================
    // 3. Dynamic Generation of Activity Cards (Master Data連動)
    // ==========================================================================
    const activitiesContainer = document.getElementById('activities-container');
    if (activitiesContainer && typeof GAME_MEETING_TYPES !== 'undefined' && typeof SCHEDULE_DATA !== 'undefined' && typeof BLOG_POSTS !== 'undefined') {
        activitiesContainer.innerHTML = '';
        const now = new Date();

        Object.keys(GAME_MEETING_TYPES).forEach(key => {
            const typeInfo = GAME_MEETING_TYPES[key];

            // このゲーム会種類に紐付く未来の日程をフィルタ
            const futureEvents = SCHEDULE_DATA.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= now && event.typeKey === key;
            });

            // 1. スケジュールHTMLの構築（近日開催）※近日開催予定の日程は最高で4つまで表示できるように拡張
            let scheduleHtml = '';
            if (futureEvents.length > 0) {
                futureEvents.slice(0, 4).forEach(event => { // slice(0, 4) へ拡張
                    const isOnline = event.location === 'オンライン';
                    const typeLabel = isOnline ? '<span class="type-badge online">オンライン</span>' : '<span class="type-badge offline">オフライン</span>';
                    const locLabel = isOnline ? 'Zoom配信' : `会場: ${event.location}`;

                    // 残り枠バッジの生成
                    let spotsLabel = '';
                    if (event.spotsLeft === 0) {
                        spotsLabel = '<span class="spots-badge spots-full">満席</span>';
                    } else if (event.spotsLeft === 1) {
                        spotsLabel = `<span class="spots-badge spots-urgent">残り枠: ${event.spotsLeft}名</span>`;
                    } else if (event.spotsLeft === 2) {
                        spotsLabel = `<span class="spots-badge spots-warning">残り枠: ${event.spotsLeft}名</span>`;
                    } else {
                        spotsLabel = `<span class="spots-badge spots-normal">残り枠: ${event.spotsLeft}名</span>`;
                    }

                    scheduleHtml += `
                        <li style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            ${typeLabel}
                            <span class="date-text" style="font-size:0.9rem; color:var(--color-text-muted); font-weight:600;">
                                ${event.displayDate} (${locLabel})
                            </span>
                            ${spotsLabel}
                        </li>
                    `;
                });
            } else {
                scheduleHtml = `<li><span class="no-schedule">現在調整中。確定次第公開します！</span></li>`;
            }

            // 2. 「こんな方におすすめ」リスト
            let recommendHtml = '';
            if (typeInfo.recommend && typeInfo.recommend.length > 0) {
                typeInfo.recommend.forEach(rec => {
                    recommendHtml += `<li>${rec}</li>`;
                });
            }

            // 3. 注意事項リスト
            let notesHtml = '';
            if (typeInfo.notes && typeInfo.notes.length > 0) {
                typeInfo.notes.forEach(note => {
                    notesHtml += `<li>${note}</li>`;
                });
            }

            // 4. 参加者の声レビュー
            let reviewsHtml = '';
            if (typeInfo.reviews && typeInfo.reviews.length > 0) {
                typeInfo.reviews.forEach(rev => {
                    reviewsHtml += `
                        <div class="review-bubble">
                            <p class="review-text">「${rev.text}」</p>
                            <span class="review-author">— ${rev.age}</span>
                        </div>
                    `;
                });
            }

            // 5. 関連コラムリンクの設置
            let relatedBlogsHtml = '';
            if (typeInfo.relatedColumns && typeInfo.relatedColumns.length > 0) {
                typeInfo.relatedColumns.forEach(postId => {
                    const post = BLOG_POSTS.find(p => p.id === postId);
                    if (post) {
                        relatedBlogsHtml += `
                            <a href="#" class="related-blog-link" data-post-id="${post.id}">
                                📖 コラム：${post.title}
                            </a>
                        `;
                    }
                });
            }

            // カードHTMLの作成
            const card = document.createElement('div');
            card.className = 'activity-card animate-on-scroll fade-up visible';
            card.innerHTML = `
                <div class="act-image-wrapper">
                    <img src="${typeInfo.imagePath || 'images/fv_bg.png'}" alt="${typeInfo.name}" class="act-img">
                    <span class="act-badge ${typeInfo.badgeClass || 'offline'}">${typeInfo.badge}</span>
                </div>
                <div class="act-content">
                    <div class="act-meta">
                        <span class="act-category">${typeInfo.emoji || '🎲'} ${typeInfo.badge}</span>
                    </div>
                    <h3 class="act-card-title">${typeInfo.name}</h3>
                    <p class="act-subtitle" style="font-size:0.9rem; color:var(--color-primary-hover); font-weight:700; margin-top:-8px; margin-bottom:12px;">${typeInfo.subtitle || ''}</p>
                    <p class="act-desc">${typeInfo.desc}</p>
                    
                    <div class="act-recommend">
                        <h4 class="act-sub-heading">🎯 こんな方におすすめ</h4>
                        <ul class="recommend-list">
                            ${recommendHtml}
                        </ul>
                    </div>

                    <div class="detail-accordion">
                        <button type="button" class="accordion-toggle-btn">
                            <span>イベントの詳しい情報を見る</span>
                            <span class="accordion-arrow">▼</span>
                        </button>
                        <div class="accordion-content">
                            <div class="inner-detail-block">
                                <h4 class="act-sub-heading">📖 イベント詳細</h4>
                                <p class="inner-detail-text">${typeInfo.details || ''}</p>
                            </div>
                            
                            <div class="inner-detail-block">
                                <h4 class="act-sub-heading">⏰ 当日の流れ</h4>
                                <p class="inner-detail-text">${typeInfo.flow || ''}</p>
                            </div>

                            <div class="inner-detail-block">
                                <h4 class="act-sub-heading">💴 参加費・持ち物</h4>
                                <p class="inner-detail-text"><strong>参加費：</strong>${typeInfo.fee || ''}</p>
                                <p class="inner-detail-text"><strong>持ち物：</strong>${typeInfo.items || 'なし'}</p>
                            </div>

                            <div class="inner-detail-block">
                                <h4 class="act-sub-heading">⚠️ 注意事項</h4>
                                <ul class="recommend-list notes-list">
                                    ${notesHtml}
                                </ul>
                            </div>

                            <div class="inner-detail-block">
                                <h4 class="act-sub-heading">⭐ 参加者の声</h4>
                                <div class="reviews-container">
                                    ${reviewsHtml}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card-schedules">
                        <h4 class="card-schedules-title">📅 近日開催予定の日程</h4>
                        <ul class="card-schedules-list">
                            ${scheduleHtml}
                        </ul>
                    </div>

                    <div class="related-columns-area">
                        <h4 class="related-title">💡 関連コラム記事</h4>
                        <div class="related-links-grid">
                            ${relatedBlogsHtml}
                        </div>
                    </div>
                    
                    <div class="act-actions" style="margin-top:auto;">
                        <button class="cta-button primary mini-cta" data-target-keyword="${key}">
                            <span>スケジュールを見る／参加を申し込む</span>
                            <span class="arrow">→</span>
                        </button>
                    </div>
                </div>
            `;
            activitiesContainer.appendChild(card);
        });

        // アコーディオンの開閉イベント
        const accordionBtns = activitiesContainer.querySelectorAll('.accordion-toggle-btn');
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

        // コラムリンクイベント
        const relatedBlogLinks = activitiesContainer.querySelectorAll('.related-blog-link');
        relatedBlogLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = link.getAttribute('data-post-id');
                openBlogPostDetail(postId);
            });
        });
    }

    // コラム詳細表示
    function openBlogPostDetail(postId) {
        if (typeof BLOG_POSTS !== 'undefined') {
            const post = BLOG_POSTS.find(p => p.id === postId);
            if (post) {
                document.getElementById('detail-title').textContent = post.title;
                document.getElementById('detail-date').textContent = post.date;
                document.getElementById('detail-category').textContent = post.categoryName;
                document.getElementById('detail-body').innerHTML = post.content;

                showSection('blog-detail');
            }
        }
    }

    // ==========================================================================
    // 4. Dynamic Generation of Columns & SPA Blog Details
    // ==========================================================================
    const blogContainer = document.getElementById('blog-container');
    if (blogContainer && typeof BLOG_POSTS !== 'undefined') {
        blogContainer.innerHTML = '';

        const categories = {};
        BLOG_POSTS.forEach(post => {
            if (!categories[post.category]) {
                categories[post.category] = {
                    name: post.categoryName,
                    posts: []
                };
            }
            categories[post.category].posts.push(post);
        });

        Object.keys(categories).forEach(catKey => {
            const cat = categories[catKey];

            const catGroup = document.createElement('div');
            catGroup.className = 'blog-category-group';

            let postsHtml = '';
            cat.posts.forEach(post => {
                postsHtml += `
                    <article class="blog-card">
                        <span class="blog-date">${post.date}</span>
                        <h4><a href="#" class="blog-title-link" data-post-id="${post.id}">${post.title}</a></h4>
                        <p>${post.summary}</p>
                        <a href="#" class="blog-more blog-title-link" data-post-id="${post.id}">続きを読む →</a>
                    </article>
                `;
            });

            catGroup.innerHTML = `
                <h3 class="category-heading">📂 ${cat.name}</h3>
                <div class="blog-grid">
                    ${postsHtml}
                </div>
            `;
            blogContainer.appendChild(catGroup);
        });

        const blogLinks = blogContainer.querySelectorAll('.blog-title-link');
        blogLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = link.getAttribute('data-post-id');
                openBlogPostDetail(postId);
            });
        });
    }

    const backToBlogBtn = document.getElementById('back-to-blog');
    if (backToBlogBtn) {
        backToBlogBtn.addEventListener('click', () => {
            showSection('blog');
        });
    }

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
            // 初期ダミー選択肢
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
                    option.disabled = true; // 満席の場合は選択不可に
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
        // 1. ゲーム会種類のセレクト項目を生成
        studyGroupTypeSelect.innerHTML = '<option value="" disabled selected>選択してください</option>';
        Object.keys(GAME_MEETING_TYPES).forEach(key => {
            const typeInfo = GAME_MEETING_TYPES[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = typeInfo.name;
            studyGroupTypeSelect.appendChild(option);
        });

        // 2. 種類変更時の日程連動リスナー
        studyGroupTypeSelect.addEventListener('change', (e) => {
            updateDateDropdown(e.target.value);
        });
    }

    // 活動カード「スケジュールを見る」ボタンと二段階セレクトの連動
    const miniCtaButtons = document.querySelectorAll('.mini-cta');
    miniCtaButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const keyword = btn.getAttribute('data-target-keyword'); // 例: catan, monopoly

            resetReservationForm();
            showSection('reservation');

            if (studyGroupTypeSelect && studyGroupDateSelect) {
                // 1. 種類を自動セット
                studyGroupTypeSelect.value = keyword;

                // 2. 連動日程を再生成
                updateDateDropdown(keyword);

                // 3. 未来の日程かつ空き枠がある最初のものを自動選択状態にする
                const now = new Date();
                const matchedEvent = SCHEDULE_DATA.find(event => {
                    const eventDate = new Date(event.date);
                    return eventDate >= now && event.typeKey === keyword && event.spotsLeft > 0;
                });

                if (matchedEvent) {
                    studyGroupDateSelect.value = matchedEvent.id;
                }
            }
        });
    });

    // ==========================================================================
    // 6. Reservation Form Confirm & Submit SPA flow (二段階セレクト対応)
    // ==========================================================================
    const reservationForm = document.getElementById('reservation-form');
    const btnConfirmSubmit = document.getElementById('btn-confirm-submit');
    const btnConfirmBack = document.getElementById('btn-confirm-back');
    const confirmButtonsArea = document.getElementById('confirm-buttons-area');

    let tempFormData = {};

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

            showSection('reservation-confirm');
        });
    }

    if (btnConfirmBack) {
        btnConfirmBack.addEventListener('click', () => {
            showSection('reservation');
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

        // 二段階セレクトの連動状態も初期化
        if (studyGroupDateSelect) {
            studyGroupDateSelect.innerHTML = '<option value="" disabled selected>まずボードゲーム会を選択してください</option>';
        }

        tempFormData = {};
    }

    function resetReservationForm() {
        if (reservationForm) {
            reservationForm.style.display = 'block';
            const formDesc = document.querySelector('#reservation .form-desc');
            if (formDesc) formDesc.style.display = 'block';
        }

        const successMessage = document.getElementById('form-success-message');
        if (successMessage) {
            successMessage.style.display = 'none';
        }

        if (confirmButtonsArea) {
            confirmButtonsArea.style.display = 'block';
        }
    }
});
