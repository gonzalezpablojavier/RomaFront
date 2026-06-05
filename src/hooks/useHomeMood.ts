import { useCallback, useState } from 'react';
import axios from 'axios';

export type HomeMoodValue = 'contento' | 'enojado' | 'mal';

interface UseHomeMoodOptions {
  apiUrl: string;
  empresaID: string | null;
  colaboradorID: string | null;
  initialMood?: { mood: string } | null;
}

export function useHomeMood({ apiUrl, empresaID, colaboradorID, initialMood = null }: UseHomeMoodOptions) {
  const [lastMood, setLastMood] = useState<{ mood: string } | null>(initialMood);
  const [moodMessage, setMoodMessage] = useState<string | null>(null);
  const [moodPending, setMoodPending] = useState<HomeMoodValue | null>(null);

  const submitMood = useCallback(
    async (selectedMood: HomeMoodValue) => {
      if (!colaboradorID || !empresaID || moodPending) return;

      const previous = lastMood;
      setMoodPending(selectedMood);
      setLastMood({ mood: selectedMood });

      try {
        const response = await axios.post(
          `${apiUrl}/howareyou`,
          { mood: selectedMood, colaboradorID },
          { headers: { 'x-empresa-id': empresaID } },
        );

        if (response.data.ok === 1) {
          setMoodMessage('Gracias por compartir');
        } else {
          setLastMood(previous);
          setMoodMessage('Hoy ya enviaste tu estado de ánimo');
        }
      } catch {
        setLastMood(previous);
        setMoodMessage('No se pudo guardar. Probá de nuevo.');
      } finally {
        setMoodPending(null);
        window.setTimeout(() => setMoodMessage(null), 3000);
      }
    },
    [apiUrl, colaboradorID, empresaID, lastMood, moodPending],
  );

  return { lastMood, setLastMood, moodMessage, moodPending, submitMood };
}
