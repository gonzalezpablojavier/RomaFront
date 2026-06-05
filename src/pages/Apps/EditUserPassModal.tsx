import React, { useState } from 'react';

interface Colaborador {
    id:number;
    nombre: string;
    apellido: string;
    email: string;
    fechaNacimiento: string;
    miFamilia: string;
    direccion: string;
    localidad: string;
    sucursal: string;
    area: string;
    cuil: string;
    foto: string;
    empresaId: string;
    nombreUsuario: string;
    password: string;
    colaboradorID:number;
  }

interface EditUserPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditUserPass: (id: number,colaborador: Colaborador) => void;
  colaborador: Colaborador;
}

const EditUserPassModal: React.FC<EditUserPassModalProps> = ({ isOpen, onClose, onEditUserPass, colaborador }) => {
  const [nombreUsuario, setNombreUsuario] = useState(colaborador.nombreUsuario);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nombreUsuario) {
      setError('El nombre de usuario no puede estar vacío');
      return;
    }
    onEditUserPass(colaborador.id,colaborador);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-4">Editar Usuario y Contraseña</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nombreUsuario" className="block mb-2">Nombre de Usuario</label>
            <input
              type="text"
              id="nombreUsuario"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block mb-2">Nueva Contraseña (dejar en blanco si no se cambia)</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded mr-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserPassModal;