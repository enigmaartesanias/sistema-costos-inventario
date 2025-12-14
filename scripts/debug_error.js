import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/VITE_DATABASE_URL="?([^"\n\r]+)"?/);
const DATABASE_URL = dbUrlMatch ? dbUrlMatch[1] : null;

const sql = neon(DATABASE_URL);

const queries = [
    `CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150)
    )` // Simplified to test
];

async function run() {
    try {
        await sql(queries[0]);
        console.log("Success");
    } catch (e) {
        fs.writeFileSync('error_log.txt', e.toString() + "\n" + e.stack);
        console.log("Error written to error_log.txt");
    }
}

run();
