/**
 * Highlights dangerous keywords in text with red color
 * Keywords include: powershell, cmd.exe, ncat, nc, wget, curl
 */
export const highlightDangerousKeywords = (text: string): string => {
  const dangerousKeywords = [
    'powershell',
    'cmd.exe',
    'ncat',
    'nc',
    'wget',
    'curl',
    'bash',
    'sh',
    'exec',
    'eval',
    'shell',
    'exploit',
    'payload',
    'malware',
    'ransomware',
    'trojan',
    'backdoor'
  ];

  let highlightedText = text;

  dangerousKeywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlightedText = highlightedText.replace(
      regex,
      '<span style="color: hsl(var(--danger)); font-weight: 600;">$1</span>'
    );
  });

  return highlightedText;
};

/**
 * React component wrapper for rendering highlighted text
 */
export const HighlightedText = ({ text }: { text: string }) => {
  return (
    <span 
      dangerouslySetInnerHTML={{ 
        __html: highlightDangerousKeywords(text) 
      }} 
    />
  );
};
