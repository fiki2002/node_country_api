
require('dotenv').config();

const express = require('express');
const pool = require('./config/db');
const countriesRouter = require('./routes/countries');

const app = express();

app.use(express.json());
app.use('/countries', countriesRouter);


app.get('/status', async (req, res) => {
        try {
                const connection = await pool.getConnection();
                await connection.ping();
                connection.release();

                res.json({ message: 'Server running and database connected' });

        } catch (error) {
                console.log(`Here is it: ${error}`)
                res.status(500).json({ error: 'Database connection failed' });
        }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
});