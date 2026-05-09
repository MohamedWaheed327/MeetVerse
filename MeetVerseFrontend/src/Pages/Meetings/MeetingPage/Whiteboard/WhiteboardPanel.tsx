import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { getOrCreateWhiteboardSession } from "../../../../services/whiteboard";

interface WhiteboardPanelProps {
  meetingId: string;
}

export default function WhiteboardPanel({ meetingId }: WhiteboardPanelProps) {
  const [boardUrl, setBoardUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBoard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const session = await getOrCreateWhiteboardSession(meetingId);
        
        if (isMounted) {
          if (session.miroBoardUrl) {
            setBoardUrl(session.miroBoardUrl);
          } else {
            setError("Could not retrieve the whiteboard URL.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load whiteboard session.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBoard();

    return () => {
      isMounted = false;
    };
  }, [meetingId]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#181B26] rounded-[2.5rem] border-2 border-[#2A2E3B] shadow-xl">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Preparing Whiteboard...</p>
      </div>
    );
  }

  if (error || !boardUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#181B26] rounded-[2.5rem] border-2 border-[#2A2E3B] shadow-xl text-red-400">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="font-medium">{error || "Whiteboard is currently unavailable."}</p>
      </div>
    );
  }

  // To embed Miro, we usually need to convert the view link to an embed link
  // The Miro API returns something like: https://miro.com/app/board/uXjVxxxxxx=/
  // Embed format: https://miro.com/app/live-embed/uXjVxxxxxx=/?autoplay=true
  let embedUrl = boardUrl;
  if (boardUrl.includes("/app/board/")) {
    embedUrl = boardUrl.replace("/app/board/", "/app/live-embed/") + "?autoplay=true";
  }

  return (
    <div className="w-full h-full rounded-[2.5rem] border-2 border-[#2A2E3B] overflow-hidden shadow-xl bg-[#181B26] relative">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full border-0"
        allow="fullscreen; clipboard-read; clipboard-write"
        allowFullScreen
        title="Miro Collaborative Whiteboard"
      />
    </div>
  );
}
