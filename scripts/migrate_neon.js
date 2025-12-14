import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función simple para leer .env
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '../.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Quitar comillas si existen
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

async function migrate() {
    const env = loadEnv();
    const connectionString = env.VITE_DATABASE_URL;

    if (!connectionString) {
        console.error("❌ VITE_DATABASE_URL no encontrada en .env");
        process.exit(1);
    }

    const pool = new Pool({ connectionString });

    try {
        console.log("🔌 Conectando a Neon...");
        const client = await pool.connect();

        console.log("📄 Leyendo esquema SQL...");
        const schemaPath = path.join(__dirname, '../neon_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("🚀 Ejecutando migración...");
        await client.query(schemaSql);

        console.log("✅ Migración exitosa!");
        client.release();
    } catch (err) {
        console.error("❌ Error en la migración:", err);
    } finally {
        await pool.end();
    }
}

migrate();
