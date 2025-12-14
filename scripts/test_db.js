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

console.log("URL longitud:", DATABASE_URL ? DATABASE_URL.length : 0);

const sql = neon(DATABASE_URL);

async function test() {
    try {
        const result = await sql`SELECT 1 as val`;
        console.log("✅ Conexión exitosa, resultado:", result);
    } catch (e) {
        console.error("❌ Fallo:", e);
    }
}

test();
