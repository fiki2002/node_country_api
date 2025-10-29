const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateSummaryImage(totalCountries, topCountries, timestamp) {
        try {
                const cacheDir = path.join(__dirname, '../cache');
                if (!fs.existsSync(cacheDir)) {
                        fs.mkdirSync(cacheDir);
                }

                const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#f0f0f0"/>
        
        <!-- Title -->
        <text x="400" y="50" font-size="32" font-weight="bold" text-anchor="middle" fill="#333">
          Country Summary Report
        </text>
        
        <!-- Total Countries -->
        <text x="400" y="100" font-size="20" text-anchor="middle" fill="#666">
          Total Countries: ${totalCountries}
        </text>
        
        <!-- Timestamp -->
        <text x="400" y="130" font-size="14" text-anchor="middle" fill="#999">
          Last Updated: ${timestamp}
        </text>
        
        <!-- Top 5 Header -->
        <text x="50" y="180" font-size="18" font-weight="bold" fill="#333">
          Top 5 Countries by GDP
        </text>
        
        <!-- Country List -->
        ${topCountries.map((country, index) => `
          <text x="70" y="${220 + index * 60}" font-size="14" fill="#333">
            ${index + 1}. ${country.name}
          </text>
          <text x="90" y="${240 + index * 60}" font-size="12" fill="#666">
            GDP: $${parseFloat(country.estimated_gdp).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </text>
        `).join('')}
      </svg>
    `;

                const imagePath = path.join(cacheDir, 'summary.png');
                await sharp(Buffer.from(svg)).png().toFile(imagePath);

                console.log('Image generated successfully at:', imagePath);
                return imagePath;

        } catch (error) {
                console.error('Error generating image:', error);
                throw error;
        }
}

module.exports = { generateSummaryImage };