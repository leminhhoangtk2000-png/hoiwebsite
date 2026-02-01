const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// --- CONFIGURATION ---
const TARGET_URL = process.argv[2];

async function autoScroll(page) {
    console.log('Starting auto-scroll...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight > 50000) {
                    clearInterval(timer);
                    resolve();
                }

                // Stop if we haven't detected height change for a while?
                // Just relying on ample scrolling for now.
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                    // reached bottom
                }
            }, 100);

            setTimeout(() => {
                clearInterval(timer);
                resolve();
            }, 30000);
        });
    });
    console.log('Scroll complete.');
}

async function scrapeShopee() {
    if (!TARGET_URL) {
        console.error('Error: Please provide a Shopee URL as an argument.');
        process.exit(1);
    }

    console.log(`Launching browser for: ${TARGET_URL}`);
    console.log('NOTE: A new browser profile "./shopee_profile" will be created/used.');
    console.log('If asked to login, please do so. The session will be saved for next time.');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        userDataDir: path.join(__dirname, 'shopee_profile'), // Persistent profile
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', // Mask automation
            '--window-size=1920,1080'
        ],
        ignoreDefaultArgs: ['--enable-automation'] // Hide "Chrome is being controlled..." bar
    });

    const page = await browser.newPage();

    // Set User Agent to a real Mac Chrome one
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log('Navigating...');
        await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 0 });

        // Check for common blocking titles
        const title = await page.title();
        if (title.includes('Lỗi') || title.includes('Error') || title.includes('403')) {
            console.log('Possible block detected. Please try reloading the page manually in the browser.');
        }

        console.log('Waiting for products (max 5 minutes)...');
        console.log('ACTION REQUIRED: If you see a Login or Captcha, please solve it in the browser window.');

        // Robust wait for products
        try {
            await page.waitForFunction(() => {
                const selectors = [
                    '.shopee-search-item-result__item',
                    '.shop-search-result-view__item',
                    '.col-xs-2-4',
                    'div[data-sqe="item"]'
                ];
                return selectors.some(s => document.querySelectorAll(s).length > 0);
            }, { timeout: 300000 }); // 5m
        } catch (e) {
            console.log('Wait timeout. Attempting to scrape whatever is on screen...');
        }

        await autoScroll(page);
        await new Promise(r => setTimeout(r, 2000));

        console.log('Extracting data...');

        const products = await page.evaluate(() => {
            const results = [];

            // Gather all potential product elements
            const selectors = [
                '.shopee-search-item-result__item',
                '.shop-search-result-view__item',
                '.col-xs-2-4',
                'div[data-sqe="item"]'
            ];

            let items = [];
            for (let sel of selectors) {
                const found = document.querySelectorAll(sel);
                if (found.length > 0) {
                    items = [...found];
                    break;
                }
            }

            items.forEach(item => {
                try {
                    let linkEl = item.querySelector('a');
                    if (!linkEl && item.tagName === 'A') linkEl = item;

                    const link = linkEl ? linkEl.href : null;
                    if (!link) return;

                    // Image
                    const imgEl = item.querySelector('img');
                    let main_image_url = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src')) : null;
                    if (!main_image_url && imgEl && imgEl.style.backgroundImage) {
                        main_image_url = imgEl.style.backgroundImage.slice(5, -2);
                    }
                    // Handle Shopee's placeholder images
                    if (main_image_url && main_image_url.includes('place_holder')) {
                        // try to find real url in other attributes if available
                    }

                    // Name
                    let name = 'Unknown Name';
                    // Try data-sqe
                    const nameEl = item.querySelector('[data-sqe="name"]');
                    if (nameEl) name = nameEl.innerText.trim();

                    // Fallback Name: look for standard multiline titles
                    if (name === 'Unknown Name') {
                        const possibleTitles = item.querySelectorAll('div');
                        for (let div of possibleTitles) {
                            // Shopee titles usually have 2 lines logic, hard to detect by class hash
                            // Just checking length
                            if (div.innerText.length > 10 && !div.innerText.includes('₫')) {
                                name = div.innerText.trim();
                                break;
                            }
                        }
                    }

                    // Price
                    let price = 0;
                    const priceText = item.innerText;
                    // Regex for ₫ 10.000, 10.000đ, 10.000
                    const priceMatch = priceText.match(/([0-9]{1,3}(\.[0-9]{3})*)/);
                    // Note: Simple regex might catch product ID. 
                    // Better to find the one near '₫' or 'đ'
                    const currencyMatch = priceText.match(/[₫đ][\s]*([0-9.,]+)/);
                    if (currencyMatch) {
                        const raw = currencyMatch[1].replace(/\./g, '').replace(/,/g, '');
                        price = parseFloat(raw);
                    }

                    if (link) {
                        results.push({
                            name,
                            price,
                            main_image_url,
                            link,
                            category: 'uncategorized'
                        });
                    }
                } catch (err) { }
            });

            return results;
        });

        console.log(`Found ${products.length} products.`);
        fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
        console.log('Saved data to products.json');

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Keep browser open if we found nothing, for debugging?
        // await browser.close(); 
        console.log('Closing browser...');
        await browser.close();
    }
}

scrapeShopee();
