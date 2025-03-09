const express = require('express');
const https = require('https');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/check-brand/:brand', async (req, res) => {
    const brand = req.params.brand; // Get brand from URL
    if (!brand) return res.status(400).json({ error: 'Brand name is required' });

    const url = `https://crueltyfree.peta.org/?s=${encodeURIComponent(brand)}`;

    fetchHtml(url)
        .then((html) => {
            if (!html) {
                return res.status(500).json({ error: 'Failed to fetch data' });
            }

            // Check if brand is not found
            if (html.includes('post-not-found')) {
                return res.status(404).json({ message: 'Company not found' });
            }

            // Extract cruelty-free policy text
            const policyMatch = html.match(/<div class="testing-policy-text">(.*?)<\/div>/s);
            const policyText = policyMatch
                ? policyMatch[1].replace(/<\/?[^>]+(>|$)/g, '').trim()
                : 'No testing policy text found';

            res.json({ brand, brandUrl: url, policyText });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
        });
});

// Helper function to fetch HTML content
function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                let data = '';

                if (res.statusCode !== 200) {
                    return reject(new Error(`Request failed. Status code: ${res.statusCode}`));
                }

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    resolve(data);
                });
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
