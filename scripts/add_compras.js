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

if (!DATABASE_URL) {
    console.error("❌ No se encontró VITE_DATABASE_URL en .env");
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function addComprasTable() {
    console.log("Intentando crear tabla compras...");
    const query = `
    CREATE TABLE IF NOT EXISTS compras (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER REFERENCES productos(id),
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        costo_unitario NUMERIC(10, 2),
        proveedor VARCHAR(100),
        fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        observaciones TEXT
    );
    `;

    try {
        await sql(query);
        console.log("✅ Tabla 'compras' creada exitosamente.");
    } catch (e) {
        console.error("❌ Error creando tabla compras:", JSON.stringify(e, null, 2));
    }
}

addComprasTable();
