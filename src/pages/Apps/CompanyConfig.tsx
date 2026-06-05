import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/apiClient';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { getEmpresaInfo, addColaborador, updateEmpresaInfo, updateColaborador,getUsuariosRegistrados,deleteColaborador,updateColaboradorUserPass   } from '../../config/api_empresa';
import { Password } from '@mui/icons-material';
import EditUserPassModal from './EditUserPassModal'; // A
import { getAreasForEmpresa, getManagerIdsForEmpresa, getManagerAreasForEmpresa } from '../../services/empresaService';
import NotificationModal from './NotificationModal';
import { sendBulkPushNotifications } from '../../services/pushNotificationService';
import ScheduledNotificationModal, { ScheduleNotificationData } from './ScheduledNotificationModal';
import { Clock } from 'lucide-react';
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
interface EmpresaInfo {
  id: number;
  nombre: string;
  email: string;
}

interface EditColaboradorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditColaborador: (colaborador: Colaborador) => void;
    colaborador: Colaborador;
  }

const CompanyConfig = () => {
    const { empresaId } = useParams<{ empresaId: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaInfo | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [error, setError] = useState('');
  const [modo, setModo] = useState<'ver' | 'editar'>('ver');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);
  const [isEditUserPassModalOpen, setIsEditUserPassModalOpen] = useState(false);
  const [managerAreas, setManagerAreas] = useState<{ [key: string]: string }>({});
  const [areas, setAreas] = useState<string[]>([]);
  const [filtroArea, setFiltroArea] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Agrega estos estados en tu CompanyConfig
const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const handleEditUserPass = async (colaboradorID: number, colaborador:Colaborador) => {
    try {
    const updatedColaborador = await updateColaboradorUserPass(colaboradorID, colaborador);
    setColaboradores(colaboradores.map(c => 
      c.colaboradorID === colaboradorID 
        ? { ...c, nombreUsuario: colaborador.nombreUsuario } 
        : c
    ));
    setIsEditUserPassModalOpen(false);
  } catch (error) {
    console.error('Error updating user/pass:', error);
    setError('Error al actualizar usuario/contraseña');
  }
  };



  const handleScheduleNotification = async (scheduleData: ScheduleNotificationData) => {
    try {
      // Aquí deberías hacer una llamada a tu API para guardar la programación
      const response = await apiClient.post(`/scheduled-notifications`, scheduleData);
      
      if (response.data) {
        alert('Notificaciones programadas exitosamente');
      }
      
    } catch (error) {
      console.error('Error al programar notificaciones:', error);
      throw error;
    }
  };
  
const handleSendBulkNotifications = async (title: string, body: string, selectedIds: number[]) => {
  try {
    const { successCount, errorCount } = await sendBulkPushNotifications(
      title,
      body,
      selectedIds,
      empresaId ?? localStorage.getItem('l_empresa_id') ?? undefined,
    );
    alert(`Notificaciones enviadas:\n✅ Exitosas: ${successCount}\n❌ Fallidas: ${errorCount}`);
  } catch (error) {
    console.error('Error en el envío masivo:', error);
    alert('Error al enviar las notificaciones: ' + (error as Error).message);
  }
};

  const handleDeleteColaborador = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este colaborador?')) {
      try {
        await deleteColaborador(id);
        setColaboradores(colaboradores.filter(c => c.colaboradorID !== id));
      } catch (error) {
        console.error('Error deleting collaborator:', error);
        setError('Error al eliminar colaborador');
      }
    }
  };
  
  const openEditUserPassModal = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador);
    setIsEditUserPassModalOpen(true);
  };


  useEffect(() => {
    dispatch(setPageTitle('Configuración de Empresa'));
    if (empresaId) {
      fetchEmpresaInfo(parseInt(empresaId));
      console.log('EmpresaId:', empresaId);
      fetchColaboradores();
      const empresaManagerAreas = getManagerAreasForEmpresa(empresaId);
      setManagerAreas(empresaManagerAreas);
      const empresaAreas = getAreasForEmpresa(empresaId);
      setAreas(empresaAreas);

    }
  }, [dispatch, empresaId]);

  const fetchEmpresaInfo = async (id: number) => {
    try {
      const info = await getEmpresaInfo(id);
      setEmpresaInfo(info);
      setColaboradores(info.colaboradores || []);
    } catch (err) {
      setError('Error al cargar la información de la empresa');
    }
  };

  const fetchColaboradores = async () => {
    try {
      if (empresaId) {
        const response = await getUsuariosRegistrados(empresaId);
        console.log('Respuesta completa:', response);
        
        if (response.ok === 1 && Array.isArray(response.data) && response.data.length > 0) {
          console.log('Primer usuario:', response.data[0]);
  
          const colaboradoresMapeados = response.data.map((usuario) => ({
            id:usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            fechaNacimiento: usuario.fechaNacimiento,
            miFamilia: usuario.miFamilia,
            direccion: usuario.direccion,
            localidad: usuario.localidad,
            sucursal: usuario.sucursal,
            area: usuario.area,
            cuil: usuario.cuil,
            foto: usuario.foto,
            empresaId: usuario.empresaId,
            nombreUsuario: usuario.nombreUsuario, // Usamos email como nombreUsuario
            password:usuario.password,
            colaboradorID:usuario.colaboradorID,
          }));
          
          console.log('Colaboradores mapeados:', colaboradoresMapeados);
          setColaboradores(colaboradoresMapeados);
        } else {
          console.log('No se encontraron colaboradores');
          setColaboradores([]);
        }
      }
    } catch (err) {
      console.error('Error fetching colaboradores:', err);
      setError('Error al cargar los colaboradores');
      setColaboradores([]);
    }
  };

  const handleEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (empresaInfo) {
      setEmpresaInfo({ ...empresaInfo, [e.target.name]: e.target.value });
    }
  };

  const actualizarEmpresa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!empresaInfo) return;
    try {
      const updatedEmpresa = await updateEmpresaInfo(empresaInfo.id, {
        nombre: empresaInfo.nombre,
        email: empresaInfo.email,
      });
      setEmpresaInfo(updatedEmpresa);
      setModo('ver');
    } catch (err) {
      setError('Error al actualizar la información de la empresa');
    }
  };



  const handleLogout = () => {
    // Implement your logout logic here
    // For example:
    // logout();
    navigate('/auth/login');
  };

  const handleAddColaborador = async (newColaborador: Colaborador) => {
    try {
      const addedColaborador = await addColaborador(newColaborador);
      setColaboradores(prevColaboradores => [...prevColaboradores, addedColaborador]);
      setIsAddModalOpen(false);
      // Refetch colaboradores to ensure we have the most up-to-date list
      await fetchColaboradores();
    } catch (error) {
      console.error('Error adding collaborator:', error);
      setError('Error al añadir colaborador');
    }
  };

  const handleEditColaborador = (updatedColaborador: Colaborador) => {
    const updatedColaboradores = colaboradores.map(col => 
      col.id === updatedColaborador.id ? updatedColaborador : col
    );
    setColaboradores(updatedColaboradores);
    setIsEditModalOpen(false);
  };

  const openEditModal = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador);
    console.log(colaborador);
    setIsEditModalOpen(true);
  };

  if (!empresaInfo) {
    return <div>Cargando información de la empresa...</div>;
  }
// Añade esta función antes del return
const filteredColaboradores = colaboradores.filter(colaborador =>
  `${colaborador.nombre} ${colaborador.apellido}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);
  return (
    <div className="flex  min-h-screen">
        {/* Left column */}
      

        <div className="w-1/4 fixed left-0 top-0 h-full bg-gradient-to-t from-[#FDD05B] to-[#FDD05B] p-4 flex flex-col">
        <div className="flex-grow flex flex-col justify-center items-center">
          <div className="w-full max-w-[250px] mb-5">
            <img src="/assets/images/roma.jpeg" alt="roma_logo" className="w-full" />
          </div>
          <h3 className="text-3xl font-bold mb-4 text-center text-white dark:text-black">Bienvenidos a ROMA</h3>
          <p className="text-center text-white dark:text-black">Registra tu empresa y comienza a disfrutar de nuestros servicios</p>
        </div>
        {/* Logout button in the footer of the left column */}
        <div className="mt-auto pt-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-300"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

        {/* Right column - Main content */}
        <div className="w-3/4 ml-[25%] p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Información de la Empresa</h3>
          {modo === 'ver' ? (
            <>
              <p><strong>Nombre:</strong> {empresaInfo.nombre}</p>
              <p><strong>Email:</strong> {empresaInfo.email}</p>
              <button 
                onClick={() => setModo('editar')}
                className="bg-yellow-500 text-white px-4 py-2 rounded mt-2"
              >
                Editar Información
              </button>
            </>
          ) : (
            <form onSubmit={actualizarEmpresa}>
              <div className="mb-4">
                <label htmlFor="nombre" className="block mb-2">Nombre de la Empresa</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={empresaInfo.nombre}
                  onChange={handleEmpresaChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block mb-2">Email de la Empresa</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={empresaInfo.email}
                  onChange={handleEmpresaChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                Actualizar Empresa
              </button>
              <button 
                type="button" 
                onClick={() => setModo('ver')} 
                className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
              >
                Cancelar
              </button>
            </form>
          )}
        </div>

        <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Colaboradores</h3>
          {/* Campo de búsqueda */}
  <div className="relative mb-4">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <input
      type="text"
      placeholder="Buscar por nombre..."
      className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
             
        <div className="relative">

              <div className="overflow-x-auto shadow-md rounded-lg">
                <div className="max-h-[300px] overflow-y-auto">
                    
                  <table className="min-w-full bg-white">
                    <thead className="bg-white border-b-2 border-gray-300">
                      <tr>
                        <th className="py-2 px-4 border-b">Nombre</th>
                        <th className="py-2 px-4 border-b">Area</th>
                        <th className="py-2 px-4 border-b">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(colaboradores) && filteredColaboradores.length > 0 ? (
                        filteredColaboradores.map((colaborador) => (
                          <tr key={colaborador.id}>
                            <td className="py-2 px-4 border-b">{colaborador.nombre} {colaborador.apellido} ({colaborador.colaboradorID}) </td>
                            <td className="py-2 px-4 border-b">{colaborador.area}</td>
                            <td className="py-2 px-4 border-b">
                              <button
                                onClick={() => openEditModal(colaborador)}

                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-2"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => openEditUserPassModal(colaborador)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded mr-2"
                              >
                                Editar Usuario/Contraseña
                              </button>
                              

                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-2 px-4 border-b text-center">No hay colaboradores registrados</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-4 transition duration-300"
           >
              Añadir Nuevo Colaborador
            </button>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-300"
              >
                Programar Notificaciones
              </button>

              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition duration-300"
              >
                Enviar Notificación
              </button>
            </div>
          </div>
</div>

<ScheduledNotificationModal
  isOpen={isScheduleModalOpen}
  onClose={() => setIsScheduleModalOpen(false)}
  colaboradores={colaboradores}
  empresaId={empresaId}
  onScheduleNotification={handleScheduleNotification}
/>

<NotificationModal
  isOpen={isNotificationModalOpen}
  onClose={() => setIsNotificationModalOpen(false)}
  colaboradores={colaboradores}
  onSendNotification={handleSendBulkNotifications}
  filteredColaboradores={filteredColaboradores} // Si estás usando filtrado
/>
<AddColaboradorModal
      isOpen={isAddModalOpen}
      onClose={() => {
        setIsAddModalOpen(false);
        fetchColaboradores(); // Refetch collaborators when closing the modal
      }}
      onAddColaborador={handleAddColaborador}
     
      empresaId={empresaId || ''}
      areas={areas}  // Pass managerAreas to the modal
    />

{selectedColaborador && (
  <>
    <EditColaboradorModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      onEditColaborador={handleEditColaborador}
      colaborador={selectedColaborador}
    />
    <EditUserPassModal
      isOpen={isEditUserPassModalOpen}
      onClose={() => setIsEditUserPassModalOpen(false)}
      onEditUserPass={handleEditUserPass}
      colaborador={selectedColaborador}
    />
  </>
)}
      </div>

 

    </div>
  );
};

const EditColaboradorModal: React.FC<EditColaboradorModalProps> = ({ isOpen, onClose, onEditColaborador, colaborador }) => {
    const [editedColaborador, setEditedColaborador] = useState<Colaborador>(colaborador);
    const [error, setError] = useState('');

    useEffect(() => {
      if (isOpen) {
        setEditedColaborador(colaborador);
      }
    }, [isOpen, colaborador]);
  
    const handleColaboradorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setEditedColaborador({ ...editedColaborador, [e.target.name]: e.target.value });
     
    };
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
       
        const updatedColaborador = await updateColaborador(editedColaborador);
        onEditColaborador(updatedColaborador);
        onClose();
      } catch (err: any) {
        setError('Error al actualizar el colaborador');
      }
    };
  
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
          <h2 className="text-2xl font-semibold mb-4">Editar Colaborador</h2>
          <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="nombre"
              value={editedColaborador.nombre}
              onChange={handleColaboradorChange}
              placeholder="Nombre"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
            />
            <input
              type="text"
              name="apellido"
              value={editedColaborador.apellido}
              onChange={handleColaboradorChange}
              placeholder="Apellido"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
            />
            <input
              type="email"
              name="email"
              value={editedColaborador.email}
              onChange={handleColaboradorChange}
              placeholder="Email"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
            />
            <input
              type="date"
              name="fechaNacimiento"
              value={editedColaborador.fechaNacimiento}
              onChange={handleColaboradorChange}
              placeholder="Fecha de Nacimiento"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
            />
            <input
              type="text"
              name="miFamilia"
              value={editedColaborador.miFamilia}
              onChange={handleColaboradorChange}
              placeholder="Mi Familia"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
            />
            <input
              type="text"
              name="direccion"
              value={editedColaborador.direccion}
              onChange={handleColaboradorChange}
              placeholder="Dirección"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
            />
            <input
              type="text"
              name="localidad"
              value={editedColaborador.localidad}
              onChange={handleColaboradorChange}
              placeholder="Localidad"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
            />
            <select
              name="sucursal"
              value={editedColaborador.sucursal}
              onChange={handleColaboradorChange}
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
            >
              <option value="">Seleccionar Sucursal</option>
              <option value="MDP">MDP</option>

              
              {/* Add more options as needed */}
            </select>
            <select
              name="area"
              value={editedColaborador.area}
              onChange={handleColaboradorChange}
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
            >

              
              <option value="">Seleccionar Área</option>
              <option value="TV">TV</option>
              {/* Add more options as needed */}
            </select>
            <input
              type="text"
              name="cuil"
              value={editedColaborador.cuil}
              onChange={handleColaboradorChange}
              placeholder="CUIL"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
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

interface AddColaboradorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColaborador: (colaborador: Colaborador) => void;
  empresaId: string;
  areas: string[];  // Add this line
}

const AddColaboradorModal: React.FC<AddColaboradorModalProps> = ({ isOpen, onClose, onAddColaborador, empresaId,areas }) => {
  const [nuevoColaborador, setNuevoColaborador] = useState<Colaborador>({
    id:0,
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
    colaboradorID:0,
    
  });
  const [error, setError] = useState('');

  const handleColaboradorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNuevoColaborador({ ...nuevoColaborador, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const colaboradorData = {
        ...nuevoColaborador,
        empresaId,
      };

      if (empresaId === '6') {
        colaboradorData.empresaId = 'default';
        colaboradorData.sucursal = 'MDP';
      }
      const addedColaborador = await addColaborador(colaboradorData);
      onAddColaborador(addedColaborador);
      setNuevoColaborador({
        id:0,
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
        colaboradorID:0,
      });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-semibold mb-4">Añadir Nuevo Colaborador</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="nombre"
              value={nuevoColaborador.nombre}
              onChange={handleColaboradorChange}
              placeholder="Nombre"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
            />
            <input
              type="text"
              name="apellido"
              value={nuevoColaborador.apellido}
              onChange={handleColaboradorChange}
              placeholder="Apellido"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
            />
          
               
        

            <select
              name="area"
              value={nuevoColaborador.area}
              onChange={handleColaboradorChange}
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
            >
                <option value="">Todas las áreas</option>
            {areas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
            </select>
            <input
              type="text"
              name="cuil"
              value={nuevoColaborador.cuil}
              onChange={handleColaboradorChange}
              placeholder="CUIL"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
            />
            <input
              type="text"
              name="nombreUsuario"
              value={nuevoColaborador.nombreUsuario}
              onChange={handleColaboradorChange}
              placeholder="Usuario"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
            />
            <input
              type="password"
              name="password"
              value={nuevoColaborador.password}
              onChange={handleColaboradorChange}
              placeholder="Contraseña"
              className="p-2 border rounded focus:border-yellow-500 focus:outline-none"
              required
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
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Añadir Colaborador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



export default CompanyConfig;