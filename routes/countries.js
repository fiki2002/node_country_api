const express = require('express')
const router = express.Router();
const pool = require('../config/db');

async function validateExternalAPIs() {
        try {
                const axios = require('axios');
                await axios.get('https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies');
                await axios.get('https://open.er-api.com/v6/latest/USD');
                return true;
        } catch (error) {
                throw new Error('External data source unavailable');
        }
}

router.get('/', async (req, res) => {
        try {
                const connection = await pool.getConnection();
                const [countries] = await connection.query('SELECT * FROM countries');
                connection.release();

                res.json(countries);
        } catch (error) {
                res.status(500).json({ error: 'Failed to fetch countries' });
        }
})


router.get('/status', async (req, res) => {
        try {
                const connection = await pool.getConnection();

                const [result] = await connection.query(
                        'SELECT COUNT(*) as total_countries, MAX(last_refreshed_at) as last_refreshed_at FROM countries'
                );

                connection.release();

                res.json({
                        total_countries: result[0].total_countries,
                        last_refreshed_at: result[0].last_refreshed_at
                });

        } catch (error) {
                res.status(500).json({ error: 'Failed to fetch status' });
        }
});


router.get('/image', async (req, res) => {
        try {
                const fs = require('fs');
                const path = require('path');

                const imagePath = path.join(__dirname, '../cache/summary.png');

                if (!fs.existsSync(imagePath)) {
                        return res.status(404).json({ error: 'Summary image not found' });
                }

                res.sendFile(imagePath);

        } catch (error) {
                res.status(500).json({ error: 'Failed to serve image' });
        }
});

router.post('/refresh', async (_, res) => {
        try {
                await validateExternalAPIs();

                const axios = require('axios');
                const { calculateEstimatedGDP } = require('../utils/dataProcessor');

                const countriesResponse = await axios.get(
                        'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies'
                );

                const exchangeResponse = await axios.get(
                        'https://open.er-api.com/v6/latest/USD'
                );

                const countries = countriesResponse.data;
                const exchangeRates = exchangeResponse.data.rates;

                const connection = await pool.getConnection();

                for (const country of countries) {
                        const name = country.name;
                        const capital = country.capital || null;
                        const region = country.region || null;
                        const population = country.population;
                        const flagUrl = country.flag || null;

                        let currencyCode = null;
                        if (country.currencies && country.currencies.length > 0) {
                                currencyCode = country.currencies[0].code;
                        }

                        let exchangeRate = null;
                        if (currencyCode && exchangeRates[currencyCode]) {
                                exchangeRate = exchangeRates[currencyCode];
                        }

                        let estimatedGdp = null;
                        if (population && exchangeRate) {
                                estimatedGdp = calculateEstimatedGDP(population, exchangeRate);
                        }

                        try {
                                await connection.query(
                                        `INSERT INTO countries (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           capital = VALUES(capital),
           region = VALUES(region),
           population = VALUES(population),
           currency_code = VALUES(currency_code),
           exchange_rate = VALUES(exchange_rate),
           estimated_gdp = VALUES(estimated_gdp),
           flag_url = VALUES(flag_url),
           last_refreshed_at = CURRENT_TIMESTAMP`,
                                        [name, capital, region, population, currencyCode, exchangeRate, estimatedGdp, flagUrl]
                                );
                        } catch (insertError) {
                                console.log(`Error inserting ${name}:`, insertError.message);
                        }
                }

                connection.release();

                const conn2 = await pool.getConnection();
                const [topCountries] = await conn2.query(
                        'SELECT name, estimated_gdp FROM countries ORDER BY estimated_gdp DESC LIMIT 5'
                );
                conn2.release();

                const { generateSummaryImage } = require('../utils/imageGenerator');
                const timestamp = new Date().toISOString();
                await generateSummaryImage(countries.length, topCountries, timestamp);

                res.json({
                        message: 'Data refreshed successfully and image generated',
                        countriesStored: countries.length
                });

        } catch (error) {
                console.error('Refresh error:', error);
                res.status(503).json({
                        error: 'External data source unavailable',
                        details: error.message
                });
        }
});

router.get('/:name', async (req, res) => {
        try {
                const { name } = req.params;
                const connection = await pool.getConnection();
                const [countries] = await connection.query('SELECT * FROM countries WHERE name = ?', [name]);
                connection.release();

                if (countries.length === 0) {
                        return res.status(404).json({ error: 'Country not found' });
                }

                res.json(countries[0]);
        } catch (error) {
                res.status(500).json({ error: 'Failed to fetch country' });
        }
});


router.delete('/:name', async (req, res) => {
        try {
                const { name } = req.params;
                const connection = await pool.getConnection();

                const [result] = await connection.query(
                        'DELETE FROM countries WHERE name = ?',
                        [name]
                );

                connection.release();

                if (result.affectedRows === 0) {
                        return res.status(404).json({ error: 'Country not found' });
                }

                res.json({
                        message: `${name.cap} deleted successfully`,
                        deletedRows: result.affectedRows
                });

        } catch (error) {
                res.status(500).json({ error: 'Failed to delete country' });
        }
});

router.get('/', async (req, res) => {
        try {
                const { region, currency, sort } = req.query;
                let query = 'SELECT * FROM countries WHERE 1=1';
                const params = [];

                if (region) {
                        query += ' AND region = ?';
                        params.push(region);
                }

                if (currency) {
                        query += ' AND currency_code = ?';
                        params.push(currency);
                }

                if (sort === 'gdp_desc') {
                        query += ' ORDER BY estimated_gdp DESC';
                } else if (sort === 'gdp_asc') {
                        query += ' ORDER BY estimated_gdp ASC';
                } else if (sort === 'population_desc') {
                        query += ' ORDER BY population DESC';
                } else if (sort === 'population_asc') {
                        query += ' ORDER BY population ASC';
                }

                const connection = await pool.getConnection();
                const [countries] = await connection.query(query, params);
                connection.release();

                res.json(countries);
        } catch (error) {
                res.status(500).json({ error: 'Failed to fetch countries' });
        }
});

module.exports = router;
