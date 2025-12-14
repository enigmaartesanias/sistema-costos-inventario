import React, { useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const sql = neon(import.meta.env.VITE_DATABASE_URL);

export default function InventoryInitialForm({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [generatedQR, setGeneratedQR] = useState(null);

    const [formData, setFormData] = useState({
        codigo_manual: '',
        nombre_producto: '',
        categoria: 'Anillo',
        material: 'Plata',
        unidad: 'Unidad',
        origen: 'Comprado',
        costo_unitario: '',
        precio_venta: '',
        precio_mayorista: '',
        precio_oferta: '',
        stock_inicial: '',
        stock_minimo: '5',
        foto_url: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Generar preview de código QR cuando cambia el código manual
        if (name === 'codigo_manual' && value) {
            setGeneratedQR(`PROD-${value.toUpperCase()}-XXXXX`);
        } else if (name === 'codigo_manual' && !value) {
            setGeneratedQR(null);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Subir imagen si existe
            let finalFotoUrl = '';
            if (imageFile) {
                const storageRef = ref(storage, `inventario/${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                finalFotoUrl = await getDownloadURL(storageRef);
            }

            // 2. Insertar en base de datos (trigger generará el QR completo)
            const result = await sql`
                INSERT INTO inventario_productos (
                    codigo_manual,
                    nombre_producto,
                    categoria,
                    material,
                    unidad,
                    origen,
                    costo_unitario,
                    precio_venta,
                    precio_mayorista,
                    precio_oferta,
                    stock_actual,
                    stock_minimo,
                    foto_url,
                    activo
                ) VALUES (
                    ${formData.codigo_manual.toLowerCase()},
                    ${formData.nombre_producto},
                    ${formData.categoria},
                    ${formData.material},
                    ${formData.unidad},
                    ${formData.origen},
                    ${parseFloat(formData.costo_unitario)},
                    ${parseFloat(formData.precio_venta)},
                    ${formData.precio_mayorista ? parseFloat(formData.precio_mayorista) : null},
                    ${formData.precio_oferta ? parseFloat(formData.precio_oferta) : null},
                    ${parseInt(formData.stock_inicial)},
                    ${parseInt(formData.stock_minimo)},
                    ${finalFotoUrl},
                    true
                )
                RETURNING codigo_qr
            `;

            const codigoQRGenerado = result[0]?.codigo_qr;

            setSuccess(true);

            // Mostrar mensaje de éxito
            setTimeout(() => {
                alert(`✅ Producto guardado exitosamente\n\nCódigo QR: ${codigoQRGenerado}`);
            }, 100);

            // Limpiar formulario
            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    codigo_manual: '',
                    nombre_producto: '',
                    categoria: 'Anillo',
                    material: 'Plata',
                    unidad: 'Unidad',
                    origen: 'Comprado',
                    costo_unitario: '',
                    precio_venta: '',
                    precio_mayorista: '',
                    precio_oferta: '',
                    stock_inicial: '',
                    stock_minimo: '5',
                    foto_url: ''
                });
                setPreviewUrl(null);
                setImageFile(null);
                setGeneratedQR(null);

                if (onSuccess) onSuccess();
            }, 1500);

        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Stock Inicial</h2>
                    <p className="text-gray-500 mt-1">Registra productos que ya tienes en stock</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Sección 1: Identificación del Producto */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                            <span>1</span>
                            <span>Identificación del Producto</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código Manual para Agrupar *
                                </label>
                                <input
                                    type="text"
                                    name="codigo_manual"
                                    value={formData.codigo_manual}
                                    onChange={handleChange}
                                    required
                                    maxLength={20}
                                    pattern="[a-z0-9]+"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: anip120, ani05, pulp80"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Solo letras minúsculas y números. Agrupa productos similares (ej: anip120 = anillos plata S/120)
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre del Producto *
                                </label>
                                <input
                                    type="text"
                                    name="nombre_producto"
                                    value={formData.nombre_producto}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: Anillo de Plata Simple"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                                <select
                                    name="categoria"
                                    value={formData.categoria}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Anillo">Anillo</option>
                                    <option value="Arete">Arete</option>
                                    <option value="Collar">Collar</option>
                                    <option value="Pulsera">Pulsera</option>
                                    <option value="Dije">Dije</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                                <select
                                    name="material"
                                    value={formData.material}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Plata">Plata</option>
                                    <option value="Alpaca">Alpaca</option>
                                    <option value="Bronce">Bronce</option>
                                    <option value="Oro">Oro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unidad</label>
                                <select
                                    name="unidad"
                                    value={formData.unidad}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Unidad">Unidad</option>
                                    <option value="Par">Par</option>
                                    <option value="Juego">Juego</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Origen</label>
                                <input
                                    type="text"
                                    value="Comprado"
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Stock inicial solo para productos comprados</p>
                            </div>
                        </div>

                        {/* Preview código QR */}
                        {generatedQR && (
                            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-200">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">🔖</div>
                                    <div>
                                        <p className="text-sm text-gray-600">Código QR que se generará:</p>
                                        <p className="text-lg font-mono font-bold text-purple-700">{generatedQR}</p>
                                        <p className="text-xs text-gray-500 mt-1">El número final se asignará automáticamente</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sección 2: Costos y Precios */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                            <span>2</span>
                            <span>Costos y Precios</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Costo Unitario (S/.) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="costo_unitario"
                                    value={formData.costo_unitario}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Precio Venta (S/.) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="precio_venta"
                                    value={formData.precio_venta}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Precio Mayorista (S/.) - Opcional
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="precio_mayorista"
                                    value={formData.precio_mayorista}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Opcional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Precio Oferta (S/.)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="precio_oferta"
                                    value={formData.precio_oferta}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 3: Stock y Control */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                            <span>3</span>
                            <span>Stock y Control</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stock Inicial *
                                </label>
                                <input
                                    type="number"
                                    name="stock_inicial"
                                    value={formData.stock_inicial}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Cantidad actual en almacén"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stock Mínimo
                                </label>
                                <input
                                    type="number"
                                    name="stock_minimo"
                                    value={formData.stock_minimo}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 4: Imagen */}
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                            <span>4</span>
                            <span>Imagen del Producto</span>
                        </h3>

                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-amber-100 file:text-amber-700
                                    hover:file:bg-amber-200"
                            />
                            {previewUrl && (
                                <div className="mt-4">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full max-w-xs rounded-lg shadow-md"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '⏳ Guardando...' : success ? '✅ ¡Guardado!' : '💾 Guardar Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
