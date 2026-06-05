import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;

/** Retorna true si fechaNacimiento es válida y el colaborador es ≥ 18 años */
function isValidAdult(fechaNacimiento: string | null | undefined): boolean {
  if (!fechaNacimiento) return false;
  const dob = new Date(fechaNacimiento);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  const realAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  return realAge >= 18;
}

/** Fecha máxima permitida = hoy − 18 años */
function maxBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
}

const BirthdayCheckModal: React.FC = () => {
  const [show, setShow] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const getIds = useCallback(() => {
    const rawUser = localStorage.getItem('user');
    let colaboradorID: string | null = null;
    try {
      const parsed = rawUser ? JSON.parse(rawUser) : null;
      const maybe = parsed?.user_code ?? parsed?.userId ?? parsed?.id;
      if (maybe != null) colaboradorID = String(maybe);
    } catch {
      colaboradorID = null;
    }
    const empresaId = localStorage.getItem('l_empresa_id');
    return { colaboradorID, empresaId };
  }, []);

  useEffect(() => {
    const { colaboradorID, empresaId } = getIds();
    if (!colaboradorID || !empresaId) return;

    axios
      .get(`${API_URL}/usuarios-registrados/${colaboradorID}`, {
        headers: { 'x-empresa-id': empresaId },
      })
      .then((res) => {
        if (res.data?.ok === 1) {
          const data = res.data.data;
          setProfileData(data);
          if (!isValidAdult(data?.fechaNacimiento)) {
            setShow(true);
          }
        }
      })
      .catch((err) => {
        console.error('BirthdayCheckModal: error fetching profile', err);
      });
  }, [getIds]);

  const handleSave = async () => {
    setError(null);

    if (!fechaNacimiento) {
      setError('Por favor ingresá tu fecha de nacimiento.');
      return;
    }
    if (!isValidAdult(fechaNacimiento)) {
      setError('Debés ser mayor de 18 años para usar esta aplicación.');
      return;
    }

    const { colaboradorID, empresaId } = getIds();
    if (!colaboradorID || !empresaId) {
      setError('No se pudo identificar al colaborador. Cerrá sesión e ingresá de nuevo.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...profileData,
        fechaNacimiento,
        empresaId,
        fechaActualizado: new Date().toISOString(),
      };
      await axios.put(`${API_URL}/usuarios-registrados/${colaboradorID}`, payload, {
        headers: { 'x-empresa-id': empresaId },
      });
      setSuccess(true);
      setTimeout(() => setShow(false), 1800);
    } catch (err) {
      console.error('BirthdayCheckModal: error saving', err);
      setError('Hubo un error al guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        {/* Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '1.25rem',
            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)',
            width: '100%',
            maxWidth: '420px',
            padding: '2.5rem 2rem 2rem',
            position: 'relative',
            animation: 'bdc-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
        >
          {/* Top accent bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              borderRadius: '1.25rem 1.25rem 0 0',
              background: 'linear-gradient(90deg, #4e49b3, #6c63ff)',
            }}
          />

          {/* Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ede9ff 0%, #ddd8ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4e49b3"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>

          {/* Heading */}
          <h2
            style={{
              textAlign: 'center',
              fontSize: '1.3rem',
              fontWeight: 700,
              color: '#1e1b4b',
              margin: '0 0 0.5rem',
            }}
          >
            Completá tu fecha de nacimiento
          </h2>

          {/* Subtitle */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#64748b',
              margin: '0 0 2rem',
              lineHeight: 1.6,
            }}
          >
            Para continuar necesitamos verificar que sos mayor de 18 años. Este dato es requerido para tu perfil de colaborador.
          </p>

          {/* Input group */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="bdc-fecha"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              Fecha de nacimiento
            </label>
            <input
              id="bdc-fecha"
              type="date"
              max={maxBirthDate()}
              value={fechaNacimiento}
              onChange={(e) => {
                setFechaNacimiento(e.target.value);
                setError(null);
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.6rem',
                border: error ? '1.5px solid #ef4444' : '1.5px solid #d1d5db',
                fontSize: '0.95rem',
                color: '#1e293b',
                background: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4e49b3';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(78,73,179,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#ef4444' : '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: '1px' }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontSize: '0.85rem', color: '#b91c1c' }}>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>
                ¡Guardado correctamente!
              </span>
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleSave}
            disabled={loading || success}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '0.65rem',
              border: 'none',
              background: loading || success
                ? '#a5b4fc'
                : 'linear-gradient(135deg, #4e49b3 0%, #6c63ff 100%)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading || success ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s, transform 0.15s',
              boxShadow: loading || success ? 'none' : '0 4px 14px rgba(78,73,179,0.35)',
            }}
            onMouseEnter={(e) => {
              if (!loading && !success) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'bdc-spin 0.7s linear infinite',
                    display: 'inline-block',
                  }}
                />
                Guardando...
              </>
            ) : (
              'Confirmar fecha de nacimiento'
            )}
          </button>

          {/* Helper note */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginTop: '1rem',
              marginBottom: 0,
            }}
          >
            Este dato es requerido por política de la empresa.
          </p>
        </div>
      </div>

      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes bdc-slide-up {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes bdc-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default BirthdayCheckModal;
