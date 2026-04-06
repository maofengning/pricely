import { useCallback } from 'react';
import { patternService } from '@/services/pattern';
import { usePatternStore } from '@/stores/patternStore';
import type { Pattern, PatternCreate, PatternUpdate, PatternQuery, Period } from '@/types';

export function usePattern() {
  const {
    patterns,
    selectedPattern,
    isLoading,
    error,
    editorOpen,
    editingPattern,
    setPatterns,
    setSelectedPattern,
    setLoading,
    setError,
    openEditor,
    closeEditor,
    addPattern,
    updatePattern,
    removePattern,
  } = usePatternStore();

  const fetchPatterns = useCallback(async (query?: PatternQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await patternService.list(query);
      setPatterns(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setPatterns, setLoading, setError]);

  const fetchPatternsByStock = useCallback(async (stockCode: string, period?: Period) => {
    await fetchPatterns({ stockCode, period });
  }, [fetchPatterns]);

  const createPattern = useCallback(async (data: PatternCreate): Promise<Pattern | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await patternService.create(data);
      addPattern(result);
      closeEditor();
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [addPattern, closeEditor, setLoading, setError]);

  const updatePatternData = useCallback(async (id: string, data: PatternUpdate): Promise<Pattern | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await patternService.update(id, data);
      updatePattern(id, result);
      closeEditor();
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [updatePattern, closeEditor, setLoading, setError]);

  const deletePattern = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await patternService.delete(id);
      removePattern(id);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [removePattern, setLoading, setError]);

  const selectPattern = useCallback((pattern: Pattern | null) => {
    setSelectedPattern(pattern);
  }, [setSelectedPattern]);

  const startEdit = useCallback((pattern: Pattern) => {
    openEditor(pattern);
  }, [openEditor]);

  const startCreate = useCallback(() => {
    openEditor();
  }, [openEditor]);

  const cancelEdit = useCallback(() => {
    closeEditor();
  }, [closeEditor]);

  return {
    // State
    patterns,
    selectedPattern,
    isLoading,
    error,
    editorOpen,
    editingPattern,
    // Actions
    fetchPatterns,
    fetchPatternsByStock,
    createPattern,
    updatePatternData,
    deletePattern,
    selectPattern,
    startEdit,
    startCreate,
    cancelEdit,
  };
}