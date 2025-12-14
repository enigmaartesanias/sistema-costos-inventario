-- Esquema Actualizado: Producción y Costos Reales

-- 1. Tabla: productos (Producto Terminado - Stock y Venta)
-- Costos NO van aquí. Solo info de venta.
DROP TABLE IF EXISTS productos CASCADE;
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(150) NOT NULL,
    metal VARCHAR(50), -- Plata, Alpaca, Bronce
    tipo_producto VARCHAR(50), -- Anillo, Arete, Collar, Pulsera
    precio_venta NUMERIC(10, 2),
    stock INTEGER DEFAULT 0,
    foto_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla: produccion_taller (Corazón del Taller - Costos Reales)
-- Registro histórico de cada lote fabricado y sus costos específicos.
DROP TABLE IF EXISTS produccion_taller CASCADE;
CREATE TABLE produccion_taller (
    id_produccion SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES productos(id_producto),
    fecha_produccion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cantidad_producida INTEGER NOT NULL,
    
    -- Costos (Manuales)
    costo_materiales NUMERIC(10, 2) DEFAULT 0, -- Plata, piedras, insumos
    
    -- Mano de Obra
    horas_trabajo NUMERIC(5, 2) DEFAULT 0,
    costo_hora NUMERIC(10, 2) DEFAULT 0,
    costo_mano_obra NUMERIC(10, 2) GENERATED ALWAYS AS (horas_trabajo * costo_hora) STORED,
    
    -- Gastos Taller
    costo_herramientas NUMERIC(10, 2) DEFAULT 0, -- Desgaste
    otros_gastos NUMERIC(10, 2) DEFAULT 0, -- Luz, gas, lijas
    
    -- Cálculos Totales
    costo_total_produccion NUMERIC(10, 2) GENERATED ALWAYS AS (
        costo_materiales + 
        (horas_trabajo * costo_hora) + 
        costo_herramientas + 
        otros_gastos
    ) STORED,
    
    costo_unitario NUMERIC(10, 2) GENERATED ALWAYS AS (
        CASE WHEN cantidad_producida > 0 THEN
            (costo_materiales + (horas_trabajo * costo_hora) + costo_herramientas + otros_gastos) / cantidad_producida
        ELSE 0 END
    ) STORED
);

-- Indices para búsquedas rápidas
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_produccion_producto ON produccion_taller(id_producto);
CREATE INDEX idx_produccion_fecha ON produccion_taller(fecha_produccion);
