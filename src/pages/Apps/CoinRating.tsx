import React from 'react';
import { Star  } from 'lucide-react';

interface CoinRatingProps {
  value: number;
  onRatingChange?: (value: number) => void;
  readOnly?: boolean;
}

const CoinRating: React.FC<CoinRatingProps> = ({ value, onRatingChange, readOnly = false }) => {
  const handleClick = (newValue: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(newValue);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3,4,5].map((index) => (
        <button
          key={index}
          onClick={() => handleClick(index)}
          disabled={readOnly || index < 3} // Deshabilita botones menores a 3       
          className={`focus:outline-none transform transition-transform ${
            !readOnly && index >= 3 ? 'hover:scale-110' : ''
          }`}
        >
          <Star 
            size={24}
            className={`${
                index <= value
                  ? 'text-yellow-500 fill-yellow-500'
                  : index < 3
                  ? 'text-yellow-500 fill-yellow-500' // Siempre doradas las primeras 3
                  : 'text-yellow-300 fill-gray-300'
              } transition-colors`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          ({value || 3})
        </span>
      )}
    </div>
  );
};

export default CoinRating;