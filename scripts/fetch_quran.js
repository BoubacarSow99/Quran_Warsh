const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://api.alquran.cloud/v1';
const HAFS_EDITION = 'quran-tajweed';
const ARABIC_EDITION = 'quran-simple-clean';

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'data');
const OUT_FILE = path.join(ASSETS_DIR, 'quran.json');

// Ensure output directory exists
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

function fetchJson(url) {
    try {
        // Use curl to bypass Node.js networking/IPv6 issues in this environment
        const stdout = execSync(`curl -sSf "${url}"`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });
        const json = JSON.parse(stdout);
        if (json.code !== 200) {
            throw new Error(`API Error: ${json.status} for ${url}`);
        }
        return json.data;
    } catch (e) {
        throw new Error(`Fetch error for ${url}: ${e.message}`);
    }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('Fetching Surah list...');
    const surahs = fetchJson(`${BASE_URL}/surah`);
    
    const result = {
        surahs: surahs,
        surahDetails: {}
    };

    console.log(`Starting download of ${surahs.length} surahs using curl...`);
    
    for (let i = 1; i <= 114; i++) {
        process.stdout.write(`Fetching Surah ${i}... `);
        try {
            let detail = fetchJson(`${BASE_URL}/surah/${i}/${HAFS_EDITION}`);
            result.surahDetails[i] = detail;
            console.log('OK (Hafs)');
        } catch (e) {
            console.warn(`Hafs failed (${e.message}), trying fallback...`);
            try {
                let detail = fetchJson(`${BASE_URL}/surah/${i}/${ARABIC_EDITION}`);
                result.surahDetails[i] = detail;
                console.log('OK (Fallback)');
            } catch (fallbackErr) {
                console.error(`Failed BOTH for surah ${i}`, fallbackErr.message);
                process.exit(1);
            }
        }
        await sleep(200);
    }

    console.log(`Successfully fetched all ${Object.keys(result.surahDetails).length} Surahs.`);
    
    console.log(`Writing to ${OUT_FILE}...`);
    fs.writeFileSync(OUT_FILE, JSON.stringify(result));
    
    const stats = fs.statSync(OUT_FILE);
    console.log(`Bundle generated successfully: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});
