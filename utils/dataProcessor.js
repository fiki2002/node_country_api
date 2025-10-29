function getRandomMultiplier() {
        return Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
}

function calculateEstimatedGDP(population, exchangeRate) {
        if (!population || !exchangeRate) return null;
        const multiplier = getRandomMultiplier();
        return (population * multiplier) / exchangeRate;
}

module.exports = {
        getRandomMultiplier,
        calculateEstimatedGDP
};