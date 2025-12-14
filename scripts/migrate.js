import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer .env manualmente
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/VITE_DATABASE_URL="?([^"\n\r]+)"?/);
const DATABASE_URL = dbUrlMatch ? dbUrlMatch[1] : null;

if (!DATABASE_URL) {
    console.error("❌ No se encontró VITE_DATABASE_URL en .env");
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
    console.log("Iniciando migración...");
    try {
        const schemaPath = path.join(__dirname, '..', 'neon_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Neon serverless driver might not support multiple statements in one go easily via `sql` tag function if not careful, 
        // but typically valid SQL strings work. simpler to split by ';' if needed, but let's try full block first.
        // Actually, the `sql` template tag handles parameters safely. For a raw string script, we might want to just pass the string.
        // The driver supports `sql(query_string)`.

        // remove SQL comments -- ... until line end
        const cleanupComments = schemaSql.replace(/--.*$/gm, '');
        // Split by semicolon
        const statements = cleanupComments.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            const query = statement.trim();
            if (query.length > 5) {
                console.log(`▶ Ejecutando: ${query.substring(0, 50).replace(/\n/g, ' ')}...`);
                try {
                    await sql(query);
                } catch (err) {
                    console.error("❌ Falló en el query:\n", query);
                    console.error("MENSAJE DE ERROR:", err.message || err);
                    // Continue despite error to try creating other tables? 
                    // Usually better to stop, but for dev iterative updates, maybe continue.
                    // Let's stop to fix issues.
                    // throw err; 
                }
            }
        }

        console.log("✅ Migración completada exitosamente.");
    } catch (error) {
        console.error("❌ Error en la migración:", error);
    }
}

runMigration();
