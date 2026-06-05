import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;
const normas = [
  { id: 1, descripcion: 'Nos orientamos al cliente' },
  { id: 2, descripcion: 'Comunicamos(preguntamos)' },
  { id: 3, descripcion: '80/20' },
  { id: 4, descripcion: 'Somos protagonistas' },
  { id: 5, descripcion: 'Al problema solución y plazo' },
  { id: 6, descripcion: 'Nos ponemos objetivos' },
  { id: 7, descripcion: 'Agendamos' },
  { id: 8, descripcion: 'Confianza' },
  { id: 9, descripcion: 'Actitud' },
  { id: 10, descripcion: 'Capacidad de trabajo' },
  { id: 11, descripcion: 'Conocimiento' },
];

interface Colaborador {
  colaboradorID: number;
  nombre: string;
  apellido: string;
  area: string;
}

interface FeedbackData {
  colaboradorID: number;
  colaboradorIDDestino: number;
  normaID: number;
  tipo: 'felicitacion' | 'revision';
  empresaId :  string;
  motivo: string;
}

interface FeedbackEnviado {
  [key: number]: {
    felicitacion: boolean;
    revision: boolean;
  };
}


const FeedbackColaborador: React.FC = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Colaborador[]>([]);
  const [selectedColaboradorDestino, setSelectedColaboradorDestino] = useState<Colaborador | null>(null);
  const [selectedNorma, setSelectedNorma] = useState<string>('');
  const [mensaje, setMensaje] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [colaboradorLogueadoID, setColaboradorLogueadoID] = useState<number | null>(null);
  const [felicitacionesDisponibles, setFelicitacionesDisponibles] = useState<number | null>(null);
  const [resetNorma, setResetNorma] = useState(false);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [feedbackEnviado, setFeedbackEnviado] = useState<FeedbackEnviado>({});


  useEffect(() => {


    const storedEmpresa = localStorage.getItem('l_empresa_id');
    if (storedEmpresa) {
      setEmpresaId(storedEmpresa);
      fetchColaboradores(storedEmpresa);
    }



    const user = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;
  
    const loggedInColaboradorID = user
    if (loggedInColaboradorID) {
      const id = parseInt(loggedInColaboradorID, 10);
      setColaboradorLogueadoID(id);
        if (storedEmpresa) {
        fetchFelicitacionesDisponibles(id, storedEmpresa);
        fetchFeedbackEnviado(id, storedEmpresa);
      }
    }
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filteredSuggestions = colaboradores.filter(colaborador => 
        `${colaborador.nombre} ${colaborador.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
          // Si el searchTerm coincide exactamente con un colaborador, no mostramos sugerencias
    if (filteredSuggestions.some(col => 
      `${col.nombre} ${col.apellido}`.toLowerCase() === searchTerm.toLowerCase()
    )) {
      setSuggestions([]);
    } else {
      setSuggestions(filteredSuggestions);
    }
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, colaboradores]);


  const fetchFeedbackEnviado = async (colaboradorID: number, empresaId: string) => {
    try {
      const response = await axios.get(`${API_URL}/feedback/enviado/${colaboradorID}`, {
        headers: { 'x-empresa-id': empresaId }
      });
      if (response.data.ok === 1) {
        setFeedbackEnviado(response.data.data);
      } else {
        console.error('Error al obtener feedback enviado:', response.data);
      }
    } catch (error) {
      console.error('Error al obtener feedback enviado:', error);
    }
  };


  const fetchColaboradores = async (empresaId:string) => {
    try {
      const response = await axios.get<{ ok: number; data: Colaborador[] }>(`${API_URL}/usuarios-registrados`,{
        headers: { 'x-empresa-id': empresaId }
      });
      if (response.data.ok === 1 && Array.isArray(response.data.data)) {
        setColaboradores(response.data.data);
      } else {
        console.error('La respuesta de colaboradores no es válida:', response.data);
        setColaboradores([]);
      }
    } catch (error) {
      console.error('Error al obtener colaboradores:', error);
      setColaboradores([]);
    }
  };

  const fetchFelicitacionesDisponibles = async (colaboradorID: number,empresaId:string) => {
    try {
      const response = await axios.get(`${API_URL}/feedback/felicitaciones-disponibles/${colaboradorID}`,
        {   headers: { 'x-empresa-id': empresaId }}
      );
      if (response.data.ok === 1) {
        setFelicitacionesDisponibles(response.data.data.disponibles);
      } else {
        console.error('Error al obtener felicitaciones disponibles:', response.data);
      }
    } catch (error) {
      console.error('Error al obtener felicitaciones disponibles:', error);
    }
  };

  const handleSelectColaborador = (colaborador: Colaborador) => {
    setSelectedColaboradorDestino(colaborador);
    setSearchTerm(`${colaborador.nombre} ${colaborador.apellido}`);
    setSuggestions([]);

  };

  const handleFeedbackSubmit = async (tipo: 'felicitacion' | 'revision') => {
    if (!colaboradorLogueadoID) {
      setIsError(true);
      setMensaje('Error: No se pudo identificar al colaborador logueado.');
      return;
    }

    if (!selectedColaboradorDestino || !selectedNorma) {
      setIsError(true);
      setMensaje('Por favor, seleccione un colaborador destinatario y una norma antes de enviar el feedback.');
      return;
    }
    if (!motivo.trim()) {
      setIsError(true);
      setMensaje('Por favor, ingrese un motivo para el feedback.');
      return;
    }
     
       // Verificación adicional para asegurarnos de que selectedColaboradorDestino no sea null
       if (colaboradorLogueadoID === selectedColaboradorDestino.colaboradorID) {
        setIsError(true);
        setMensaje('No puedes enviarte un Reconocimiento o revisión a ti mismo.');
        return;
      }

    if (feedbackEnviado[selectedColaboradorDestino.colaboradorID]) {
      setIsError(true);
      setMensaje('Ya has enviado feedback a este colaborador este mes.');
      return;
    }

  
    if (!selectedColaboradorDestino || !selectedNorma) {
      setIsError(true);
      setMensaje('Por favor, seleccione un colaborador destinatario y una norma antes de enviar el feedback.');
      return;
    }

    if (tipo === 'felicitacion' && felicitacionesDisponibles !== null && felicitacionesDisponibles <= 0) {
      setIsError(true);
      setMensaje('No tienes felicitaciones disponibles este mes.');
      return;
    }

    setIsError(false);
    try {
      const feedbackData: FeedbackData = {
        colaboradorID: colaboradorLogueadoID,
        colaboradorIDDestino: selectedColaboradorDestino.colaboradorID,
        normaID: Number(selectedNorma),
        tipo: tipo,
        empresaId : empresaId,
        motivo: motivo
      };
      const response = await axios.post(`${API_URL}/feedback`, feedbackData,{
        headers: { 'x-empresa-id': empresaId }
      });
      setMensaje(`Enviado exitosamente`);
      // Actualizar felicitaciones disponibles si fue una felicitación
      if ((tipo === 'revision'||tipo === 'felicitacion') && felicitacionesDisponibles !== null) {
        setFelicitacionesDisponibles(felicitacionesDisponibles - 1);
      }

      setFeedbackEnviado({
        ...feedbackEnviado,
        [selectedColaboradorDestino.colaboradorID]: {
          ...feedbackEnviado[selectedColaboradorDestino.colaboradorID],
          [tipo]: true
        }
      });
      // Limpiar el formulario
      setSelectedColaboradorDestino(null);
      setSearchTerm('');
      setSelectedNorma('');
      setMotivo('');
    } catch (error) {
      setIsError(true);
      if (axios.isAxiosError(error)) {
        setMensaje(`Error al enviar feedback: ${error.response?.data?.message || error.message}`);
      } else {
        setMensaje('Error desconocido al enviar feedback');
      }
    }
  };

  return (
    <div className="flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Reconocer/Reforzar</h2>
        
        {felicitacionesDisponibles !== null && (
          <div className="mb-4 text-center">
            <span className="font-semibold">Disponibles este mes: </span>
            <span className={`font-bold ${felicitacionesDisponibles > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {felicitacionesDisponibles}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Colaborador</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escriba el nombre del colaborador"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-60 overflow-auto">
                {suggestions.map((colaborador) => (
                  <li
                    key={colaborador.colaboradorID}
                    onClick={() => handleSelectColaborador(colaborador)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {colaborador.nombre} {colaborador.apellido} - {colaborador.area}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Habitos</label>
            <select
              value={selectedNorma}
              onChange={(e) => setSelectedNorma(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione un hábito</option>
              {normas.map((norma) => (
                <option key={norma.id} value={norma.id}>{norma.descripcion}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escriba el motivo de su Felicitacion/Refuerzo"
              rows={3}
              required
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => handleFeedbackSubmit('felicitacion')}
              className={`flex-1 cursor-pointer px-4 py-2 text-center rounded-full border-2 border-green-700 text-green-700 font-bold transition-all duration-300 hover:bg-green-700 hover:text-white ${felicitacionesDisponibles === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={felicitacionesDisponibles === 0}
            >
              Felicitar
            </button>
            <button
              onClick={() => handleFeedbackSubmit('revision')}
              className="flex-1 cursor-pointer px-4 py-2 text-center rounded-full border-2 border-blue-850 text-blue-850 font-bold transition-all duration-300 hover:bg-blue-850 hover:text-red"
            >
              Reforzar
            </button>
          </div>
        </div>

        {mensaje && (
          <div className={`mt-4 p-3 rounded-md ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackColaborador;