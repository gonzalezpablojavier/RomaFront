import React, { useState } from 'react';
import { X } from 'lucide-react';

/** Mínimo para listar destinatarios en el modal */
export interface NotificationRecipient {
    colaboradorID: number;
    nombre: string;
    apellido: string;
    area: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores: NotificationRecipient[];
  onSendNotification: (title: string, body: string, selectedIds: number[]) => Promise<void>;
  filteredColaboradores?: NotificationRecipient[];
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  colaboradores,
  onSendNotification,
  filteredColaboradores
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sending, setSending] = useState(false);

  const handleSelectAll = () => {
    const colab = filteredColaboradores || colaboradores;
    if (selectedIds.length === colab.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(colab.map(c => c.colaboradorID));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body || selectedIds.length === 0) {
      alert('Por favor complete todos los campos y seleccione al menos un colaborador');
      return;
    }

    try {
      setSending(true);
      await onSendNotification(title, body, selectedIds);
      setTitle('');
      setBody('');
      setSelectedIds([]);
      onClose();
    } catch (error) {
      console.error('Error al enviar notificaciones:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const colab = filteredColaboradores || colaboradores;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Enviar Notificación</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Ingrese el título de la notificación"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent h-24"
              placeholder="Ingrese el mensaje de la notificación"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Destinatarios ({selectedIds.length} seleccionados)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedIds.length === colab.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="border rounded max-h-48 overflow-y-auto p-2">
              {colab.map((colaborador) => (
                <label
                  key={colaborador.colaboradorID}
                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(colaborador.colaboradorID)}
                    onChange={() => {
                      setSelectedIds(prev =>
                        prev.includes(colaborador.colaboradorID)
                          ? prev.filter(id => id !== colaborador.colaboradorID)
                          : [...prev, colaborador.colaboradorID]
                      );
                    }}
                    className="mr-2"
                  />
                  <span>
                    {colaborador.nombre} {colaborador.apellido} - {colaborador.area}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sending}
              className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 ${
                sending ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {sending ? 'Enviando...' : 'Enviar Notificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationModal;