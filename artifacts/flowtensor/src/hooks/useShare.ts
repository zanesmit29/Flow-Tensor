import { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import type { ParseResponse } from '@workspace/api-client-react';

export function useShare(
  data: ParseResponse | undefined,
  cardRef: React.RefObject<HTMLDivElement | null>
) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!data || !cardRef.current || isSharing) return;

    setIsSharing(true);
    try {
      // Give the browser a tick to ensure the off-screen card is painted
      await new Promise(r => setTimeout(r, 80));

      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 2,
        cacheBust: true,
      });

      // Download PNG
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'flowtensor-pipeline.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Copy tweet text
      const url = window.location.origin;
      const tweet =
        `Just visualized my ML pipeline with FlowTensor 🔥 Check it out → ${url} #DataScience #PyTorch #100DaysOfML`;
      await navigator.clipboard.writeText(tweet);

      toast({
        title: 'Card downloaded + tweet copied to clipboard 🚀',
        description: 'flowtensor-pipeline.png saved to your downloads.',
      });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  }, [data, cardRef, isSharing, toast]);

  return { handleShare, isSharing };
}
