import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  useSetGroqKey,
  useGroqKeyStatus,
} from '@workspace/api-client-react';

type KeySource = 'user' | 'env' | 'none';

interface AISettingsContextValue {
  hasKey: boolean;
  source: KeySource;
  explanationCount: number;
  saveKey: (key: string) => Promise<void>;
  refreshStatus: () => void;
}

const AISettingsContext = createContext<AISettingsContextValue | null>(null);

export function AISettingsProvider({ children }: { children: ReactNode }) {
  const [hasKey, setHasKey] = useState(false);
  const [source, setSource] = useState<KeySource>('none');
  const [explanationCount, setExplanationCount] = useState(0);

  const statusQuery = useGroqKeyStatus();

  useEffect(() => {
    const data = statusQuery.data;
    if (data) {
      setHasKey(!!data.has_key);
      setSource((data.source as KeySource) ?? 'none');
      setExplanationCount(data.explanation_count ?? 0);
    }
  }, [statusQuery.data]);

  const setKeyMutation = useSetGroqKey();

  const saveKey = useCallback(
    async (key: string) => {
      const res = await setKeyMutation.mutateAsync({ data: { key } });
      setHasKey(!!res.has_key);
      setSource((res.source as KeySource) ?? 'none');
      setExplanationCount(res.explanation_count ?? 0);
    },
    [setKeyMutation],
  );

  const refreshStatus = useCallback(() => {
    void statusQuery.refetch();
  }, [statusQuery]);

  return (
    <AISettingsContext.Provider
      value={{ hasKey, source, explanationCount, saveKey, refreshStatus }}
    >
      {children}
    </AISettingsContext.Provider>
  );
}

export function useAISettings(): AISettingsContextValue {
  const ctx = useContext(AISettingsContext);
  if (!ctx) throw new Error('useAISettings must be used within AISettingsProvider');
  return ctx;
}
