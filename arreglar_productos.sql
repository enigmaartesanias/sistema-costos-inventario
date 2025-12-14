-- ============================================================================
-- ARREGLAR TABLA PRODUCTOS - Agregar columnas faltantes
-- ============================================================================

-- Agregar precio_venta si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='productos' AND column_name='precio_venta'
    ) THEN
        ALTER TABLE productos 
        ADD COLUMN precio_venta NUMERIC(10, 2) DEFAULT 0;
        RAISE NOTICE 'Columna precio_venta agregada a productos';
    ELSE
        RAISE NOTICE 'Columna precio_venta ya existe';
    END IF;
END $$;

-- Agregar stock si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='productos' AND column_name='stock'
    ) THEN
        ALTER TABLE productos 
        ADD COLUMN stock INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna stock agregada a productos';
    ELSE
        RAISE NOTICE 'Columna stock ya existe';
    END IF;
END $$;

-- Agregar foto_url si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='productos' AND column_name='foto_url'
    ) THEN
        ALTER TABLE productos 
        ADD COLUMN foto_url TEXT;
        RAISE NOTICE 'Columna foto_url agregada a productos';
    ELSE
        RAISE NOTICE 'Columna foto_url ya existe';
    END IF;
END $$;

-- Agregar activo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='productos' AND column_name='activo'
    ) THEN
        ALTER TABLE productos 
        ADD COLUMN activo BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Columna activo agregada a productos';
    ELSE
        RAISE NOTICE 'Columna activo ya existe';
    END IF;
END $$;

-- Verificar columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos'
ORDER BY ordinal_position;
