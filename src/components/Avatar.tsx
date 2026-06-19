import React from 'react';

interface AvatarProps {
  avatar: string | undefined;
  className?: string;
  fallbackClassName?: string;
}

export default function Avatar({ avatar, className = "w-full h-full rounded-full object-cover", fallbackClassName = "" }: AvatarProps) {
  if (!avatar) {
    return (
      <div className={`w-full h-full rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-500 ${fallbackClassName}`}>
        ?
      </div>
    );
  }

  const isImage = avatar.startsWith('data:image/') || 
                  avatar.startsWith('http://') || 
                  avatar.startsWith('https://') || 
                  avatar.length > 4;

  if (isImage) {
    return (
      <img
        src={avatar}
        alt="User Visual"
        className={className}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // If loading fails, treat it as text fallback
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.parentElement) {
            const fallback = document.createElement('div');
            fallback.className = "w-full h-full rounded-full bg-indigo-505 dark:bg-zinc-800 flex items-center justify-center font-extrabold text-white";
            fallback.innerText = avatar.substring(0, 2).toUpperCase();
            target.parentElement.appendChild(fallback);
          }
        }}
      />
    );
  }

  return (
    <div className={`w-full h-full rounded-full flex items-center justify-center font-bold ${fallbackClassName}`}>
      {avatar}
    </div>
  );
}
