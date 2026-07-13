const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesToProcess = [
    {
        src: '/Users/katayanagikeisuke/.gemini/antigravity-ide/brain/253febfb-6513-4292-8020-cbf58e296a81/catan_blog_thumbnail_1783909940101.png',
        destName: 'カタン会'
    },
    {
        src: '/Users/katayanagikeisuke/.gemini/antigravity-ide/brain/253febfb-6513-4292-8020-cbf58e296a81/communication_blog_thumbnail_1783909962074.png',
        destName: 'ゲームで学ぶコミュニケーションワークショップ'
    },
    {
        src: '/Users/katayanagikeisuke/.gemini/antigravity-ide/brain/253febfb-6513-4292-8020-cbf58e296a81/monopoly_blog_thumbnail_1783909984519.png',
        destName: 'モノポリー'
    },
    {
        src: '/Users/katayanagikeisuke/.gemini/antigravity-ide/brain/253febfb-6513-4292-8020-cbf58e296a81/cashflow_blog_thumbnail_1783909999365.png',
        destName: 'キャッシュフロー会'
    },
    {
        src: '/Users/katayanagikeisuke/.gemini/antigravity-ide/brain/253febfb-6513-4292-8020-cbf58e296a81/nisa_blog_thumbnail_1783910017449.png',
        destName: 'NISAが学べる投資ゲーム_無料'
    }
];

const destDir = '/Users/katayanagikeisuke/antigravity/lp-project/images';

async function main() {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    for (const img of imagesToProcess) {
        const pngDestPath = path.join(destDir, img.destName + '.png');
        const webpDestPath = path.join(destDir, img.destName + '.webp');
        
        console.log(`Copying PNG to: ${pngDestPath}`);
        fs.copyFileSync(img.src, pngDestPath);
        
        console.log(`Converting to WebP: ${webpDestPath}`);
        await sharp(pngDestPath)
            .webp({ quality: 85 })
            .toFile(webpDestPath);
    }
    console.log('All images processed successfully!');
}

main().catch(err => {
    console.error('Error processing images:', err);
    process.exit(1);
});
