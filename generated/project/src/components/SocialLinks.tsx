import React from 'react';
import { Github, Linkedin, Twitter, Mail, Globe } from 'lucide-react';

interface SocialLinksProps {
  className?: string;
  iconSize?: number;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ className = '', iconSize = 20 }) => {
  const socials = [
    { name: 'GitHub', icon: <Github size={iconSize} />, url: 'https://github.com' },
    { name: 'LinkedIn', icon: <Linkedin size={iconSize} />, url: 'https://linkedin.com' },
    { name: 'Twitter', icon: <Twitter size={iconSize} />, url: 'https://twitter.com' },
    { name: 'Email', icon: <Mail size={iconSize} />, url: 'mailto:contact@example.com' },
    { name: 'Website', icon: <Globe size={iconSize} />, url: 'https://example.com' }
  ];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {socials.map(social => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.name}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-slate-800/80 transition-all duration-300 shadow-md hover:-translate-y-0.5"
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
};