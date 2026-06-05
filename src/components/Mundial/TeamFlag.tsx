import React, { useState } from 'react';
import { resolveFlagPath } from './mundialFlagMap';

interface TeamFlagProps {
  isoCountry: string;
  teamCode: string;
  size?: number;
  className?: string;
}

const TeamFlag: React.FC<TeamFlagProps> = ({
  isoCountry,
  teamCode,
  size = 28,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const src = resolveFlagPath(isoCountry);

  if (!src || failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ${className}`}
        style={{ width: size, height: size }}
        aria-label={`Selección ${teamCode}`}
      >
        {teamCode.slice(0, 3)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`inline-block shrink-0 rounded-sm object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
};

export default TeamFlag;
