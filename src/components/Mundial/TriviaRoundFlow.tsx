import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type {
  MundialPhase,
  TriviaQuestion,
  TriviaSubmitResult,
} from '../../api/api_mundial';
import { fetchTrivia, submitTrivia } from '../../api/api_mundial';
import { homeAreaChip, homeCard, homeCardFocus, homeCtaButton, homePageShell } from '../Home/homeSurface';

const CATEGORY_LABEL: Record<string, string> = {
  cultura: 'Cultura',
  habitos: 'Hábito',
  pilares: 'Pilar',
};

interface TriviaRoundFlowProps {
  phase: MundialPhase;
  phaseTitle: string;
  onDone: () => void;
  onBack: () => void;
}

const TriviaRoundFlow: React.FC<TriviaRoundFlowProps> = ({
  phase,
  phaseTitle,
  onDone,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<TriviaSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrivia(phase);
      setQuestions(data.questions);
      setStep(0);
      setAnswers({});
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo cargar la trivia';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, [phase]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const retry = () => {
    setResult(null);
    loadQuestions();
  };

  const current = questions[step];

  const selectOption = (optionId: number) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: optionId }));
  };

  const goNext = async () => {
    if (!current || !answers[current.id]) {
      setError('Elegí una opción');
      return;
    }
    setError(null);
    if (step < questions.length - 1) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        optionId: answers[q.id],
      }));
      const res = await submitTrivia(phase, payload);
      setResult(res);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al enviar';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${homePageShell} p-6`}>
        <div className="mx-auto max-w-lg animate-pulse space-y-4">
          <div className="h-8 rounded-lg bg-slate-200" />
          <div className="h-40 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (result) {
    const passed = result.correctCount === result.total && result.total > 0;
    return (
      <div className={`${homePageShell} min-h-full p-4`}>
        <div className="relative z-10 mx-auto max-w-lg space-y-4">
          <div className={`p-4 ${homeCard}`}>
            <h2 className="text-lg font-bold text-slate-900">
              {passed ? '¡Listo!' : 'Casi…'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {passed
                ? `Ya podés pronosticar ${phaseTitle}. Acertaste ${result.correctCount} de ${result.total}.`
                : `Necesitás acertar las ${result.total} para continuar. Acertaste ${result.correctCount} de ${result.total}.`}
            </p>
            <ul className="mt-4 space-y-2">
              {result.feedback.map((f) => (
                <li
                  key={f.questionId}
                  className={`rounded-lg border p-2 text-xs ${
                    f.isCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  <span className="font-semibold">{CATEGORY_LABEL[f.category] ?? f.category}: </span>
                  {f.isCorrect ? 'Correcto' : `Correcta: ${f.correctOptionText}`}
                  {f.explanation && (
                    <p className="mt-1 text-slate-600">{f.explanation}</p>
                  )}
                </li>
              ))}
            </ul>
            {passed ? (
              <button type="button" onClick={onDone} className={`mt-4 w-full ${homeCtaButton}`}>
                Ir al fixture
              </button>
            ) : (
              <button type="button" onClick={retry} className={`mt-4 w-full ${homeCtaButton}`}>
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${homePageShell} min-h-full p-4`}>
      <div className="relative z-10 mx-auto max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className={`mb-4 flex items-center gap-1 text-sm font-medium text-[#0077b3] ${homeCardFocus}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Volver
        </button>

        <header className={`mb-4 px-4 py-3 ${homeCard}`}>
          <h1 className="text-lg font-bold text-slate-900">Cultura Distri · {phaseTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pregunta {step + 1} de {questions.length}
            {current && (
              <span className={`ml-2 ${homeAreaChip}`}>
                {CATEGORY_LABEL[current.category] ?? current.category}
              </span>
            )}
          </p>
        </header>

        {current && (
          <div className="space-y-3">
            <p className={`p-4 text-sm font-medium text-slate-800 ${homeCard}`}>{current.text}</p>
            {current.options.map((opt) => {
              const selected = answers[current.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectOption(opt.id)}
                  className={`block w-full p-4 text-left text-sm transition-colors ${homeCard} ${
                    selected
                      ? 'border-[#009ee3] bg-[#009ee3]/15 font-medium text-[#003d5c] ring-2 ring-[#009ee3]/25'
                      : 'text-slate-800 hover:border-[#009ee3]/35 hover:bg-[#009ee3]/5'
                  } ${homeCardFocus}`}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={submitting}
          onClick={goNext}
          className={`mt-4 w-full ${homeCtaButton} disabled:opacity-60`}
        >
          {submitting
            ? 'Enviando…'
            : step < questions.length - 1
              ? 'Siguiente'
              : 'Enviar trivia'}
        </button>
      </div>
    </div>
  );
};

export default TriviaRoundFlow;
