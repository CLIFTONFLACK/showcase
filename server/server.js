require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Mongoose Schemas (matches netlify/functions/api.js)
const DealSchema = new mongoose.Schema({
    id: String,
    companyName: String,
    type: String,
    dateAdded: String,
    dealMode: String,
    isMedinfar: Boolean,
    medinfarCogs: Number,
    royaltyAfterCogs: Boolean,
    dealCurrency: String,
    comparisonCurrency: String,
    transferPrice: Number,
    partnerSellingPrice: Number,
    pricingType: String,
    profitSharePercent: Number,
    overheadRate: Number,
    forecastSales: [Number],
    countryBreakdown: [{
        id: String,
        country: {
            code: String,
            name: String,
            region: String,
            currency: String
        },
        years: [Number]
    }],
    serviceFees: {
        signing: { amount: Number, year: Number },
        approval: { amount: Number, year: Number },
        launch: { amount: Number, year: Number }
    },
    royalties: [{
        tierLimit: Number,
        rate: Number
    }],
    countries: String
}, { strict: false });

const ForecastSchema = new mongoose.Schema({
    id: String,
    name: String,
    entries: [{
        id: String,
        country: {
            code: String,
            name: String,
            region: String,
            currency: String
        }
    }]
}, { strict: false });

const Deal = mongoose.models.Deal || mongoose.model('Deal', DealSchema);
const Forecast = mongoose.models.Forecast || mongoose.model('Forecast', ForecastSchema);

// Reuse the router logic? Just define routes directly here for simplicity
const router = express.Router();

router.get('/deals', async (req, res) => {
    try {
        const deals = await Deal.find({});
        res.json(deals);
    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});

router.post('/deals', async (req, res) => {
    try {
        await Deal.deleteMany({});
        if (req.body.length > 0) {
            await Deal.insertMany(req.body);
        }
        res.json({ success: true, count: req.body.length });
    } catch (error) {
        console.error('Error saving deals:', error);
        res.status(500).json({ error: 'Failed to save deals' });
    }
});

router.get('/forecasts', async (req, res) => {
    try {
        const forecasts = await Forecast.find({});
        res.json(forecasts);
    } catch (error) {
        console.error('Error fetching forecasts:', error);
        res.status(500).json({ error: 'Failed to fetch forecasts' });
    }
});

router.post('/forecasts', async (req, res) => {
    try {
        await Forecast.deleteMany({});
        if (req.body.length > 0) {
            await Forecast.insertMany(req.body);
        }
        res.json({ success: true, count: req.body.length });
    } catch (error) {
        console.error('Error saving forecasts:', error);
        res.status(500).json({ error: 'Failed to save forecasts' });
    }
});

app.use('/api', router);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
