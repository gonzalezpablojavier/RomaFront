import React, { Suspense } from 'react';
import { QrCode } from 'lucide-react';
import HomeSectionLabel from './HomeSectionLabel';
import { homeCard, homeCardFocus, homeCardInteractive, homeCtaButton } from './homeSurface';

export type FichajePulse = 'idle' | 'exito' | 'error';

interface HomeFichajePanelProps {
  isButtonDisabled: boolean;
  domicilioMessage: string | null;
  onDomicilioClick: () => void;
  pulso: FichajePulse;
  onFichajeActivate: () => void;
  ultimoFichajeHora: string | null;
  cargando: boolean;
  mostrarPresentismo: boolean;
  presentismo: React.ReactNode;
  suspenseFallback: React.ReactNode;
}

function joinClasses(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

const HomeFichajePanel: React.FC<HomeFichajePanelProps> = ({
  isButtonDisabled,
  domicilioMessage,
  onDomicilioClick,
  pulso,
  onFichajeActivate,
  ultimoFichajeHora,
  cargando,
  mostrarPresentismo,
  presentismo,
  suspenseFallback,
}) => (
  <section className="mb-4" aria-labelledby="home-fichaje-heading">
    <HomeSectionLabel id="home-fichaje-heading">Fichaje</HomeSectionLabel>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
      <Suspense fallback={suspenseFallback}>
        {isButtonDisabled ? (
          <button
            type="button"
            onClick={onDomicilioClick}
            className={joinClasses(
              'col-span-full flex min-h-[9rem] flex-col items-center justify-center border-amber-200/80 p-4 md:col-span-4',
              homeCard,
              homeCardInteractive,
              homeCardFocus,
            )}
          >
            <p className="text-center text-sm font-medium leading-snug text-slate-700">{domicilioMessage}</p>
            <p className="mt-2 text-xs font-medium text-amber-800">Tocá para actualizar tu domicilio</p>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFichajeActivate();
            }}
            className={joinClasses(
              'group col-span-full flex w-full items-start gap-3 p-3 text-left md:col-span-4 md:p-4',
              homeCard,
              homeCardInteractive,
              homeCardFocus,
              pulso === 'exito' && '!border-emerald-300/80 !bg-emerald-50/95 !ring-emerald-400/40 ring-2',
              pulso === 'error' && '!border-red-300/80 !bg-red-50/95 !ring-red-400/40 ring-2',
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#009ee3]/10 text-[#009ee3]">
              <QrCode className="h-6 w-6" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold leading-snug text-slate-900">¿Estás en la ofi?</span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                Escaneá el QR para marcar entrada o salida.
              </span>
              {ultimoFichajeHora ? (
                <span className="mt-1 block text-xs font-medium text-[#0077b3]">
                  Último registro: {ultimoFichajeHora} hs
                </span>
              ) : null}
              {/* loading / presentismo en esta columna */}
              {cargando ? (
                <span className="mt-3 flex flex-col items-center gap-2 py-3">
                  <img src="/images/icons8-camara-30.png" alt="" className="h-16 w-16 opacity-80" />
                  <span className="text-xs font-medium text-slate-500">Preparando cámara…</span>
                </span>
              ) : null}
              {mostrarPresentismo ? <span className="mt-3 block w-full">{presentismo}</span> : null}
              {!mostrarPresentismo && !cargando ? (
                <span className={`${homeCtaButton} mt-3 inline-flex items-center justify-center`}>
                  Toca para Escanear
                </span>
              ) : null}
            </span>
          </button>
        )}
      </Suspense>
    </div>
  </section>
);

export default HomeFichajePanel;
