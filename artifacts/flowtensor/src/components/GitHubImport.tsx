import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ArrowRight,
  Star,
  FileCode2,
  Github,
  Folder,
} from 'lucide-react';
import { useFetchRepo, useFetchFile } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

interface RepoFile {
  name: string;
  path: string;
  size: number;
}

interface RepoInfo {
  owner: string;
  repo: string;
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
}

interface GitHubImportProps {
  onLoaded: (filename: string, code: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function splitPath(path: string) {
  const idx = path.lastIndexOf('/');
  if (idx === -1) return { folder: '', name: path };
  return { folder: path.slice(0, idx), name: path.slice(idx + 1) };
}

export default function GitHubImport({ onLoaded }: GitHubImportProps) {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState<RepoInfo | null>(null);
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { toast } = useToast();

  const repoMutation = useFetchRepo({
    mutation: {
      onSuccess: (data: any) => {
        const list: RepoFile[] = data?.files || [];
        setInfo(data?.info || null);
        setFiles(list);
        setSelected(list.length > 0 ? list[0].path : null);
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.error || error?.message || 'Failed to fetch repository';
        toast({
          title: 'GitHub Error',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    },
  });

  const fileMutation = useFetchFile({
    mutation: {
      onSuccess: (data: any) => {
        if (data?.code != null && data?.filename) {
          toast({
            title: 'Loaded from GitHub',
            description: `${data.filename} ✓`,
          });
          onLoaded(data.filename, data.code);
        }
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.error || error?.message || 'Failed to load file';
        toast({
          title: 'GitHub Error',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    },
  });

  const handleBrowse = () => {
    if (!url.trim()) {
      toast({
        title: 'Missing URL',
        description: 'Paste a GitHub repository URL to browse.',
        variant: 'destructive',
      });
      return;
    }
    setInfo(null);
    setFiles([]);
    setSelected(null);
    repoMutation.mutate({ data: { url: url.trim() } });
  };

  const handleVisualize = () => {
    if (!info || !selected) return;
    fileMutation.mutate({
      data: { owner: info.owner, repo: info.repo, path: selected },
    });
  };

  const isBrowsing = repoMutation.isPending;
  const isLoading = fileMutation.isPending;

  return (
    <div className="flex-1 overflow-auto bg-[#0f1117] p-6 flex flex-col gap-4">
      {/* Step 1: Repo input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-[0.18em] font-semibold">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-white/70 text-[9px]">
            1
          </span>
          Choose a repository
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBrowse();
            }}
            aria-label="GitHub repository URL"
            placeholder="github.com/username/repository"
            className="flex-1 px-4 py-3 rounded-xl bg-[#1a1d24] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono"
            disabled={isBrowsing}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBrowse}
            disabled={isBrowsing}
            className="px-4 py-3 rounded-xl border border-white/15 bg-white/[0.03] text-sm font-semibold text-white/90 hover:bg-white/[0.07] hover:border-white/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            {isBrowsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Browsing...
              </>
            ) : (
              <>
                Browse Repo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Repo header */}
      <AnimatePresence>
        {info && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-[#11141c] to-[#0d1018] px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                <Github className="w-4 h-4 text-white/80" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-white truncate">
                    {info.owner}/{info.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-white/50">
                    <Star className="w-3 h-3" />
                    {info.stars.toLocaleString()}
                  </span>
                  {info.language && (
                    <span className="text-[11px] text-white/50 px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/10">
                      {info.language}
                    </span>
                  )}
                </div>
                {info.description && (
                  <p className="mt-1 text-xs text-white/55 leading-relaxed line-clamp-2">
                    {info.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 2: File picker */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-[0.18em] font-semibold">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-white/70 text-[9px]">
                2
              </span>
              Pick a Python file ({files.length} found)
            </div>
            <div className="rounded-xl border border-white/10 bg-[#11141c] overflow-hidden">
              <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
                {files.map((f) => {
                  const isActive = selected === f.path;
                  const { folder, name } = splitPath(f.path);
                  return (
                    <button
                      key={f.path}
                      onClick={() => setSelected(f.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors border-l-2 ${
                        isActive
                          ? 'bg-blue-500/10 border-blue-400 text-white'
                          : 'border-transparent text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <FileCode2
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-blue-400' : 'text-white/40'
                        }`}
                      />
                      <span className="flex-1 min-w-0 flex items-baseline gap-2 font-mono">
                        <span className="truncate">{name}</span>
                        {folder && (
                          <span className="text-[11px] text-white/40 truncate flex items-center gap-1">
                            <Folder className="w-3 h-3" />/{folder}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-white/40 shrink-0">
                        {formatSize(f.size)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleVisualize}
              disabled={!selected || isLoading}
              className="w-full relative group overflow-hidden rounded-xl bg-card disabled:opacity-80 disabled:cursor-not-allowed mt-1"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity ${
                  isLoading ? 'animate-pulse' : ''
                }`}
              />
              <div className="relative px-6 py-3.5 flex items-center justify-center gap-2 text-white font-semibold tracking-wide">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading file...</span>
                  </>
                ) : (
                  <>
                    <span>Visualize Selected File</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {!info && !isBrowsing && (
        <p className="text-[11px] text-white/40">
          Public repositories only. No authentication required.
        </p>
      )}
    </div>
  );
}
