import { useState, useEffect, useRef } from "react";
import { X, Copy, Download, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ConsoleLogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  logs: string[];
  isLoading?: boolean;
}

export default function ConsoleLog({ isOpen, onClose, title, logs, isLoading = false }: ConsoleLogProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyLogs = () => {
    const logsText = logs.join('\n');
    navigator.clipboard.writeText(logsText);
    toast({
      title: "Copied to clipboard",
      description: "Console logs have been copied to your clipboard.",
    });
  };

  const handleDownloadLogs = () => {
    const logsText = logs.join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Console logs are being downloaded.",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className={`bg-white rounded-lg shadow-xl transition-all duration-300 ${
          isMinimized ? 'w-96 h-16' : 'w-[50vw] h-[50vh]'
        }`}
        style={{ minWidth: '400px', minHeight: isMinimized ? '64px' : '300px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5" />
            <h3 className="font-semibold">{title}</h3>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-gray-700"
            >
              {isMinimized ? '□' : '−'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLogs}
              className="text-white hover:bg-gray-700"
              disabled={logs.length === 0}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadLogs}
              className="text-white hover:bg-gray-700"
              disabled={logs.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Console Content */}
        {!isMinimized && (
          <div 
            ref={logContainerRef}
            className="p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-y-auto rounded-b-lg"
            style={{ height: 'calc(50vh - 64px)' }}
          >
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">
                {isLoading ? 'Initializing...' : 'No logs available'}
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap">
                  {log}
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-yellow-400 animate-pulse">
                Executing command...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}