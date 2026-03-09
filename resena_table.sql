-- ==========================
-- 6. Tabla: Reseña
-- ==========================
CREATE TABLE resena (
    id_resena SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    id_cliente INTEGER, -- Opcional para permitir reseñas anónimas o vincular a cuenta
    nombres_anonimo VARCHAR(150), -- Por si no está logueado
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_resena_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto(id_producto)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_resena_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- Habilitar RLS (Seguridad de Fila)
ALTER TABLE resena ENABLE ROW LEVEL SECURITY;

-- Políticas de Acceso
-- 1. Cualquiera puede ver las reseñas (Lectura pública)
CREATE POLICY "Permitir lectura pública de reseñas" 
ON resena FOR SELECT 
USING (true);

-- 2. Cualquiera puede insertar una reseña (Escritura pública para este MVP)
CREATE POLICY "Permitir inserción pública de reseñas" 
ON resena FOR INSERT 
WITH CHECK (true);
