import React, { useState } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, Loader, Check } from 'lucide-react';

export default function ImageUploader({ onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            const storageRef = ref(storage, `productos/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);

            setUploadedUrl(url);
            if (onUploadComplete) {
                onUploadComplete(url);
            }
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            alert("Error al subir la imagen");
            setPreview(null);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Producto</label>
            <div className="flex items-center space-x-4">
                <label className="cursor-pointer flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-sm px-4 py-2 hover:bg-gray-50 transition w-full sm:w-auto h-32 border-dashed">
                    {uploading ? (
                        <Loader className="animate-spin text-purple-600" />
                    ) : preview ? (
                        <img src={preview} alt="Preview" className="h-full object-contain" />
                    ) : (
                        <div className="text-center text-gray-500">
                            <Upload className="mx-auto h-8 w-8 mb-1" />
                            <span className="text-xs">Subir foto</span>
                        </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                </label>

                {uploadedUrl && (
                    <div className="text-green-600 flex items-center text-sm">
                        <Check className="w-4 h-4 mr-1" />
                        Listo
                    </div>
                )}
            </div>
        </div>
    );
}
