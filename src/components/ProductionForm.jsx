import React, { useState, useEffect } from 'react';
import sql from '../services/neon';
import { Save, Loader2, Check, Upload, Image as ImageIcon, X } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const METALES = ['Plata', 'Alpaca', 'Bronce', 'Oro'];
const TIPOS = ['Anillo', 'Arete', 'Collar', 'Pulsera', 'Dije'];

export default function ProductionForm({ editingItem, onSuccess, onCancelEdit }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [formData, setFormData] = useState({
        // Datos del Producto
        nombre_producto: '',
        metal: 'Plata',
        tipo_producto: 'Anillo',
        precio_venta: '',
        foto_url: '',

        // Datos de Producción
        cantidad_producida: 1,

        // Costos
        costo_materiales: '',
        horas_trabajo: '',
        costo_hora: '25.00',
        costo_herramientas: '',
        otros_gastos: '',

        observaciones: ''
    });

    // Cargar datos al editar
    useEffect(() => {
        if (editingItem) {
            setFormData({
                nombre_producto: editingItem.nombre_producto || '',
                metal: editingItem.metal || 'Plata',
                tipo_producto: editingItem.tipo_producto || 'Anillo',
                precio_venta: editingItem.precio_venta || '',
                foto_url: editingItem.foto_url || '',

                cantidad_producida: editingItem.cantidad_producida || 1,

                costo_materiales: editingItem.costo_materiales || '',
                horas_trabajo: editingItem.horas_trabajo || '',
                costo_hora: editingItem.costo_hora || '25.00',
                costo_herramientas: editingItem.costo_herramientas || '',
                otros_gastos: editingItem.otros_gastos || '',
                observaciones: editingItem.observaciones || ''
            });
            setPreviewUrl(editingItem.foto_url || null);
            setImageFile(null); // Clear any previously selected file when loading an item
        } else {
            // Reset si se cancela o inicia nuevo
            setFormData({
                nombre_producto: '',
                metal: 'Plata',
                tipo_producto: 'Anillo',
                precio_venta: '',
                foto_url: '',
                cantidad_producida: 1,
                costo_materiales: '',
                horas_trabajo: '',
                costo_hora: '25.00',
                costo_herramientas: '',
                otros_gastos: '',
                observaciones: ''
            });
            setPreviewUrl(null);
            setImageFile(null);
        }
    }, [editingItem]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
        setSuccess(false);

        try {
            // 0. Subir imagen si existe
            let finalFotoUrl = formData.foto_url;
            if (imageFile) {
                const storageRef = ref(storage, `productos/${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                finalFotoUrl = await getDownloadURL(storageRef);
            }

            let idProducto;

            if (editingItem) {
                // MODO EDICIÓN
                idProducto = editingItem.id_producto;

                // 1. Actualizar Producto
                await sql(
                    `UPDATE productos SET 
                        nombre_producto = $1, metal = $2, tipo_producto = $3, precio_venta = $4, foto_url = $5 
                     WHERE id_producto = $6`,
                    [
                        formData.nombre_producto,
                        formData.metal,
                        formData.tipo_producto,
                        formData.precio_venta || 0,
                        finalFotoUrl,
                        idProducto
                    ]
                );

                // 2. Actualizar Producción
                await sql(
                    `UPDATE produccion_taller SET
                        cantidad_producida = $1, costo_materiales = $2, horas_trabajo = $3, 
                        costo_hora = $4, costo_herramientas = $5, otros_gastos = $6
                     WHERE id_produccion = $7`,
                    [
                        formData.cantidad_producida,
                        formData.costo_materiales || 0,
                        formData.horas_trabajo || 0,
                        formData.costo_hora || 0,
                        formData.costo_herramientas || 0,
                        formData.otros_gastos || 0,
                        editingItem.id_produccion
                    ]
                );

            } else {
                // MODO CREACIÓN
                const nombreFinal = formData.nombre_producto || `${formData.tipo_producto} de ${formData.metal}`;

                // 1. Insertar Producto
                const productoResult = await sql(
                    `INSERT INTO productos (nombre_producto, metal, tipo_producto, precio_venta, stock, foto_url)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING id_producto`,
                    [
                        nombreFinal,
                        formData.metal,
                        formData.tipo_producto,
                        formData.precio_venta || 0,
                        formData.cantidad_producida,
                        finalFotoUrl
                    ]
                );
                idProducto = productoResult[0].id_producto;

                // 2. Insertar Producción
                await sql(
                    `INSERT INTO produccion_taller 
                    (id_producto, cantidad_producida, costo_materiales, horas_trabajo, costo_hora, costo_herramientas, otros_gastos)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        idProducto,
                        formData.cantidad_producida,
                        formData.costo_materiales || 0,
                        formData.horas_trabajo || 0,
                        formData.costo_hora || 0,
                        formData.costo_herramientas || 0,
                        formData.otros_gastos || 0
                    ]
                );
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                if (onSuccess) onSuccess(); // Notificar al padre para recargar lista
            }, 1000);

        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className={`card border-t-4 ${editingItem ? 'border-amber-500' : 'border-purple-500'}`}>
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {editingItem ? 'Editar Producción' : 'Registrar Producción'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {editingItem ? 'Modifica los datos del registro seleccionado.' : 'Ingresa los costos reales de fabricación para calcular tu ganancia exacta.'}
                        </p>
                    </div>
                    {editingItem && (
                        <button
                            onClick={onCancelEdit}
                            className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full"
                        >
                            <X size={14} /> Cancelar Edición
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Sección 1: Producto */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                            Datos del Producto
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Metal</label>
                                <select
                                    name="metal"
                                    className="input-field text-sm py-1"
                                    value={formData.metal}
                                    onChange={handleChange}
                                >
                                    {METALES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo</label>
                                <select
                                    name="tipo_producto"
                                    className="input-field text-sm py-1"
                                    value={formData.tipo_producto}
                                    onChange={handleChange}
                                >
                                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre (Opcional)</label>
                                <input
                                    type="text"
                                    name="nombre_producto"
                                    className="input-field text-sm py-1"
                                    placeholder={`Ej: ${formData.tipo_producto} de ${formData.metal} con Piedra`}
                                    value={formData.nombre_producto}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Subida de Imagen */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Imagen del Producto</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="text-gray-400 w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            id="image-upload"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className="cursor-pointer inline-flex items-center gap-2 text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition"
                                        >
                                            <Upload size={14} />
                                            {previewUrl ? 'Cambiar' : 'Subir Imagen'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Ventas y Cantidad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Cantidad</label>
                            <input
                                type="number"
                                name="cantidad_producida"
                                min="1"
                                className="input-field font-bold text-sm py-1"
                                value={formData.cantidad_producida}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Precio Venta (S/)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="precio_venta"
                                className="input-field text-sm py-1"
                                value={formData.precio_venta}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Sección 3: Costos (El Corazón) */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
                            Costos de Fabricación
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Materiales */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">Materiales (S/)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="costo_materiales"
                                    className="input-field bg-white text-sm py-1"
                                    placeholder="0.00"
                                    value={formData.costo_materiales}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Mano de Obra */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">Horas</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    name="horas_trabajo"
                                    className="input-field bg-white text-sm py-1"
                                    placeholder="0.0"
                                    value={formData.horas_trabajo}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">Costo Hora</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="costo_hora"
                                    className="input-field bg-white text-sm py-1"
                                    value={formData.costo_hora}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Gastos */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">Herramientas</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="costo_herramientas"
                                    className="input-field bg-white text-sm py-1"
                                    placeholder="0.00"
                                    value={formData.costo_herramientas}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-xs font-medium text-gray-700">Otros Gastos</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="otros_gastos"
                                    className="input-field bg-white text-sm py-1"
                                    placeholder="0.00"
                                    value={formData.otros_gastos}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`btn-primary w-full flex justify-center items-center gap-2 text-lg py-4 transition-all ${success
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                : editingItem
                                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                                    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : success ? (
                                <>
                                    <Check /> {editingItem ? '¡Actualizado!' : '¡Guardado!'}
                                </>
                            ) : (
                                <>
                                    <Save size={20} /> {editingItem ? 'Actualizar Producción' : 'Guardar Producción'}
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
