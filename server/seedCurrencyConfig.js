const mongoose = require('mongoose');
const CurrencyConfig = require('./models/CurrencyConfig');
require('dotenv').config({ path: './.env' });


const seedCurrencyConfig = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        await CurrencyConfig.deleteMany({});

        const trxConfig = {
            currency: 'TRX',
            minDeposit: 10,
            maxDeposit: 10000,
            minWithdrawal: 50,
            maxWithdrawal: 5000,
            allowDeposit: true,
            allowWithdrawal: true,
        };

        await CurrencyConfig.create(trxConfig);

        console.log('Default currency configuration seeded successfully.');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding currency configuration:', error);
        mongoose.connection.close();
    }
};

seedCurrencyConfig();
