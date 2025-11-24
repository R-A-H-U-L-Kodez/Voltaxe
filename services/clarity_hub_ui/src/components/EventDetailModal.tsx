import React, { useEffect } from 'react';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { Event } from '../types';

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
}

export const EventDetailModal = ({ event, onClose }: EventDetailModalProps) => {
  const [copied, setCopied] = React.useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCopy = async () => {
    const jsonString = JSON.stringify(event, null, 2);
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJson = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={onClose}
    >
      <div 
        className="card max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Event Details</h2>
            <p className="text-muted-foreground text-sm">
              Event ID: <span style={{ color: 'hsl(var(--primary-gold))' }}>{event.id}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-smooth"
              style={{
                backgroundColor: copied ? 'hsl(var(--success) / 0.2)' : 'hsl(var(--primary-gold) / 0.2)',
                color: copied ? 'hsl(var(--success))' : 'hsl(var(--primary-gold))'
              }}
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-smooth hover:bg-white/5"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Key-Value Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Hostname</p>
                <p className="text-foreground font-semibold">{event.hostname}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Type</p>
                <p className="text-foreground font-semibold">{event.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Severity</p>
                <p className="text-foreground font-semibold">{event.severity}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Timestamp</p>
                <p className="text-foreground font-semibold">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </div>

            {/* Raw JSON */}
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-2">Raw JSON Data</p>
              <pre 
                className="p-4 rounded-lg overflow-x-auto text-sm font-mono"
                style={{ 
                  backgroundColor: 'hsl(var(--muted) / 0.3)',
                  border: '1px solid hsl(var(--border))'
                }}
              >
                <code className="text-foreground">
                  {formatJson(event)}
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t flex justify-end"
          style={{ 
            borderColor: 'hsl(var(--border))',
            backgroundColor: 'hsl(var(--card) / 0.5)'
          }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium transition-smooth"
            style={{
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
