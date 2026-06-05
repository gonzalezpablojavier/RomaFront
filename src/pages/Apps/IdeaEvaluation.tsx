import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface IdeaEvaluationProps {
  ideaId: number;
  currentStatus: string;
  currentRating: number;
  onStatusChange: (status: string) => void;
  onRatingChange: (rating: number) => void;
}

const IdeaEvaluation = ({ ideaId, currentStatus, currentRating, onStatusChange, onRatingChange }: IdeaEvaluationProps) => {
  const [rating, setRating] = useState(currentRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [status, setStatus] = useState(currentStatus || 'pendiente');

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    onStatusChange(newStatus);
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
    onRatingChange(value);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center gap-4">
        <span className="font-medium">Estado:</span>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="pendiente">Pendiente</option>
          <option value="revision">En Revisión</option>
          <option value="aceptada">Aceptada</option>
          <option value="rechazada">Rechazada</option>
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="font-medium">Puntaje:</span>
        <div className="flex gap-1">
          {[3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <button
              key={value}
              onClick={() => handleRatingClick(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                size={24}
                className={`${
                  value <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                } transition-colors duration-150`}
              />
            </button>
          ))}
        </div>
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating} puntos` : 'Sin puntaje'}
        </span>
      </div>
    </div>
  );
};

export default IdeaEvaluation;