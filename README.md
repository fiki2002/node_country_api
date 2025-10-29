# Country API

A RESTful API that fetches country data from external APIs, stores it in MySQL, and provides CRUD operations with filtering, sorting, and image generation.

## Features

- 🌍 Fetch country data from REST Countries API
- 💱 Get exchange rates from Open ER API
- 💾 Store data in MySQL with caching
- 🔍 Filter by region and currency
- 📊 Sort by GDP and population
- 🖼️ Generate summary images with top countries
- ✅ Full CRUD operations

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/fiki2002/node_country_api
cd country_api
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file** in the root directory
```properties
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=country_api
PORT=3000
```

4. **Create MySQL database and table**
```bash
mysql -u root -p
```

In MySQL:
```sql
CREATE DATABASE country_api;
USE country_api;

CREATE TABLE countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  capital VARCHAR(100),
  region VARCHAR(50),
  population BIGINT NOT NULL,
  currency_code VARCHAR(10),
  exchange_rate DECIMAL(10, 2),
  estimated_gdp DECIMAL(20, 2),
  flag_url VARCHAR(255),
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

5. **Run the server**
```bash
npm start
```

or with nodemon:
```bash
npm install -g nodemon
nodemon server.js
```

## API Endpoints

### 1. Refresh Countries Data
**POST** `/countries/refresh`

Fetches country data from external APIs and stores in database. Generates summary image.

**Response:**
```json
{
  "message": "Data refreshed successfully and image generated",
  "countriesStored": 250
}
```

### 2. Get All Countries
**GET** `/countries`

Returns all countries from database.

**Query Parameters:**
- `region` - Filter by region (e.g., `?region=Africa`)
- `currency` - Filter by currency code (e.g., `?currency=USD`)
- `sort` - Sort by field (e.g., `?sort=gdp_desc`, `gdp_asc`, `population_desc`, `population_asc`)

**Example:**
```
GET /countries?region=Africa&sort=gdp_desc
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": "1600.23",
    "estimated_gdp": "25767448125.2",
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-29T18:55:38.000Z"
  }
]
```

### 3. Get One Country
**GET** `/countries/:name`

Returns a single country by name (case-insensitive).

**Example:**
```
GET /countries/Nigeria
```

**Response:**
```json
{
  "id": 163,
  "name": "Nigeria",
  "capital": "Abuja",
  "region": "Africa",
  "population": 206139587,
  "currency_code": "NGN",
  "exchange_rate": "1446.48",
  "estimated_gdp": "253954227.12",
  "flag_url": "https://flagcdn.com/ng.svg",
  "last_refreshed_at": "2025-10-29T18:55:38.000Z"
}
```

### 4. Delete Country
**DELETE** `/countries/:name`

Deletes a country record.

**Example:**
```
DELETE /countries/Nigeria
```

**Response:**
```json
{
  "message": "Nigeria deleted successfully",
  "deletedRows": 1
}
```

### 5. Get Status
**GET** `/countries/status`

Returns total countries and last refresh timestamp.

**Response:**
```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-29T18:55:38.000Z"
}
```

### 6. Get Summary Image
**GET** `/countries/image`

Returns a PNG image with summary of top 5 countries by GDP.

**Response:** Binary PNG file

## Error Handling

All errors return JSON format:

```json
{
  "error": "Error description",
  "details": "Additional error info (if applicable)"
}
```

### Status Codes

- `200` - Success
- `404` - Country not found
- `500` - Internal server error
- `503` - External API unavailable

## Project Structure

```
country_api/
├── server.js                 # Main server file
├── package.json              # Dependencies
├── .env                      # Environment variables
├── .gitignore                # Git ignore file
├── config/
│   └── db.js                 # Database configuration
├── routes/
│   └── countries.js          # Country routes
├── utils/
│   ├── dataProcessor.js      # Data processing utilities
│   └── imageGenerator.js     # Image generation
├── cache/
│   └── summary.png           # Generated summary image
└── README.md                 # This file
```

## Dependencies

- `express` - Web framework
- `mysql2` - MySQL database driver
- `dotenv` - Environment variable management
- `axios` - HTTP client for external APIs
- `sharp` - Image processing

## External APIs Used

- **Countries Data**: https://restcountries.com/v2/all
- **Exchange Rates**: https://open.er-api.com/v6/latest/USD

## Development

To run in development mode with auto-reload:

```bash
nodemon server.js
```

## Testing

Test the endpoints using Postman, curl, or any HTTP client:

```bash
# Test refresh
curl -X POST http://localhost:3000/countries/refresh

# Test get all
curl http://localhost:3000/countries

# Test get one
curl http://localhost:3000/countries/Nigeria

# Test filter
curl "http://localhost:3000/countries?region=Africa"

# Test status
curl http://localhost:3000/countries/status

# Test image
curl http://localhost:3000/countries/image --output summary.png

# Test delete
curl -X DELETE http://localhost:3000/countries/Nigeria
```

## Deployment


Make sure to:
1. Set environment variables in your hosting platform
2. Create the MySQL database on your hosting
3. Update `.env` with production database credentials

## License

ISC

## Author

Adepitan Oluwatosin

## Notes

- The API is case-insensitive for country names
- Exchange rates are fetched from a free API (rates may vary)
- Estimated GDP is calculated with a random multiplier for demonstration
- Summary images are cached and regenerated only on `/refresh` calls