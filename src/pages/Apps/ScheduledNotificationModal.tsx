import React, { useState } from 'react';
import axios from 'axios';
import { X, Calendar, Clock, Users, Search, Eye, Cake, UserX, ListChecks } from 'lucide-react';

const DEFAULT_SUCURSALES = ['PICO', 'MDP', 'DIMES', 'ROSARIO'] as const;

export type ScheduledEventType = 'manual_list' | 'birthday_today' | 'absent_today';

const EVENT_TYPE_OPTIONS: {
  value: ScheduledEventType;
  label: string;
  description: string;
}[] = [
  {
    value: 'manual_list',
    label: 'Lista manual',
    description: 'Elegis colaboradores fijos. El mensaje se envia solo a ellos.',
  },
  {
    value: 'birthday_today',
    label: 'Cumpleanos del dia',
    description:
      'A la hora programada se calculan quienes cumplen anos hoy y se les envia el push (podes filtrar por area).',
  },
  {
    value: 'absent_today',
    label: 'Ausentes del dia',
    description:
      'A la hora programada se detectan ausentes por presentismo y se les envia el push (podes filtrar sucursal).',
  },
];

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

interface ScheduledNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores: Colaborador[];
  empresaId?: string;
  apiUrl: string;
  onScheduleNotification: (scheduleData: ScheduleNotificationData) => Promise<void>;
}

export interface ScheduleNotificationEventConfig {
  areas?: string[];
  sucursales?: string[];
}

export interface ScheduleNotificationData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  title: string;
  message: string;
  colaboradorIds: number[];
  empresaId?: string;
  eventType?: ScheduledEventType;
  eventConfig?: ScheduleNotificationEventConfig | null;
  isActive: boolean;
}

interface RecipientPreview {
  count: number;
  sample: { colaboradorID: number; nombre?: string; apellido?: string }[];
}

const ScheduledNotificationModal: React.FC<ScheduledNotificationModalProps> = ({
  isOpen,
  onClose,
  colaboradores,
  empresaId,
  apiUrl,
  onScheduleNotification,
}) => {
  const resolvedEmpresaId = String(
    empresaId ?? colaboradores[0]?.empresaId ?? 'default',
  );

  const [formData, setFormData] = useState<ScheduleNotificationData>({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    title: '',
    message: '',
    colaboradorIds: [],
    eventType: 'manual_list',
    eventConfig: null,
    isActive: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedAll, setSelectedAll] = useState(false);
  const [birthdayAreas, setBirthdayAreas] = useState<string[]>([]);
  const [absentSucursales, setAbsentSucursales] = useState<string[]>([...DEFAULT_SUCURSALES]);
  const [preview, setPreview] = useState<RecipientPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const areas = Array.from(new Set(colaboradores.map((c) => c.area))).sort();
  const sucursalesFromData = Array.from(
    new Set([...DEFAULT_SUCURSALES, ...colaboradores.map((c) => c.sucursal).filter(Boolean)]),
  ).sort();

  const filteredColaboradores = colaboradores.filter((colaborador) => {
    const fullName = `${colaborador.nombre} ${colaborador.apellido}`.toLowerCase();
    const searchMatch = fullName.includes(searchQuery.toLowerCase());
    const areaMatch = !selectedArea || colaborador.area === selectedArea;
    return searchMatch && areaMatch;
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setPreview(null);
  };

  const handleEventTypeChange = (eventType: ScheduledEventType) => {
    setFormData((prev) => ({ ...prev, eventType }));
    setPreview(null);
  };

  const buildEventConfig = (): ScheduleNotificationEventConfig | null => {
    if (formData.eventType === 'birthday_today') {
      return birthdayAreas.length ? { areas: birthdayAreas } : null;
    }
    if (formData.eventType === 'absent_today') {
      return absentSucursales.length ? { sucursales: absentSucursales } : null;
    }
    return null;
  };

  const buildPayload = (): ScheduleNotificationData => ({
    ...formData,
    endDate: formData.startDate,
    empresaId: resolvedEmpresaId,
    eventType: formData.eventType ?? 'manual_list',
    eventConfig: buildEventConfig(),
  });

  const toggleStringInList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    setPreview(null);
  };

  const handlePreviewRecipients = async () => {
    setPreviewLoading(true);
    setPreview(null);
    try {
      const { data } = await axios.post<RecipientPreview>(
        `${apiUrl}/scheduled-notifications/preview-recipients`,
        buildPayload(),
      );
      setPreview(data);
    } catch (error) {
      console.error('Error al previsualizar destinatarios:', error);
      alert('No se pudo calcular la vista previa de destinatarios');
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectedAll(!selectedAll);
    setFormData((prev) => ({
      ...prev,
      colaboradorIds: !selectedAll ? colaboradores.map((c) => c.colaboradorID) : [],
    }));
  };

  const toggleColaborador = (colaboradorID: number) => {
    setFormData((prev) => ({
      ...prev,
      colaboradorIds: prev.colaboradorIds.includes(colaboradorID)
        ? prev.colaboradorIds.filter((id) => id !== colaboradorID)
        : [...prev.colaboradorIds, colaboradorID],
    }));
    setPreview(null);
  };

  const resetForm = () => {
    setFormData({
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      title: '',
      message: '',
      colaboradorIds: [],
      eventType: 'manual_list',
      eventConfig: null,
      isActive: true,
    });
    setBirthdayAreas([]);
    setAbsentSucursales([...DEFAULT_SUCURSALES]);
    setPreview(null);
    setSelectedAll(false);
    setSearchQuery('');
    setSelectedArea('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.startTime || !formData.endTime) {
      alert('Completa fecha y ambas horas de envio');
      return;
    }
    if (!formData.title || !formData.message) {
      alert('Ingresa titulo y mensaje');
      return;
    }
    if (formData.eventType === 'manual_list' && formData.colaboradorIds.length === 0) {
      alert('Selecciona al menos un colaborador (lista manual)');
      return;
    }
    if (formData.eventType === 'absent_today' && absentSucursales.length === 0) {
      alert('Selecciona al menos una sucursal para ausentes');
      return;
    }

    try {
      await onScheduleNotification(buildPayload());
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error al programar notificacion:', error);
      alert('Error al programar la notificacion');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programar notificaciones automáticas
          </h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Fecha de vigencia</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Hora de envio 1</label>
              <p className="text-xs text-gray-500">Minutos :00, :05, :10… (cron cada 5 min)</p>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Hora de envio 2 (opcional)</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div className="space-y-3 border rounded-lg p-4 bg-amber-50/50 border-amber-200">
            <label className="block text-sm font-semibold text-gray-800">A quien se envia?</label>
            <div className="grid gap-2">
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${
                    formData.eventType === opt.value
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    checked={formData.eventType === opt.value}
                    onChange={() => handleEventTypeChange(opt.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium flex items-center gap-1.5">
                      {opt.value === 'manual_list' && <ListChecks className="h-4 w-4" />}
                      {opt.value === 'birthday_today' && <Cake className="h-4 w-4" />}
                      {opt.value === 'absent_today' && <UserX className="h-4 w-4" />}
                      {opt.label}
                    </span>
                    <span className="text-sm text-gray-600 block">{opt.description}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePreviewRecipients}
                disabled={previewLoading}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                {previewLoading ? 'Calculando...' : 'Vista previa de destinatarios'}
              </button>
              {preview && (
                <span className="text-sm text-gray-700">
                  Hoy: <strong>{preview.count}</strong>
                  {preview.sample.length > 0 &&
                    ` — ${preview.sample
                      .map(
                        (p) =>
                          [p.nombre, p.apellido].filter(Boolean).join(' ') ||
                          `#${p.colaboradorID}`,
                      )
                      .join(', ')}`}
                </span>
              )}
            </div>
          </div>

          {formData.eventType === 'birthday_today' && (
            <div className="space-y-2 border rounded-lg p-4">
              <label className="block text-sm font-medium">Filtrar por area (opcional)</label>
              <p className="text-xs text-gray-500">Sin marcar = todas las areas</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {areas.map((area) => (
                  <label key={area} className="inline-flex items-center gap-1.5 px-2 py-1 border rounded text-sm">
                    <input
                      type="checkbox"
                      checked={birthdayAreas.includes(area)}
                      onChange={() => toggleStringInList(birthdayAreas, setBirthdayAreas, area)}
                    />
                    {area}
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.eventType === 'absent_today' && (
            <div className="space-y-2 border rounded-lg p-4">
              <label className="block text-sm font-medium">Sucursales</label>
              <div className="flex flex-wrap gap-2">
                {sucursalesFromData.map((suc) => (
                  <label key={suc} className="inline-flex items-center gap-1.5 px-2 py-1 border rounded text-sm">
                    <input
                      type="checkbox"
                      checked={absentSucursales.includes(suc)}
                      onChange={() => toggleStringInList(absentSucursales, setAbsentSucursales, suc)}
                    />
                    {suc}
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.eventType === 'manual_list' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar colaborador..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0"
                  />
                </div>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="p-2 border rounded focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Todas las areas</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Destinatarios ({formData.colaboradorIds.length})
                </label>
                <button type="button" onClick={toggleSelectAll} className="text-sm text-blue-600">
                  {selectedAll ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div className="border rounded max-h-48 overflow-y-auto p-2">
                {filteredColaboradores.map((colaborador) => (
                  <label
                    key={colaborador.colaboradorID}
                    className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.colaboradorIds.includes(colaborador.colaboradorID)}
                      onChange={() => toggleColaborador(colaborador.colaboradorID)}
                      className="mr-2"
                    />
                    <span>
                      {colaborador.nombre} {colaborador.apellido} - {colaborador.area}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2"
            >
              <Clock className="h-5 w-5" />
              Programar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduledNotificationModal;
