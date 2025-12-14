import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
    connectionString: import.meta.env.VITE_DATABASE_URL,
});

// Wrapper para que sql('SELECT...') funcione igual que pool.query('SELECT...')
// Esto devuelve { rows, rowCount, ... } pero simplificaremos para devolver rows directamente si se quiere,
// o mantener el comportamiento estándar de pg. 
// Para ser compatible con el código que escribí (expecting rows directly in .then or await), revisaré.
// En PurchaseForm hice: const [provResult] = await... 
// Si uso neon serverless driver, pool.query devuelve un objeto Result.
// Ajustaré para devolver `result.rows` para facilitar el uso.

const sql = async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows;
};

export default sql;
