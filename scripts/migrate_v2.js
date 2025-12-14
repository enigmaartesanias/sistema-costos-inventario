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
        nombre VARCHAR(150),
        categoria_metal VARCHAR(50), 
        tipo_producto VARCHAR(50),   
        precio_venta NUMERIC(10, 2),
        precio_compra NUMERIC(10, 2), 
        costo_produccion NUMERIC(10, 2), 
        stock INTEGER DEFAULT 0,
        foto_url TEXT,
        oferta BOOLEAN DEFAULT FALSE,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS servicios (
        id SERIAL PRIMARY KEY,
        nombre_servicio VARCHAR(150) NOT NULL,
        precio NUMERIC(10, 2),
        descripcion TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS proveedores (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        contacto VARCHAR(150),
        rubro VARCHAR(100)
    )`,
    `CREATE TABLE IF NOT EXISTS produccion (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER REFERENCES productos(id),
        materiales_usados TEXT,
        costo_materiales NUMERIC(10, 2),
        costo_mano_obra NUMERIC(10, 2),
        costo_herramientas NUMERIC(10, 2),
        costo_total NUMERIC(10, 2),
        fecha_produccion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        cantidad_producida INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS compras (
        id SERIAL PRIMARY KEY,
        proveedor_id INTEGER REFERENCES proveedores(id),
        producto_id INTEGER REFERENCES productos(id),
        cantidad INTEGER NOT NULL,
        costo_unitario NUMERIC(10, 2),
        fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        observaciones TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        telefono VARCHAR(50),
        saldo_pendiente NUMERIC(10, 2) DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id),
        fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        total NUMERIC(10, 2) DEFAULT 0,
        forma_pago VARCHAR(50),
        impuesto BOOLEAN DEFAULT FALSE
    )`,
    `CREATE TABLE IF NOT EXISTS venta_detalle (
        id SERIAL PRIMARY KEY,
        venta_id INTEGER REFERENCES ventas(id),
        producto_id INTEGER REFERENCES productos(id),
        cantidad INTEGER NOT NULL,
        precio_unitario NUMERIC(10, 2),
        subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
    )`,
    `CREATE TABLE IF NOT EXISTS servicios_realizados (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id),
        servicio_id INTEGER REFERENCES servicios(id),
        precio NUMERIC(10, 2),
        fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id),
        fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        fecha_entrega TIMESTAMP WITH TIME ZONE,
        descripcion TEXT,
        total NUMERIC(10, 2),
        adelanto NUMERIC(10, 2) DEFAULT 0,
        saldo NUMERIC(10, 2) GENERATED ALWAYS AS (total - adelanto) STORED,
        estado VARCHAR(50) DEFAULT 'pendiente'
    )`
];

async function run() {
    console.log("Iniciando migración secuencial...");
    for (const [i, q] of queries.entries()) {
        try {
            console.log(`Ejecutando tabla ${i + 1}...`);
            await sql(q, []); // Trying array trick first as it's cleaner than property if property missing on some versions? 
            // The test said: sql.query(...) works.
            // Let's use sql([q]) first as it mimics tagged template? No.
            // Just use sql(q, [])? No, the error said: use sql.query("SELECT $1", [value], options). 
            // IF I want no params, maybe just sql.query(q)?
            // The test passed with `await sql.query(q)`.
            // So:
            await sql.query(q);
            console.log(`✅ Tabla ${i + 1} OK`);
        } catch (e) {
            console.error(`❌ Error en tabla ${i + 1}:`, e.toString());
            console.error(e.stack);
        }
    }
}

run();
