# Shopee Shop Scraper

This is a Node.js script using Puppeteer and Stealth Plugin to scrape product data from a Shopee shop page.

## Prerequisites

- Node.js installed.
- Internet connection.

## Installation

1. Open your terminal in this directory:
   ```bash
   cd shopee-scraper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run the script with your target Shopee Shop URL (e.g., the "Search" or "Products" page of the shop):

```bash
node scrape-shopee.js "https://shopee.vn/shop/xxxxxxxx/search"
```

OR

```bash
node scrape-shopee.js "https://shopee.vn/ur_shop_name"
```

## Output

The script will generate a `products.json` file in the same directory containing:

- `name`: Product Name
- `price`: Price as a number
- `main_image_url`: Image URL
- `link`: Product detail link
- `category`: Defaulted to "uncategorized"

## Troubleshooting

- **No products found**: Shopee selectors change frequently. If you see 0 products, the class names in `scrape-shopee.js` (inside `page.evaluate`) might need updating. Check the browser console or inspect element on Shopee to find new selectors for `[data-sqe="name"]` or `.shopee-search-item-result__item`.
- **Captcha**: If a captcha appears, you might need to solve it manually in the opened browser window (since `headless: false` is set).
