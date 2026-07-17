const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const templatesDir = path.join(__dirname, 'templates');
const distDir = path.join(__dirname, 'dist');
const lpProjectDir = __dirname;

// 1. schedule.js からデータを動的にロード
let scheduleCode = fs.readFileSync(path.join(lpProjectDir, 'schedule.js'), 'utf8');
scheduleCode += '\nmodule.exports = { GAME_MEETING_TYPES, SCHEDULE_DATA, BLOG_POSTS };';
const tempFile = path.join(__dirname, 'temp_schedule.js');
fs.writeFileSync(tempFile, scheduleCode, 'utf8');
const { GAME_MEETING_TYPES, SCHEDULE_DATA, BLOG_POSTS } = require(tempFile);
fs.unlinkSync(tempFile);

// 本番ドメイン
const domain = 'https://tokyo-boardgame-club.netlify.app';

// 記録用の生成されたパス一覧
const generatedPages = [];

// ディレクトリコピー用関数 (再帰)
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        if (entry.name === '.git' || entry.name === 'dist' || entry.name === 'node_modules') continue;
        
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            if (entry.name.endsWith('.HEIC') || entry.name.endsWith('.DS_Store')) continue;
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 共通テンプレート置換処理
function renderTemplate(content, meta) {
    const layout = fs.readFileSync(path.join(templatesDir, 'layout.html'), 'utf8');
    
    // メタ情報の設定
    const title = meta.title || '東京ボードゲーム会 | 200種の知識で楽しむ社会人向けボードゲームコミュニティ';
    const description = meta.description || '日々の繰り返しや仕事にもやもやを抱える社会人のためのボードゲームコミュニティ「東京ボードゲーム会」。ゆるボドゲパパが所有する200種類のボドゲ知識を活かして、初めての方でも優しくレクチャー。明日へのエネルギーになる温かい居場所を提供します。';
    const canonical = meta.canonical || domain + '/';
    const ogImage = meta.ogImage || domain + '/images/hero_game.jpg';
    const ogUrl = meta.ogUrl || canonical;
    const pathDepth = meta.pathDepth || './';
    const jsonLd = meta.jsonLd ? `<script type="application/ld+json">\n${JSON.stringify(meta.jsonLd, null, 2)}\n</script>` : '';

    let html = layout
        .replace(/\{\{title\}\}/g, title)
        .replace(/\{\{description\}\}/g, description)
        .replace(/\{\{canonical\}\}/g, canonical)
        .replace(/\{\{og_title\}\}/g, title)
        .replace(/\{\{og_description\}\}/g, description)
        .replace(/\{\{og_image\}\}/g, ogImage)
        .replace(/\{\{og_url\}\}/g, ogUrl)
        .replace(/\{\{twitter_title\}\}/g, title)
        .replace(/\{\{twitter_description\}\}/g, description)
        .replace(/\{\{twitter_image\}\}/g, ogImage)
        .replace(/\{\{path_depth\}\}/g, pathDepth)
        .replace(/\{\{json_ld\}\}/g, jsonLd)
        .replace(/\{\{content\}\}/g, content);

    // 各アセット・画像のパスをルート絶対パスへ一律置換 (srcset対応)
    html = html.replace(/src="images\//g, 'src="/images/');
    html = html.replace(/srcset="images\//g, 'srcset="/images/');
    html = html.replace(/href="images\//g, 'href="/images/');
    
    html = html.replace(/src="about\//g, 'src="/about/');
    html = html.replace(/srcset="about\//g, 'srcset="/about/');
    html = html.replace(/href="about\//g, 'href="/about/');
    
    html = html.replace(/src="gallery\//g, 'src="/gallery/');
    html = html.replace(/srcset="gallery\//g, 'srcset="/gallery/');
    html = html.replace(/href="gallery\//g, 'href="/gallery/');
    
    html = html.replace(/src="blog\//g, 'src="/blog/');
    html = html.replace(/srcset="blog\//g, 'srcset="/blog/');
    html = html.replace(/href="blog\//g, 'href="/blog/');
    
    html = html.replace(/src="events\//g, 'src="/events/');
    html = html.replace(/srcset="events\//g, 'srcset="/events/');
    html = html.replace(/href="events\//g, 'href="/events/');
    
    html = html.replace(/src="reservation\//g, 'src="/reservation/');
    html = html.replace(/srcset="reservation\//g, 'srcset="/reservation/');
    html = html.replace(/href="reservation\//g, 'href="/reservation/');

    return html;
}

// ビルドの開始
console.log('Building Tokyo Board Game Club SSG website...');

// distディレクトリの初期化
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// 1. 静的リソース (images, styles.css, schedule.js, script.js) のコピー
fs.copyFileSync(path.join(lpProjectDir, 'styles.css'), path.join(distDir, 'styles.css'));
fs.copyFileSync(path.join(lpProjectDir, 'schedule.js'), path.join(distDir, 'schedule.js'));
fs.copyFileSync(path.join(lpProjectDir, 'script.js'), path.join(distDir, 'script.js'));
fs.copyFileSync(path.join(lpProjectDir, 'google7532574a4c3445c9.html'), path.join(distDir, 'google7532574a4c3445c9.html'));
copyDir(path.join(lpProjectDir, 'images'), path.join(distDir, 'images'));

// 全ページ共通 Organization 構造化データ
const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "東京ボードゲーム会",
    "url": domain + "/",
    "logo": domain + "/images/tokyo_logo_color.png?v=2",
    "founder": {
        "@type": "Person",
        "name": "ゆるボドゲパパ"
    },
    "sameAs": []
};

// FAQ 構造化データ
const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "ボードゲーム初心者でも参加できますか？",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "はい、大歓迎です！当会では、ゲームを始める前に主催者（ゆるボドゲパパ）がルール説明（レクチャー）を丁寧に行います。「人生ゲームしかやったことがない」という方でも安心してご参加いただけます。"
            }
        },
        {
            "@type": "Question",
            "name": "一人で参加しても大丈夫ですか？",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "はい、全く問題ありません。参加される方のほとんどがお一人でのご参加です。ゲームが始まれば自然と会話が生まれますし、主催者が皆さんが打ち解けられるようサポートします。"
            }
        },
        {
            "@type": "Question",
            "name": "服装に決まりはありますか？",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "特にございません。私服や、仕事帰りであればスーツのままでも大丈夫です。過ごしやすくリラックスできる服装でお越しください。"
            }
        },
        {
            "@type": "Question",
            "name": "当日の持ち物は必要ですか？",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "基本的に手ぶらでご参加いただけます。筆記用具や電卓などが必要なワークショップ・イベントの場合は、各イベント詳細ページの「持ち物」に記載しておりますので、事前にご確認ください。"
            }
        },
        {
            "@type": "Question",
            "name": "途中参加・途中退出はできますか？",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "はい、可能です。お仕事のご都合などがある場合は、予約時のメッセージまたは事前にご連絡いただけますと、ゲームの進行スケジュールを合わせやすいため非常に助かります。"
            }
        }
    ]
};

// --------------------------------------------------------------------------
// A. 固定ページの書き出し
// --------------------------------------------------------------------------

// 1. ホーム (/)
let homeContent = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');

// EVENTS プレビュー HTML 生成
const targetEventKeys = ['catan', 'communication_skills', 'cashflow'];
let eventsHtml = '<div class="slider-wrapper">';
targetEventKeys.forEach(key => {
    const event = GAME_MEETING_TYPES[key];
    if (!event) return;
    
    let imageUrl = '/images/fv_bg.png';
    let webpUrl = '/images/fv_bg.webp';
    if (key === 'catan') {
        imageUrl = '/images/event_catan.jpg';
        webpUrl = '/images/event_catan.webp';
    } else if (key === 'communication_skills') {
        imageUrl = '/images/event_communication.jpg';
        webpUrl = '/images/event_communication.webp';
    } else if (key === 'cashflow') {
        imageUrl = '/images/event_cashflow.jpg';
        webpUrl = '/images/event_cashflow.webp';
    }

    eventsHtml += `
        <div class="slider-card">
            <picture>
                <source srcset="${webpUrl}" type="image/webp">
                <img src="${imageUrl}" alt="${event.name}" class="slider-card-img" loading="lazy">
            </picture>
            <div class="slider-card-body">
                <span class="slider-card-badge">${event.emoji || '🎲'} ${event.badge}</span>
                <h3 class="slider-card-title">${event.name}</h3>
                <p class="slider-card-desc">${event.subtitle}</p>
                <div class="slider-card-footer">
                    <div class="slider-card-price">参加費 <span>${event.fee}</span></div>
                    <a href="/events/${event.id}/" class="slider-card-link">詳しく見る →</a>
                </div>
            </div>
        </div>
    `;
});
eventsHtml += '</div>';
homeContent = homeContent.replace('<!-- EVENTS_PREVIEW -->', eventsHtml);

// ブログサムネイル画像のテーマ判定ヘルパー関数
function getBlogThumbnailBase(post) {
    if (post.slug.includes('catan')) {
        return 'カタン会';
    }
    if (post.slug.includes('communication') || post.slug.includes('friends') || post.slug.includes('haa') || post.slug.includes('katakanashi')) {
        return 'ゲームで学ぶコミュニケーションワークショップ';
    }
    if (post.slug.includes('monopoly')) {
        return 'モノポリー';
    }
    if (post.slug.includes('cashflow')) {
        return 'キャッシュフロー会';
    }
    if (post.slug.includes('nisa')) {
        return 'NISAが学べる投資ゲーム_無料';
    }
    return 'gallery_boardgame';
}

// BLOG プレビュー HTML 生成
const latestPosts = BLOG_POSTS.slice(0, 3);
let blogHtml = '<div class="slider-wrapper">';
latestPosts.forEach(post => {
    const thumbBase = getBlogThumbnailBase(post);
    const imageUrl = `/images/${thumbBase}.png`;
    const webpUrl = `/images/${thumbBase}.webp`;

    blogHtml += `
        <a href="/blog/${post.slug}/" class="slider-card" style="text-decoration: none; color: inherit;">
            <picture>
                <source srcset="${webpUrl}" type="image/webp">
                <img src="${imageUrl}" alt="${post.title}" class="slider-card-img" loading="lazy">
            </picture>
            <div class="slider-card-body">
                <span class="slider-card-badge" style="color: var(--color-text-light); font-weight: 500;">${post.date}</span>
                <h3 class="slider-card-title" style="margin-top: 4px; font-size: 1.1rem; flex-grow: 1;">${post.title}</h3>
                <div class="slider-card-footer" style="border-top: none; padding-top: 0;">
                    <span class="slider-card-link">記事を読む →</span>
                </div>
            </div>
        </a>
    `;
});
blogHtml += '</div>';
homeContent = homeContent.replace('<!-- BLOG_PREVIEW -->', blogHtml);

const homeHtml = renderTemplate(homeContent, {
    title: '遊びながら学ぶボードゲーム会｜東京・社会人向け初心者歓迎',
    description: '交渉力・投資・判断力がゲームで自然に身につく。東京（新宿・北千住）開催の社会人向けボードゲーム会。20〜30代・一人参加大多数・初心者歓迎・参加費500円〜。',
    canonical: domain + '/',
    pathDepth: './',
    jsonLd: [organizationJsonLd, faqJsonLd]
});
fs.writeFileSync(path.join(distDir, 'index.html'), homeHtml);
generatedPages.push('/');

// 2. プロフィール (/about)
const aboutContent = fs.readFileSync(path.join(srcDir, 'about.html'), 'utf8');
const aboutHtml = renderTemplate(aboutContent, {
    title: '主催者プロフィール｜ゆるボドゲパパ・200種以上のボードゲーム経験',
    description: '葛飾区在住・3児の父・会社員。200種以上のボードゲームを体験したゆるボドゲパパが、遊びながら学べる東京ボードゲーム会を主催。初心者でも安心な会の主催者について。',
    canonical: domain + '/about/',
    pathDepth: '../',
    jsonLd: [
        organizationJsonLd,
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": domain + "/" },
                { "@type": "ListItem", "position": 2, "name": "プロフィール", "item": domain + "/about/" }
            ]
        }
    ]
});
fs.mkdirSync(path.join(distDir, 'about'), { recursive: true });
fs.writeFileSync(path.join(distDir, 'about', 'index.html'), aboutHtml);
generatedPages.push('/about/');

// 3. フォトギャラリー (/gallery)
const galleryContent = fs.readFileSync(path.join(srcDir, 'gallery.html'), 'utf8');
const galleryHtml = renderTemplate(galleryContent, {
    title: 'フォトギャラリー｜東京ボードゲーム会',
    description: '東京ボードゲーム会の対面イベントやオンライン交流会の楽しそうな雰囲気を写真でお届けします。アットホームで誰でも馴染めるコミュニティです。',
    canonical: domain + '/gallery/',
    pathDepth: '../',
    jsonLd: [
        organizationJsonLd,
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": domain + "/" },
                { "@type": "ListItem", "position": 2, "name": "フォトギャラリー", "item": domain + "/gallery/" }
            ]
        }
    ]
});
fs.mkdirSync(path.join(distDir, 'gallery'), { recursive: true });
fs.writeFileSync(path.join(distDir, 'gallery', 'index.html'), galleryHtml);
generatedPages.push('/gallery/');

// 4. 日程・予約 (/reservation)
const reservationContent = fs.readFileSync(path.join(srcDir, 'reservation.html'), 'utf8');
const reservationHtml = renderTemplate(reservationContent, {
    title: '日程・予約｜東京ボードゲーム会【新宿・北千住エリア開催】',
    description: '東京（新宿・北千住エリア）で開催中のボードゲーム会の直近日程と予約フォーム。カタン・モノポリー・NISAボードゲームなど。初心者・一人参加歓迎・参加費500円〜。',
    canonical: domain + '/reservation/',
    pathDepth: '../',
    jsonLd: [
        organizationJsonLd,
        faqJsonLd,
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": domain + "/" },
                { "@type": "ListItem", "position": 2, "name": "日程・予約", "item": domain + "/reservation/" }
            ]
        }
    ]
});
fs.mkdirSync(path.join(distDir, 'reservation'), { recursive: true });
fs.writeFileSync(path.join(distDir, 'reservation', 'index.html'), reservationHtml);
generatedPages.push('/reservation/');

// --------------------------------------------------------------------------
// B. ボードゲーム会（イベント）紹介ページの書き出し
// --------------------------------------------------------------------------

// 1. イベント一覧 (/events)
let eventCardsHtml = '';
Object.keys(GAME_MEETING_TYPES).forEach(key => {
    const typeInfo = GAME_MEETING_TYPES[key];
    const webpImagePath = typeInfo.imagePath ? '/' + typeInfo.imagePath.replace(/\.(jpeg|jpg|png)$/i, '.webp') : '/images/fv_bg.webp';
    const fallbackImagePath = typeInfo.imagePath ? '/' + typeInfo.imagePath : '/images/fv_bg.png';
    eventCardsHtml += `
        <article class="activity-card animate-on-scroll fade-up visible">
            <div class="act-image-wrapper">
                <picture>
                    <source srcset="${webpImagePath}" type="image/webp">
                    <img src="${fallbackImagePath}" alt="${typeInfo.name}" class="act-img" loading="lazy">
                </picture>
            </div>
            <div class="act-content">
                <div class="act-meta" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                    <span class="act-category">${typeInfo.emoji || '🎲'} ${typeInfo.badge}</span>
                    <span class="act-badge-text ${typeInfo.badgeClass || 'offline'}" style="font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 50px; background-color: var(--color-primary-light); color: var(--color-primary-hover);">${typeInfo.badgeClass === 'online' ? 'オンライン開催' : 'リアル開催'}</span>
                </div>
                <h3 class="act-card-title"><a href="${key}/">${typeInfo.name}</a></h3>
                <p class="act-subtitle" style="font-size:0.9rem; color:var(--color-primary-hover); font-weight:700; margin-top:-8px; margin-bottom:12px;">${typeInfo.subtitle || ''}</p>
                <p class="act-desc">${typeInfo.desc}</p>
                
                <!-- Quick Info Grid -->
                <div class="act-quick-info" style="margin-top: 15px; margin-bottom: 15px;">
                    <div class="info-item">
                        <span class="info-icon">💴</span>
                        <div class="info-text-wrapper">
                            <span class="info-label">参加費</span>
                            <span class="info-val font-highlight">${typeInfo.fee || ''}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">📍</span>
                        <div class="info-text-wrapper">
                            <span class="info-label">開催場所</span>
                            <span class="info-val" style="font-size:0.78rem; font-weight:700;">${typeInfo.badgeClass === 'online' ? 'オンライン' : '新宿・北千住エリア（申込後に詳細をご案内）'}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">💼</span>
                        <div class="info-text-wrapper">
                            <span class="info-label">持ち物</span>
                            <span class="info-val" style="font-size:0.82rem;">${typeInfo.items || 'なし'}</span>
                        </div>
                    </div>
                </div>

                <div class="act-actions" style="margin-top:auto;">
                    <a href="${key}/" class="cta-button primary mini-cta">
                        <span>詳しく見る / 日程確認</span>
                        <span class="arrow">→</span>
                    </a>
                </div>
            </div>
        </article>
    `;
});

const eventsIndexContent = `
<section id="activities" class="page-section active animate-fade-in">
    <div class="container-inner">
        <h2 class="section-title">ボードゲーム会紹介</h2>
        <p class="section-subtitle">ゆるボドゲパパが主催する、プレイスタイルや目的に合わせた特徴的なボードゲーム会です。</p>
        <div class="activities-grid">
            ${eventCardsHtml}
        </div>
    </div>
</section>
`;

const eventsIndexHtml = renderTemplate(eventsIndexContent, {
    title: '学べるボードゲーム会一覧｜東京・社会人・初心者向け',
    description: 'カタンで交渉力・モノポリーで投資判断・NISAボードゲームで資産形成。遊びながらリアルに使えるスキルが身につく会を東京で開催。参加費500円〜・一人参加歓迎。',
    canonical: domain + '/events/',
    pathDepth: '../',
    jsonLd: [
        organizationJsonLd,
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": domain + "/" },
                { "@type": "ListItem", "position": 2, "name": "ボードゲーム会紹介", "item": domain + "/events/" }
            ]
        }
    ]
});
fs.mkdirSync(path.join(distDir, 'events'), { recursive: true });
fs.writeFileSync(path.join(distDir, 'events', 'index.html'), eventsIndexHtml);
generatedPages.push('/events/');

// 2. 個別イベント詳細 (/events/[typeKey])
Object.keys(GAME_MEETING_TYPES).forEach(key => {
    const typeInfo = GAME_MEETING_TYPES[key];

    const isCatan = key === 'catan';
    const wrapperStyle = isCatan ? '' : ' style="aspect-ratio: auto; height: auto;"';
    const imgStyle = isCatan 
        ? 'width: 100%; height: 100%; object-fit: cover;' 
        : 'width: 100%; height: auto; display: block;';

    // 関連ブログ記事リンクの生成 (SEO対策用)
    const relatedBlogMapping = {
        catan: 'catan-beginner-tips',
        monopoly: 'monopoly-capitalism',
        cashflow: 'cashflow-game',
        nisa: 'nisa-board-game',
        communication_skills: 'board-game-friends'
    };
    const relatedBlogSlug = relatedBlogMapping[key];
    const relatedBlogPost = BLOG_POSTS.find(p => p.slug === relatedBlogSlug);
    let relatedBlogHtml = '';
    if (relatedBlogPost) {
        relatedBlogHtml = `
        <div class="related-blog">
          <p>あわせて読みたい</p>
          <a href="/blog/${relatedBlogPost.slug}/">
            ${relatedBlogPost.title}
          </a>
        </div>
        `;
    }

    // このイベントに紐づく近日日程 (過去日は除外)
    const now = new Date();
    const futureEvents = SCHEDULE_DATA.filter(event => {
        const dateStr = event.date.split(' ')[0]; // "2026/07/19"
        const eventDate = new Date(dateStr + ' 23:59:59'); // その日の終わりまで有効とする
        return event.typeKey === key && eventDate >= now;
    });

    let scheduleHtml = '';
    if (futureEvents.length > 0) {
        futureEvents.slice(0, 4).forEach(event => {
            const isOnline = event.location === 'オンライン';
            const typeLabel = isOnline ? '<span class="type-badge online">オンライン</span>' : '<span class="type-badge offline">オフライン</span>';
            const locLabel = isOnline ? 'Zoom配信' : `会場: ${event.location}`;

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

            const dateParts = event.date.split(' ');
            const dateOnly = dateParts[0];
            const timeOnly = dateParts[1] || '';
            const dateObjParts = dateOnly.split('/');
            const year = parseInt(dateObjParts[0], 10);
            const month = parseInt(dateObjParts[1], 10) - 1;
            const day = parseInt(dateObjParts[2], 10);
            const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
            const dayOfWeek = daysOfWeek[new Date(year, month, day).getDay()];
            const formattedDate = `${dateOnly}(${dayOfWeek}) ${timeOnly}`;

            scheduleHtml += `
                <li style="display: flex; flex-direction: column; gap: 6px; padding: 12px 16px; background-color: var(--color-bg-primary); border: 1px solid rgba(62, 50, 42, 0.04); border-radius: var(--radius-sm); margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        ${typeLabel}
                        ${spotsLabel}
                    </div>
                    <span class="date-text" style="font-size:0.92rem; color:var(--color-text-main); font-weight:700; line-height: 1.4;">
                        ${formattedDate} (${locLabel})
                    </span>
                </li>
            `;
        });
    } else {
        scheduleHtml = `<li><span class="no-schedule">現在調整中。確定次第公開します！</span></li>`;
    }

    // おすすめ、注意事項、声、コラム
    const recommendHtml = (typeInfo.recommend || []).map(rec => `<li>${rec}</li>`).join('\n');
    const notesHtml = (typeInfo.notes || []).map(note => `<li>${note}</li>`).join('\n');
    const reviewsHtml = (typeInfo.reviews || []).map(rev => `
        <div class="review-bubble" style="margin-bottom: 15px; background: var(--color-primary-light); padding: 15px; border-radius: var(--radius-sm);">
            <p class="review-text" style="font-style: italic; color: var(--color-text-main); font-weight: 500;">「${rev.text}」</p>
            <span class="review-author" style="display: block; text-align: right; font-size: 0.8rem; color: var(--color-text-light); font-weight: 700; margin-top: 5px;">— ${rev.age}</span>
        </div>
    `).join('\n');
    
    const relatedBlogsHtml = (typeInfo.relatedColumns || []).map(postId => {
        const post = BLOG_POSTS.find(p => p.id === postId);
        return post ? `<a href="/blog/${post.slug}/" class="related-blog-link" style="display: block; padding: 10px; background-color: var(--color-bg-white); border: 1px solid rgba(62, 50, 42, 0.05); border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 700; color: var(--color-primary-hover); transition: var(--transition-smooth);">📖 コラム：${post.title}</a>` : '';
    }).join('\n');

    const detailContent = `
    <section class="page-section active animate-fade-in" style="max-width: 900px; margin: 0 auto;">
        <div class="container-inner event-detail-container">
            <div style="margin-bottom: 12px;">
                <a href="/events/" class="cta-button secondary" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 0.9rem; border-radius: var(--radius-sm); border: 1px solid rgba(62, 50, 42, 0.1);"><span class="arrow">←</span> ボードゲーム会紹介一覧へ戻る</a>
            </div>

            <div class="activity-detail-card" style="box-shadow: var(--shadow-md); border-radius: var(--radius-lg); overflow: hidden; background-color: var(--color-bg-white); border: 1px solid rgba(62, 50, 42, 0.04);">
                <div class="act-image-wrapper"${wrapperStyle}>
                    <picture>
                        <source srcset="${typeInfo.imagePath ? '/' + typeInfo.imagePath.replace(/\.(jpeg|jpg|png)$/i, '.webp') : '/images/fv_bg.webp'}" type="image/webp">
                        <img src="${typeInfo.imagePath ? '/' + typeInfo.imagePath : '/images/fv_bg.png'}" alt="${typeInfo.name}" class="act-img" style="${imgStyle}" loading="eager">
                    </picture>
                </div>
                <div class="act-detail-content">
                    <div class="act-meta" style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span class="act-category" style="font-size: 0.85rem; font-weight: 800; color: var(--color-primary); letter-spacing: 0.05em; text-transform: uppercase;">${typeInfo.emoji || '🎲'} ${typeInfo.badge}</span>
                        <span class="act-badge-text ${typeInfo.badgeClass || 'offline'}" style="font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 50px; background-color: var(--color-primary-light); color: var(--color-primary-hover);">${typeInfo.badgeClass === 'online' ? 'オンライン開催' : 'リアル開催'}</span>
                    </div>
                    <h1 class="act-card-title" style="font-size: 2rem; font-weight: 900; margin-bottom: 12px; line-height: 1.3;">${typeInfo.name}</h1>
                    <p class="act-subtitle" style="font-size: 1.1rem; color: var(--color-primary-hover); font-weight: 800; margin-top: -4px; margin-bottom: 20px;">${typeInfo.subtitle || ''}</p>
                    <p class="act-desc" style="font-size: 1.02rem; line-height: 1.7; color: var(--color-text-muted); margin-bottom: 30px;">${typeInfo.desc}</p>
                    
                    <!-- Quick Info Grid -->
                    <div class="act-quick-info" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 24px; margin-bottom: 30px; background-color: var(--color-bg-primary); padding: 24px; border-radius: var(--radius-md); border: 1px solid rgba(62, 50, 42, 0.03);">
                        <div class="info-item">
                            <span class="info-icon">💴</span>
                            <div class="info-text-wrapper">
                                <span class="info-label">参加費</span>
                                <span class="info-val font-highlight">${typeInfo.fee || ''}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">📍</span>
                            <div class="info-text-wrapper">
                                <span class="info-label">開催場所</span>
                                <span class="info-val" style="font-size:0.92rem; font-weight:700;">${typeInfo.badgeClass === 'online' ? 'オンライン(Zoom)' : '新宿・北千住エリア（申込後に詳細をご案内）'}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">💼</span>
                            <div class="info-text-wrapper">
                                <span class="info-label">持ち物</span>
                                <span class="info-val">${typeInfo.items || 'なし'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 上部CTAジャンプボタン -->
                    <div class="act-jump-action" style="margin-top: -10px; margin-bottom: 30px; display: flex; justify-content: flex-start;">
                        <a href="#schedules-section" class="cta-button primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; font-size: 0.95rem; border-radius: var(--radius-sm); font-weight: 800; text-decoration: none; width: auto; box-shadow: var(--shadow-sm);">
                            <span>📅 開催スケジュールを確認する</span>
                            <span class="arrow" style="font-weight: 900;">↓</span>
                        </a>
                    </div>
                    
                    <div style="border-top: 1px dashed rgba(62, 50, 42, 0.1); margin: 30px 0;"></div>

                    <!-- 1-Column Content Stack (Vertical, Widescreen Optimized) -->
                    <div class="act-detail-stack" style="display: flex; flex-direction: column; gap: 35px;">
                        
                        <div class="act-recommend" style="background: var(--color-bg-white); border: 1px solid rgba(62, 50, 42, 0.05); padding: 30px; border-radius: var(--radius-md);">
                            <h2 class="act-sub-heading" style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">🎯 こんな方におすすめ</h2>
                            <ul class="recommend-list" style="margin: 0; padding-left: 20px;">
                                ${recommendHtml}
                            </ul>
                        </div>

                        <div class="inner-detail-block" style="background: var(--color-bg-primary); padding: 30px; border-radius: var(--radius-md);">
                            <h2 class="act-sub-heading" style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">📖 イベント詳細</h2>
                            <p class="inner-detail-text" style="font-size: 0.98rem; line-height: 1.75; color: var(--color-text-muted);">${typeInfo.details || ''}</p>
                        </div>

                        <div class="inner-detail-block" style="background: var(--color-bg-white); border: 1px solid rgba(62, 50, 42, 0.05); padding: 30px; border-radius: var(--radius-md);">
                            <h2 class="act-sub-heading" style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">⏰ 当日の流れ</h2>
                            <p class="inner-detail-text" style="font-size: 0.98rem; line-height: 1.75; color: var(--color-text-muted);">${typeInfo.flow || ''}</p>
                        </div>

                        <div class="inner-detail-block" style="background: var(--color-bg-white); border: 1px solid rgba(62, 50, 42, 0.05); padding: 30px; border-radius: var(--radius-md);">
                            <h2 class="act-sub-heading" style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">⚠️ 注意事項</h2>
                            <ul class="recommend-list notes-list" style="margin: 0; padding-left: 20px;">
                                ${notesHtml}
                            </ul>
                        </div>

                        <div class="inner-detail-block" style="background: var(--color-bg-white); border: 1px solid rgba(62, 50, 42, 0.05); padding: 30px; border-radius: var(--radius-md);">
                            <h2 class="act-sub-heading" style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">⭐ 参加者の声</h2>
                            <div class="reviews-container">
                                ${reviewsHtml}
                            </div>
                        </div>

                        <div class="card-schedules" id="schedules-section" style="background: var(--color-bg-white); border: 1px solid rgba(62, 50, 42, 0.05); padding: 30px; border-radius: var(--radius-md);">
                            <h2 class="card-schedules-title" style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">📅 近日開催予定</h2>
                            <ul class="card-schedules-list" style="list-style: none; padding: 0; margin: 0; margin-bottom: 20px;">
                                ${scheduleHtml}
                            </ul>
                            <div style="display: flex; justify-content: center; margin-top: 20px;">
                                <a href="/reservation/?event=${key}" class="cta-button primary" style="padding: 12px 24px; font-size: 1rem; font-weight: 800; border-radius: var(--radius-sm); text-align: center; width: 100%; max-width: 320px; box-shadow: var(--shadow-sm); text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                                    <span>日程を選んで<br class="sp-only">参加を申し込む</span>
                                    <span class="arrow">→</span>
                                </a>
                            </div>
                        </div>

                        ${typeInfo.relatedColumns && typeInfo.relatedColumns.length > 0 ? `
                        <div class="related-columns-area" style="background: var(--color-bg-white); border: 1px solid rgba(62, 50, 42, 0.05); padding: 30px; border-radius: var(--radius-md);">
                            <h2 class="related-title" style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">💡 関連コラム</h2>
                            <div class="related-links-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px;">
                                ${relatedBlogsHtml}
                            </div>
                        </div>
                        ` : ''}

                        ${relatedBlogHtml}
                    </div>

                    <div style="border-top: 1px dashed rgba(62, 50, 42, 0.1); margin: 40px 0 30px 0;"></div>
                    
                    <div class="act-actions" style="display: flex; justify-content: center;">
                        <a href="/reservation/?event=${key}" class="cta-button primary" style="padding: 18px 40px; font-size: 1.1rem; font-weight: 800; border-radius: var(--radius-sm); text-align: center; width: 100%; max-width: 500px; box-shadow: var(--shadow-md); transition: var(--transition-smooth); text-decoration: none;">
                            <span>日程を選んで<br class="sp-only">参加を申し込む</span>
                            <span class="arrow">→</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- 全デバイス共通下部固定（Sticky）CTA -->
    <div class="sticky-cta-wrapper">
        <a href="#schedules-section" class="sticky-cta-btn">
            <span>📅 開催日程・空席状況を見る</span>
        </a>
    </div>
    `;

    // Schema.org Event JSON-LD 用の日付設定
    const representativeEvent = futureEvents[0] || { date: "2026/07/05 13:00-16:00", location: "新宿" };
    let parsedStartDate = "2026-07-05T13:00:00+09:00";
    let parsedEndDate = "2026-07-05T16:00:00+09:00";
    
    const dateMatch = representativeEvent.date.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
    if (dateMatch) {
        parsedStartDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${dateMatch[4]}:${dateMatch[5]}:00+09:00`;
        parsedEndDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${dateMatch[6]}:${dateMatch[7]}:00+09:00`;
    }

    const eventJsonLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": typeInfo.name,
        "startDate": parsedStartDate,
        "endDate": parsedEndDate,
        "eventAttendanceMode": typeInfo.badgeClass === 'online' ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "location": typeInfo.badgeClass === 'online' ? {
            "@type": "VirtualLocation",
            "url": "https://meet.google.com/aht-ebnt-abi"
        } : {
            "@type": "Place",
            "name": representativeEvent.location === '新宿' ? "新宿レンタルスペース" : (representativeEvent.location === '北千住' ? "北千住カフェスペース" : "都内レンタルスペース"),
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "東京都",
                "addressRegion": "東京都",
                "addressCountry": "JP"
            }
        },
        "offers": {
            "@type": "Offer",
            "price": typeInfo.fee.includes('500') ? "500" : "0",
            "priceCurrency": "JPY",
            "availability": "https://schema.org/InStock",
            "url": domain + "/reservation/"
        },
        "organizer": {
            "@type": "Person",
            "name": "ゆるボドゲパパ"
        }
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "ホーム", "item": domain + "/" },
            { "@type": "ListItem", "position": 2, "name": "ボードゲーム会紹介", "item": domain + "/events/" },
            { "@type": "ListItem", "position": 3, "name": typeInfo.name, "item": `${domain}/events/${key}/` }
        ]
    };

    // 個別イベント用のタイトルとディスクリプションのマッピング (SEO最適化)
    const eventSeoMeta = {
        catan: {
            title: 'カタンで交渉力を学ぶ会｜東京・初心者歓迎ボードゲーム会',
            description: '「カタン」を東京でやってみたい初心者の方へ。交渉・資源管理・駆け引きをゲームで体験。新宿・北千住エリア開催・一人参加大多数・初回500円・ルール説明あり。'
        },
        communication_skills: {
            title: 'コミュニケーション力をゲームで学ぶ会｜東京・社会人向け無料',
            description: '話す力・聴く力・場の読み方をボードゲームで楽しく鍛える。東京（新宿・北千住）開催の社会人向けコミュニケーションゲーム会。完全無料・初心者・一人参加歓迎。'
        },
        monopoly: {
            title: 'モノポリーで投資を学ぶ会｜東京・初心者歓迎ボードゲーム会',
            description: '「モノポリー」を東京でやってみたい方へ。投資・交渉・お金の流れをゲームで体験。新宿・北千住エリア開催・無料・一人参加大多数・初心者ルール説明あり。'
        },
        cashflow: {
            title: 'お金の流れをゲームで学ぶ会｜東京・投資初心者向けボードゲーム',
            description: '投資・資産形成の考え方をボードゲームで体験。難しいお金の知識がゲームで自然に身につく。東京（新宿・北千住）開催・500円・初心者歓迎・筆記用具と電卓（スマホ可）持参。'
        },
        nisa: {
            title: 'NISAをボードゲームで学ぶ会｜東京・投資初心者歓迎・無料',
            description: '難しそうなNISA・投資の仕組みをボードゲームで楽しく体験。遊びながら資産形成の考え方が身につく。東京（新宿・北千住）開催・完全無料・初心者・一人参加歓迎。'
        }
    };

    const seoMeta = eventSeoMeta[key] || {
        title: `${typeInfo.name}｜東京ボードゲーム会`,
        description: `${typeInfo.subtitle || ''} ${typeInfo.desc.substring(0, 100)}...`
    };

    const detailHtml = renderTemplate(detailContent, {
        title: seoMeta.title,
        description: seoMeta.description,
        canonical: `${domain}/events/${key}/`,
        pathDepth: '../../',
        jsonLd: [organizationJsonLd, eventJsonLd, breadcrumbJsonLd]
    });

    fs.mkdirSync(path.join(distDir, 'events', key), { recursive: true });
    fs.writeFileSync(path.join(distDir, 'events', key, 'index.html'), detailHtml);
    generatedPages.push(`/events/${key}/`);
});

// --------------------------------------------------------------------------
// C. お役立ちコラム（ブログ）ページの書き出し
// --------------------------------------------------------------------------

// 1. ブログ一覧 (/blog)
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

let blogListHtml = '';
Object.keys(categories).forEach(catKey => {
    const cat = categories[catKey];
    let postsCardsHtml = '';
    cat.posts.forEach(post => {
        const thumbBase = getBlogThumbnailBase(post);
        postsCardsHtml += `
            <article class="blog-card">
                <picture>
                    <source srcset="/images/${thumbBase}.webp" type="image/webp">
                    <img src="/images/${thumbBase}.png" alt="${post.title}のイメージ" class="blog-card-thumbnail" loading="lazy">
                </picture>
                <span class="blog-date">${post.date}</span>
                <h4><a href="${post.slug}/" class="blog-title-link">${post.title}</a></h4>
                <p>${post.summary}</p>
                <a href="${post.slug}/" class="blog-more">続きを読む →</a>
            </article>
        `;
    });

    blogListHtml += `
        <div class="blog-category-group" style="margin-bottom: 40px;">
            <h3 class="category-heading" style="font-size: 1.35rem; font-weight: 800; margin-bottom: 20px; color: var(--color-text-main); border-left: 4px solid var(--color-primary); padding-left: 12px;">📂 ${cat.name}</h3>
            <div class="blog-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
                ${postsCardsHtml}
            </div>
        </div>
    `;
});

const blogIndexContent = `
<section id="blog" class="page-section active animate-fade-in">
    <div class="container-inner">
        <h2 class="section-title">お役立ちコラム</h2>
        <p class="section-subtitle">ボードゲームの魅力や、学び・コミュニケーションに役立つ記事をお届けします。</p>
        
        <div id="blog-container">
            ${blogListHtml}
        </div>
    </div>
</section>
`;

const blogIndexHtml = renderTemplate(blogIndexContent, {
    title: 'ボードゲームで学ぶコラム一覧｜東京ボードゲーム会',
    description: 'カタン・モノポリー・NISA・キャッシュフローゲームなど、ボードゲームで仕事や投資に役立つスキルを学ぶコラム集。初心者向けの攻略・楽しみ方も紹介。',
    canonical: domain + '/blog/',
    pathDepth: '../',
    jsonLd: [
        organizationJsonLd,
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": domain + "/" },
                { "@type": "ListItem", "position": 2, "name": "お役立ちコラム", "item": domain + "/blog/" }
            ]
        }
    ]
});
fs.mkdirSync(path.join(distDir, 'blog'), { recursive: true });
fs.writeFileSync(path.join(distDir, 'blog', 'index.html'), blogIndexHtml);
generatedPages.push('/blog/');

// 2. 個別ブログ詳細 (/blog/[slug])
BLOG_POSTS.forEach((post, index) => {
    const prevPost = index > 0 ? BLOG_POSTS[index - 1] : null;
    const nextPost = index < BLOG_POSTS.length - 1 ? BLOG_POSTS[index + 1] : null;

    let prevNextHtml = '';
    if (prevPost || nextPost) {
        prevNextHtml = `
        <div class="blog-navigation" style="display: flex; justify-content: space-between; gap: 20px; margin-top: 50px; border-top: 1px dashed rgba(62, 50, 42, 0.1); padding-top: 25px;">
            ${prevPost ? `<a href="/blog/${prevPost.slug}/" style="font-weight: 700; color: var(--color-primary-hover); text-decoration: none; font-size: 0.9rem;">← 前の記事: ${prevPost.title.substring(0, 15)}...</a>` : '<div></div>'}
            ${nextPost ? `<a href="/blog/${nextPost.slug}/" style="font-weight: 700; color: var(--color-primary-hover); text-decoration: none; font-size: 0.9rem;">次の記事: ${nextPost.title.substring(0, 15)}... →</a>` : '<div></div>'}
        </div>
        `;
    }

    const blogDetailContent = `
    <article class="page-section active animate-fade-in" style="max-width: 800px; margin: 0 auto;">
        <div class="container-inner">
            <div style="margin-bottom: 20px;">
                <a href="/blog/" class="cta-button secondary" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 0.9rem; border-radius: var(--radius-sm); border: 1px solid rgba(62, 50, 42, 0.1);"><span class="arrow">←</span> コラム一覧へ戻る</a>
            </div>

            <div class="blog-detail-wrapper" style="background-color: var(--color-bg-white); border-radius: var(--radius-lg); padding: 40px; box-shadow: var(--shadow-md); border: 1px solid rgba(62, 50, 42, 0.04);">
                <div class="blog-detail-header" style="margin-bottom: 30px;">
                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                        <span class="blog-date" style="font-size: 0.85rem; color: var(--color-text-light); font-weight: 700;">${post.date}</span>
                        <span style="font-size: 0.78rem; font-weight: 800; padding: 3px 10px; background-color: var(--color-primary-light); color: var(--color-primary-hover); border-radius: 50px;">${post.categoryName}</span>
                    </div>
                    <h1 style="font-size: 2rem; font-weight: 900; color: var(--color-text-main); line-height: 1.35; margin-bottom: 0;">${post.title}</h1>
                </div>

                <div class="blog-detail-body" style="font-size: 1.02rem; line-height: 1.8; color: var(--color-text-muted); display: flex; flex-direction: column; gap: 20px;">
                    ${post.content}
                </div>

                ${prevNextHtml}
            </div>
        </div>
    </article>
    `;

    const dateParts = post.date.split('.');
    const isoDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;

    const blogJsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.summary,
        "datePublished": isoDate,
        "dateModified": isoDate,
        "author": {
            "@type": "Person",
            "name": "ゆるボドゲパパ"
        },
        "publisher": {
            "@type": "Organization",
            "name": "東京ボードゲーム会",
            "logo": {
                "@type": "ImageObject",
                "url": domain + "/images/tokyo_logo_color.png?v=2"
            }
        },
        "image": domain + "/images/ogp-main.png"
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "ホーム", "item": domain + "/" },
            { "@type": "ListItem", "position": 2, "name": "お役立ちコラム", "item": domain + "/blog/" },
            { "@type": "ListItem", "position": 3, "name": post.title, "item": `${domain}/blog/${post.slug}/` }
        ]
    };

    // 個別ブログ記事用のタイトルとディスクリプションのマッピング (SEO最適化)
    const blogSeoMeta = {
        'catan-beginner-tips': {
            title: 'カタン初心者が最初に知るべき3つのコツ｜東京ボードゲーム会',
            description: '「カタンってどうやって勝つの？」という初心者向けに、序盤の資源配置・交渉のコツ・避けるべきミスを解説。東京のカタン会主催者が実体験をもとに紹介。'
        },
        'nisa-board-game': {
            title: 'NISAをボードゲームで学ぶ方法｜初心者でもわかる投資の入口',
            description: '難しそうなNISAも、ボードゲームで体験すると仕組みが自然に理解できます。東京で開催するNISAボードゲーム会の主催者が、初心者向けに分かりやすく解説。'
        },
        'cashflow-game': {
            title: 'ボードゲームでお金の流れを学ぶ方法｜社会人向け入門ガイド',
            description: '投資・資産形成の考え方をゲームで体験する方法を解説。難しい金融知識がゲームを通じて自然に身につく理由と、東京で参加できるボードゲーム会を紹介。'
        },
        'haa-tte-iu-game': {
            title: 'はぁっていうゲームの魅力と非言語対話｜東京ボードゲーム会',
            description: '声と表情だけで感情を伝える「はぁっていうゲーム」の魅力を解説。大人が本気で笑い合い、非言語コミュニケーションを楽しく鍛えられると評判です。東京で開催中の初心者歓迎ボードゲーム会で、仕事帰りの社会人も気軽に体験できます。'
        },
        'katakanashi': {
            title: 'カタカナーシのルールと表現力の鍛え方｜東京ボードゲーム会',
            description: 'カタカナ語を日本語だけで説明するゲーム「カタカナーシ」を解説。言葉の制限が表現力や説明力を鍛える知的トレーニングになります。東京の社会人向けボードゲーム会でも大人気で、初心者でも大笑いしながら脳をフル回転できます。'
        },
        'monopoly-capitalism': {
            title: 'モノポリーで学ぶ資本主義と投資の基本｜東京ボードゲーム会',
            description: '世界中で愛される「モノポリー」から学ぶ投資の基本や複利の戦術を解説。ゲームを通じて現実のビジネスや交渉力に役立つ知性を身につけられます。東京で開催中の初心者歓迎ボードゲーム会で、多くの社会人がワイワイ楽しくプレイしています。'
        },
        'board-game-friends': {
            title: '社会人の友達作りとボードゲーム会の効果｜東京ボードゲーム会',
            description: '仕事以外の繋がりが少ない社会人に、ボードゲーム会が最高の友達作りの場になる理由を解説。ゲームという共通テーマがあるため初対面でも自然に打ち解けられます。東京（新宿・北千住）で初心者でも安心して馴染めるコミュニティを紹介。'
        },
        'brain-refresh': {
            title: 'ボードゲームがもたらす脳のリフレッシュ効果｜東京ボードゲーム会',
            description: 'スマホやパソコンによるデジタル疲労に、アナログボードゲームがもたらす極上の脳リフレッシュ効果を解説。対面での知的スリルが脳をクリエイティブに刺激します。東京で開催中の初心者歓迎ボードゲーム会で、社会人も心地よいリラックスを。'
        },
        'beginner-guide-tokyo': {
            title: '失敗しない東京のボードゲーム会の選び方｜東京ボードゲーム会',
            description: '「常連ばかりで入りづらい？」と不安な初心者に向け、東京で失敗しないボードゲーム会の選び方を伝授。マナーや禁止事項、ルール説明の有無など3つのチェックポイントを解説。社会人でも一人で安心して参加できるアットホームな会を紹介。'
        },
        'negotiation-skills': {
            title: 'ボードゲームでビジネスに必要な交渉力を磨く｜東京ボードゲーム会',
            description: '交渉力や資金配分など、現実の仕事に役立つビジネススキルがボードゲームで鍛えられる理由を解説。ノーリスクで主体的な決断を繰り返せる有用性を紹介します。東京で開催中の初心者歓迎ボードゲーム会で、社会人も遊びながらスキルアップ。'
        }
    };

    const seoMeta = blogSeoMeta[post.slug] || {
        title: `${post.title}｜東京ボードゲーム会`,
        description: post.summary
    };

    const detailHtml = renderTemplate(blogDetailContent, {
        title: seoMeta.title,
        description: seoMeta.description,
        canonical: `${domain}/blog/${post.slug}/`,
        pathDepth: '../../',
        jsonLd: [organizationJsonLd, blogJsonLd, breadcrumbJsonLd]
    });

    fs.mkdirSync(path.join(distDir, 'blog', post.slug), { recursive: true });
    fs.writeFileSync(path.join(distDir, 'blog', post.slug, 'index.html'), detailHtml);
    generatedPages.push(`/blog/${post.slug}/`);
});

// --------------------------------------------------------------------------
// D. sitemap.xml & robots.txt & OGP画像の作成
// --------------------------------------------------------------------------

// 1. sitemap.xml
let sitemapUrlsHtml = '';
generatedPages.forEach(p => {
    sitemapUrlsHtml += `  <url>
    <loc>${domain}${p}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === '/' ? '1.0' : (p.split('/').length <= 3 ? '0.8' : '0.5')}</priority>
  </url>\n`;
});

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrlsHtml}</urlset>`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent, 'utf8');
console.log('sitemap.xml generated successfully!');

// 2. robots.txt
const robotsContent = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;
fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsContent, 'utf8');
console.log('robots.txt generated successfully!');

console.log('Build completed successfully!');
console.log(`Generated ${generatedPages.length} pages in dist/ directory.`);
