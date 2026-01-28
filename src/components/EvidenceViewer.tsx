import { useState } from 'react';
import { FileText, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { getR2SignedUrl } from '@/lib/r2Storage';

interface Evidence {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  description?: string | null;
}

interface EvidenceViewerProps {
  evidence: Evidence[];
}

interface EvidenceItemProps {
  file: Evidence;
}

const EvidenceItem = ({ file }: EvidenceItemProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if the file is in permanent storage based on description
  const isInPermanentStorage = file.description?.includes('[storage:permanent]') ?? false;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (signedUrl) {
      // URL already generated, open it
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get signed URL from R2
      const bucket = isInPermanentStorage ? 'permanent' : 'temp';
      
      // Try the stored file path first
      let url = await getR2SignedUrl(file.file_url, bucket);
      
      // If file not found, try with .webp extension (in case of conversion)
      if (!url && !file.file_url.endsWith('.webp')) {
        const webpPath = file.file_url.replace(/\.[^.]+$/, '.webp');
        url = await getR2SignedUrl(webpPath, bucket);
      }
      
      if (url) {
        setSignedUrl(url);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        setError('File not found');
      }
    } catch (err) {
      console.error('Error accessing evidence file:', err);
      setError('Access error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="bg-muted rounded p-2 text-center hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-wait w-full"
    >
      {isLoading ? (
        <Loader2 className="h-8 w-8 mx-auto mb-1 text-muted-foreground animate-spin" />
      ) : error ? (
        <AlertCircle className="h-8 w-8 mx-auto mb-1 text-destructive" />
      ) : (
        <div className="relative">
          <FileText className="h-8 w-8 mx-auto mb-1 text-muted-foreground" />
          <ExternalLink className="h-3 w-3 absolute top-0 right-1/4 text-muted-foreground" />
        </div>
      )}
      <p className="text-xs text-foreground truncate">{file.file_name}</p>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </button>
  );
};

export const EvidenceViewer = ({ evidence }: EvidenceViewerProps) => {
  if (!evidence || evidence.length === 0) {
    return null;
  }

  return (
    <div>
      <span className="text-sm text-muted-foreground mb-2 block">
        Evidence ({evidence.length} files)
      </span>
      <div className="grid grid-cols-3 gap-2">
        {evidence.map((file) => (
          <EvidenceItem key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
};

export default EvidenceViewer;
