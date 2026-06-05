import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parse, startOfMonth, endOfMonth, startOfYear, endOfYear, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface Feedback {
  id: number;
  createdAt: string;
  normaID: string;
  tipo: string;
  colaboradorIDDestino: number;
}

interface Colaborador {
  id: string;
  nombre: string;
  apellido: string;
  area: string;
  colaboradorID: number;
  foto: string;
}

interface RankingItem {
  colaboradorID: number;
  nombre: string;
  apellido: string;
  foto: string;
  felicitaciones: number;
  revisiones: number;
  puntaje: number;
}

const Reconocemos: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [rankingAnual, setRankingAnual] = useState<RankingItem[]>([]);
  const [rankingMensual, setRankingMensual] = useState<RankingItem[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(
    format(new Date(), 'MM/yyyy')
  );
  const [fechaInput, setFechaInput] = useState<string>(
    format(new Date(), 'MM/yyyy')
  );
  const [error, setError] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string>('');  
  const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;


  useEffect(() => {
    const storedEmpresa = localStorage.getItem('l_empresa_id');
    if (storedEmpresa) {
      setEmpresaId(storedEmpresa);
      fetchFeedbacks(storedEmpresa);
      fetchColaboradores(storedEmpresa);
    } else {
      setError('No se ha especificado una empresa');
    }
  }, []);


 

  useEffect(() => {
    if (feedbacks.length > 0 && colaboradores.length > 0) {
      calcularRankings();
    }
  }, [feedbacks, colaboradores, fechaSeleccionada]);

  const fetchFeedbacks = async (empresaId:string) => {
    try {
      const response = await axios.get(`${API_URL}/feedback`,{  headers: { 'x-empresa-id': empresaId }});
      setFeedbacks(response.data);
    } catch (error) {
      setError('Error al obtener los feedbacks');
      console.error(error);
    }
  };

  const fetchColaboradores = async (empresaId:string) => {
    try {
      const response = await axios.get(`${API_URL}/usuarios-registrados`,{  headers: { 'x-empresa-id': empresaId }});
      if (response.data.ok === 1 && Array.isArray(response.data.data)) {
        setColaboradores(response.data.data);
      } else {
        console.error('La respuesta de colaboradores no es válida:', response.data);
        setColaboradores([]);
      }
    } catch (error) {
      console.error('Error al obtener los colaboradores:', error);
      setError('Error al obtener los colaboradores');
      setColaboradores([]);
    }
  };

  const calcularRanking = (inicio: Date, fin: Date) => {
    const ranking = colaboradores.map(colaborador => {
      const feedbacksColaborador = feedbacks.filter(feedback => 
        feedback.colaboradorIDDestino === colaborador.colaboradorID &&
        new Date(feedback.createdAt) >= inicio &&
        new Date(feedback.createdAt) <= fin
      );

      const felicitaciones = feedbacksColaborador.filter(f => f.tipo === 'felicitacion').length;
      const revisiones = feedbacksColaborador.filter(f => f.tipo === 'revision').length;
      const puntaje = felicitaciones - revisiones;

      return {
        colaboradorID: colaborador.colaboradorID,
        nombre: colaborador.nombre,
        apellido: colaborador.apellido,
        foto: colaborador.foto,
        felicitaciones,
        revisiones,
        puntaje
      };
    });

    return ranking.filter(item => item.puntaje > 0)
                  .sort((a, b) => b.puntaje - a.puntaje);
  };

  const calcularRankings = () => {
    const fecha = parse(fechaSeleccionada, 'MM/yyyy', new Date());
    if (!isValid(fecha)) {
      setError('Fecha inválida');
      return;
    }
    
    const inicioMes = startOfMonth(fecha);
    const finMes = endOfMonth(fecha);
    const inicioAño = startOfYear(fecha);
    const finAño = endOfYear(fecha);

    setRankingMensual(calcularRanking(inicioMes, finMes));
    setRankingAnual(calcularRanking(inicioAño, finAño));
    setError(null);
  };

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setFechaInput(valor);

    if (valor.length === 7 && /^(0[1-9]|1[0-2])\/\d{4}$/.test(valor)) {
      setFechaSeleccionada(valor);
    }
  };

  const RankingTable = ({ ranking, title }: { ranking: RankingItem[], title: string }) => (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <div className="overflow-x-auto">
        <table className="table-auto">
          <thead className="bg-white border-b-2 border-gray-300">
            <tr>
              <th className="px-2 py-1 text-left text-sm">Pos</th>
              <th className="px-2 py-1 text-left text-sm">Colaborador</th>
              <th className="px-2 py-1 text-left text-sm">Pts</th>         
              
            </tr>
          </thead>
          <tbody>
            {ranking.map((item, index) => (
              <tr key={item.colaboradorID} className={index % 2 === 0 ? 'bg-green-50' : 'bg-yellow-50'}>
                <td className="px-2 py-1 text-sm">{index + 1}</td>
       
                <td className="px-2 py-1 text-sm flex items-center">
                  <img src={'/images/winner-cup-7807.png'} alt={`${item.nombre} ${item.apellido}`} className="w-8 h-8 rounded-full mr-1" />
                  <span className="truncate">{`${item.nombre} ${item.apellido}`}</span>
                </td>
                <td className="px-2 py-1 text-sm font-bold">{item.puntaje}</td>
               
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-white flex justify-center">
      <div className="container max-w-4xl p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Ranking de Felicitar/Revisar</h1>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-4">
          <input
            type="text"
            value={fechaInput}
            onChange={handleFechaChange}
            placeholder="MM/YYYY"
            className="p-2 border rounded w-28"
          />
        </div>

        <RankingTable 
          ranking={rankingMensual} 
          title={`Top Mensual - ${format(parse(fechaSeleccionada, 'MM/yyyy', new Date()), 'MMMM yyyy', { locale: es })}`} 
        />
        <RankingTable 
          ranking={rankingAnual} 
          title={`Top Anual - ${fechaSeleccionada.split('/')[1]}`} 
        />
      </div>
    </div>
  );
};

export default Reconocemos;