import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ArrowRight,
  Star,
  FileCode2,
  Github,
  Folder,
  Eye,
  EyeOff,
  KeyRound,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Circle,
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

type TokenStatus =
  | { kind: 'none' }
  | { kind: 'checking' }
  | { kind: 'valid'; limit: number }
  | { kind: 'invalid' }
  | { kind: 'unavailable' };

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

const TOKEN_LINK =
  'https://github.com/settings/tokens/new?scopes=public_repo&description=FlowTensor';

export default function GitHubImport({ onLoaded }: GitHubImportProps) {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState<RepoInfo | null>(null);
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [tokenOpen, setTokenOpen] = useState(false);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({ kind: 'none' });
  const tokenSectionRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // Debounced token validation, guarded against stale responses
  useEffect(() => {
    const t = token.trim();
    if (!t) {
      setTokenStatus({ kind: 'none' });
      return;
    }
    setTokenStatus({ kind: 'checking' });
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const resp = await fetch('https://api.github.com/rate_limit', {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${t}`,
          },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (resp.status === 401 || resp.status === 403) {
          setTokenStatus({ kind: 'invalid' });
          return;
        }
        if (!resp.ok) {
          // 5xx or other transient — validation unavailable, not a bad token
          setTokenStatus({ kind: 'unavailable' });
          return;
        }
        const json = await resp.json();
        if (controller.signal.aborted) return;
        const limit = json?.rate?.limit ?? json?.resources?.core?.limit ?? 0;
        if (typeof limit === 'number' && limit > 60) {
          setTokenStatus({ kind: 'valid', limit });
        } else {
          // 60 means it didn't actually authenticate
          setTokenStatus({ kind: 'invalid' });
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        // Network failure / CORS — can't determine validity
        setTokenStatus({ kind: 'unavailable' });
      }
    }, 800);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [token]);

  const expandTokenSection = () => {
    setTokenOpen(true);
    setTimeout(() => {
      tokenSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleRateLimitError = (msg: string) => {
    const noUserToken = !token.trim();
    if (noUserToken) {
      toast({
        title: 'GitHub rate limit reached',
        description: 'Add a free token below to get 5,000 requests/hour →',
        variant: 'destructive',
      });
      expandTokenSection();
    } else {
      toast({
        title: 'GitHub Error',
        description: msg,
        variant: 'destructive',
      });
    }
  };

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
        if (errorMessage.toLowerCase().includes('rate limit')) {
          handleRateLimitError(errorMessage);
        } else {
          toast({
            title: 'GitHub Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
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
        if (errorMessage.toLowerCase().includes('rate limit')) {
          handleRateLimitError(errorMessage);
        } else {
          toast({
            title: 'GitHub Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      },
    },
  });

  const tokenForRequest = () => {
    const t = token.trim();
    return t ? t : null;
  };

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
    repoMutation.mutate({
      data: { url: url.trim(), github_token: tokenForRequest() },
    });
  };

  const handleVisualize = () => {
    if (!info || !selected) return;
    fileMutation.mutate({
      data: {
        owner: info.owner,
        repo: info.repo,
        path: selected,
        github_token: tokenForRequest(),
      },
    });
  };

  const isBrowsing = repoMutation.isPending;
  const isLoading = fileMutation.isPending;

  const renderTokenStatus = () => {
    switch (tokenStatus.kind) {
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50">
            <Loader2 className="w-3 h-3 animate-spin" />
            Checking token...
          </span>
        );
      case 'valid':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Token valid · {tokenStatus.limit.toLocaleString()} requests/hour available
          </span>
        );
      case 'invalid':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-red-400">
            <XCircle className="w-3 h-3" />
            Invalid token
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400/80">
            <Circle className="w-3 h-3" />
            Couldn't verify token (will still be sent)
          </span>
        );
      case 'none':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/40">
            <Circle className="w-3 h-3" />
            No token · 60 requests/hour
          </span>
        );
    }
  };

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

      {/* GitHub token (collapsible) */}
      <div ref={tokenSectionRef} className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setTokenOpen((v) => !v)}
          className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg bg-[#11141c] border border-white/10 text-xs text-white/70 hover:text-white hover:border-white/20 transition-colors"
          aria-expanded={tokenOpen}
        >
          <span className="inline-flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5" />
            <span className="font-semibold">GitHub Token (optional)</span>
            <span className="text-white/30">·</span>
            {renderTokenStatus()}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${tokenOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {tokenOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-white/10 bg-[#11141c] p-3 flex flex-col gap-2">
                <label
                  htmlFor="gh-token-input"
                  className="text-[11px] text-white/60 font-semibold"
                >
                  GitHub Personal Access Token (optional)
                </label>
                <div className="relative">
                  <input
                    id="gh-token-input"
                    type={tokenVisible ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_••••••••••••••••••••••••••••••••••••"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-[#0f1117] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setTokenVisible((v) => !v)}
                    aria-label={tokenVisible ? 'Hide token' : 'Show token'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-white/40 hover:text-white/80 transition-colors"
                  >
                    {tokenVisible ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[11px] text-white/45">
                    Increases rate limit from 60 to 5,000 req/hour. Stored only for this
                    session.
                  </p>
                  <a
                    href={TOKEN_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2"
                  >
                    How to get a token →
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
