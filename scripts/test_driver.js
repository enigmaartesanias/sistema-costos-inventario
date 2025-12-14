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

async function run() {
    try {
        console.log("Testing sql(query)...");
        // await sql("SELECT 1"); // This failed

        console.log("Testing sql`query`...");
        await sql`SELECT 1`;
        console.log("✅ sql`...` works");

        console.log("Testing sql(query_string_var) - how?");
        const q = "SELECT 1";
        // await sql`${q}`; // This would parameterize 'SELECT 1' which is invalid SQL 'SELECT $1'

        // Try manual construction if exposed?
        // Or checks if sql.query exists?
        if (typeof sql.query === 'function') {
            console.log("Testing sql.query(q)...");
            await sql.query(q);
            console.log("✅ sql.query(...) works");
        } else {
            console.log("❌ sql.query does not exist");
            // maybe I can trick it: sql([q])?
            await sql([q]);
            console.log("✅ sql([q]) works");
        }

    } catch (e) {
        console.error("Failed:", e.toString());
    }
}

run();
