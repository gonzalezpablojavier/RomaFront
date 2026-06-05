// AddColaboradorModal.tsx
import React, { useState } from 'react';

// Ajusta la interfaz Colaborador a tu modelo real
interface Colaborador {
  id: number;
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
  colaboradorID: number;
}

// Props para el modal de crear un nuevo colaborador
interface AddColaboradorModalProps {
  isOpen: boolean;                // Controla si el modal está abierto
  onClose: () => void;            // Función para cerrar el modal
  onAddColaborador: (colaborador: Colaborador) => void; 
  empresaId: string;              // ID de la empresa al que se asociará el colaborador
  areas: string[];                // Lista de áreas posibles (opcional)
}

const AddColaboradorModal: React.FC<AddColaboradorModalProps> = ({
  isOpen,
  onClose,
  onAddColaborador,
  empresaId,
  areas,
}) => {
  const [error, setError] = useState('');

  // Definimos un estado inicial para el nuevo colaborador
  const [nuevoColaborador, setNuevoColaborador] = useState<Colaborador>({
    id: 0,
    nombre: '',
    apellido: '',
    email: '',
    fechaNacimiento: '',
    miFamilia: '',
    direccion: '',
    localidad: '',
    sucursal: '',
    area: '',
    cuil: '',
    foto: '',
    empresaId: '',
    nombreUsuario: '',
    password: '',
    colaboradorID: 0,
  });

  const handleColaboradorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNuevoColaborador({
      ...nuevoColaborador,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Asignamos el empresaId proveniente de las props
      const colaboradorData = {
        ...nuevoColaborador,
        empresaId,
      };

      // Llamamos a la función que viene por props (onAddColaborador)
      onAddColaborador(colaboradorData);

      // Limpiamos el formulario
      setNuevoColaborador({
        id: 0,
        nombre: '',
        apellido: '',
        email: '',
        fechaNacimiento: '',
        miFamilia: '',
        direccion: '',
        localidad: '',
        sucursal: '',
        area: '',
        cuil: '',
        foto: '',
        empresaId: '',
        nombreUsuario: '',
        password: '',
        colaboradorID: 0,
      });

      // Cerramos el modal
      onClose();
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setError('El nombre de usuario ya existe. Por favor, elige otro.');
      } else {
        setError('Error al añadir colaborador');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Añadir Nuevo Colaborador</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={nuevoColaborador.nombre}
                onChange={handleColaboradorChange}
                className="w-full p-2 border rounded focus:border-yellow-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={nuevoColaborador.apellido}
                onChange={handleColaboradorChange}
                className="w-full p-2 border rounded focus:border-yellow-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={nuevoColaborador.email}
                onChange={handleColaboradorChange}
                className="w-full p-2 border rounded focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1">Fecha Nacimiento</label>
              <input
                type="date"
                name="fechaNacimiento"
                value={nuevoColaborador.fechaNacimiento}
                onChange={handleColaboradorChange}
                className="w-full p-2 border rounded focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1">Área</label>
              <select
                name="area"
                value={nuevoColaborador.area}
                onChange={handleColaboradorChange}
                className="w-full p-2 border rounded focus:border-yellow-500 focus:outline-none"
              >
                <option value="">Seleccionar Área</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1">Sucursal</label>
              <select
                name="sucursal"
                value={nuevoColaborador.sucursal}
                onChange={handleColaboradorChange}
                className="w-full p-2 border rounded focus:border-yellow-500 focus:outline-none"
              >
                <option value="">Seleccionar Sucursal</option>
                <option value="MDP">MDP</option>
                <option value="Otra">Otra Sucursal</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">CUIL</label>
              <input
                type="text"
                name="cuil"
                value={nuevoColaborador.cuil}
                onChange={handleColaboradorChange}
                className="w-full p-2 border rounded focus:border-yellow-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Usuario</label>
              <input
                type="text"
                name="nombreUsuario"
                value={nuevoColaborador.nombreUsuario}
                onChange={handleColaboradorChange}
                className="w-full p-2 border rounded focus:border-yellow-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                value={nuevoColaborador.password}
                onChange={handleColaboradorChange}
                className="w-full p-2 border rounded focus:border-yellow-500 focus:outline-none"
                required
              />
            </div>
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
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Añadir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddColaboradorModal;
