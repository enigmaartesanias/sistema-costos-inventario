import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Error al iniciar sesión: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="card max-w-md w-full py-10 px-8 shadow-xl">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Iniciar Sesión</h2>

                {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            className="input-field bg-blue-50/30"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="input-field pr-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-700 transition"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            disabled={loading}
                            type="submit"
                            className="btn-primary w-full text-lg shadow-blue-200/50"
                        >
                            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-500">
                            ¿No tienes cuenta? <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">Regístrate aquí</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
