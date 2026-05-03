import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Link as LinkIcon, FileCode2, ArrowRight } from 'lucide-react';
import { useFetchGist } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

interface GistFile {
  filename: string;
  size: number;
}

interface GistImportProps {
  initialUrl?: string;
  onLoaded: (filename: string, code: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function GistImport({ initialUrl = '', onLoaded }: GistImportProps) {
  const [url, setUrl] = useState(initialUrl);
  const [files, setFiles] = useState<GistFile[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMutation = useFetchGist({
    mutation: {
      onSuccess: (data: any) => {
        if (data?.files && Array.isArray(data.files) && data.files.length > 0) {
          const list: GistFile[] = data.files;
          const largest = list.reduce(
            (a, b) => (a.size >= b.size ? a : b),
            list[0],
          );
          setFiles(list);
          setSelected(largest.filename);
          return;
        }
        if (data?.code && data?.filename) {
          toast({
            title: 'Loaded from Gist',
            description: `${data.filename} ✓`,
          });
          onLoaded(data.filename, data.code);
        }
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.error || error?.message || 'Failed to fetch Gist';
        toast({
          title: 'Gist Error',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    },
  });

  const handleFetch = () => {
    if (!url.trim()) {
      toast({
        title: 'Missing URL',
        description: 'Paste a GitHub Gist URL to import.',
        variant: 'destructive',
      });
      return;
    }
    setFiles(null);
    setSelected(null);
    fetchMutation.mutate({ data: { url: url.trim() } });
  };

  const handleSelectFileDirect = async () => {
    if (!selected) return;
    try {
      // Extract gist id and call GitHub raw API client-side
      const m = url.trim().match(/gist\.github\.com\/(?:[^/\s]+\/)?([0-9a-fA-F]+)/);
      if (!m) throw new Error('Invalid Gist URL');
      const gistId = m[1];
      const resp = await fetch(`https://api.github.com/gists/${gistId}`);
      if (!resp.ok) {
        if (resp.status === 404) throw new Error('Gist not found or is private');
        if (resp.status === 403) throw new Error('GitHub rate limit reached, try again in a minute');
        throw new Error('Could not fetch Gist');
      }
      const json = await resp.json();
      const file = json?.files?.[selected];
      if (!file) throw new Error('Selected file not found');
      let content: string | undefined = file.content;
      if (!content && file.raw_url) {
        const rawResp = await fetch(file.raw_url);
        content = await rawResp.text();
      }
      if (!content) throw new Error('Could not read file content');
      toast({
        title: 'Loaded from Gist',
        description: `${selected} ✓`,
      });
      onLoaded(selected, content);
    } catch (err: any) {
      toast({
        title: 'Gist Error',
        description: err?.message || 'Failed to load file',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-[#0f1117] p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-wider font-semibold">
        <LinkIcon className="w-3.5 h-3.5" />
        Import from a public GitHub Gist
      </div>

      <div className="relative">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFetch();
          }}
          aria-label="GitHub Gist URL"
          placeholder="Paste a GitHub Gist URL... (e.g. gist.github.com/user/abc123)"
          className="w-full px-4 py-3.5 rounded-xl bg-[#1a1d24] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono"
          disabled={fetchMutation.isPending}
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleFetch}
        disabled={fetchMutation.isPending}
        className="w-full relative group overflow-hidden rounded-xl bg-card disabled:opacity-80 disabled:cursor-not-allowed"
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity ${
            fetchMutation.isPending ? 'animate-pulse' : ''
          }`}
        />
        <div className="relative px-6 py-3.5 flex items-center justify-center gap-2 text-white font-semibold tracking-wide">
          {fetchMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <span>Fetch &amp; Visualize</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </div>
      </motion.button>

      <p className="text-[11px] text-white/40">
        Public Gists only. No authentication required.
      </p>

      {/* Multi-file selector */}
      <AnimatePresence>
        {files && files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-2 rounded-xl border border-white/10 bg-[#11141c] shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 text-sm text-white/80">
              <FileCode2 className="w-4 h-4 text-blue-400" />
              <span className="font-semibold">
                {files.length} Python file{files.length === 1 ? '' : 's'} found
              </span>
            </div>
            <div className="max-h-64 overflow-auto">
              {files.map((f) => {
                const isActive = selected === f.filename;
                return (
                  <button
                    key={f.filename}
                    onClick={() => setSelected(f.filename)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-200'
                        : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-mono">
                      <span className={isActive ? 'text-blue-400' : 'text-white/30'}>
                        {isActive ? '▶' : ' '}
                      </span>
                      {f.filename}
                    </span>
                    <span className="text-xs text-white/40">{formatSize(f.size)}</span>
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex justify-end">
              <button
                onClick={handleSelectFileDirect}
                disabled={!selected}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Load selected →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
