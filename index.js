const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Change from query parameter to route parameter (/:brand)
app.get('/check-brand/:brand', async (req, res, rej) => {
    const brand = req.params.brand; // Get brand from URL
    if (!brand) return res.status(400).json({ error: 'Brand name is required' });

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    await page.setRequestInterception(true);
    // Intercept the requests to set additional headers
    page.on('request', (request) => {
        request.continue({
            headers: {
                ...request.headers(),
                'Accept-Language': 'en-US,en;q=0.9', // Adding a proper language header
            },
        });
    });
    await page.goto(`https://crueltyfree.peta.org/?s=${encodeURIComponent(brand)}`, {
        waitUntil: 'domcontentloaded',
    });

    // Check if brand is not found
    const notFound = await page.evaluate(() => !!document.querySelector('.post-not-found'));

    if (notFound) {
        await browser.close();
        const error = new Error('Company not found');
        error.status = 404;
        return res.status(error.status).json({ message: error.message });
    }

    // Extract cruelty-free policy text
    const policyText = await page.evaluate(() => {
        const element = document.querySelector('.testing-policy-text');
        return element ? element.innerText.trim() : 'No testing policy text found';
    });

    const brandUrl = page.url();

    await browser.close();
    res.json({ brand, brandUrl, policyText });
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
