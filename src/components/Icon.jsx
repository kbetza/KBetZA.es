/* Iconos de línea (stroke consistente, currentColor) — portado del prototipo */
export function Icon({ name, size = 22, stroke = 1.8, style, className }) {
  const P = {
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" {...P} /><path d="M5 9.5V20h14V9.5" {...P} /><path d="M9.5 20v-5.5h5V20" {...P} /></>,
    trophy: <><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" {...P} /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" {...P} /><path d="M12 13v3M8.5 20h7M9.5 20l.5-4h4l.5 4" {...P} /></>,
    history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4.5V9H8" {...P} /><path d="M12 8v4.2l3 1.8" {...P} /></>,
    user: <><circle cx="12" cy="8" r="4" {...P} /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" {...P} /></>,
    ticket: <><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4V7.5Z" {...P} /><path d="M13 6v12" {...P} strokeDasharray="2 2.4" /></>,
    ball: <><circle cx="12" cy="12" r="9" {...P} /><path d="M12 7.2 8.6 9.7l1.3 4h4.2l1.3-4L12 7.2Z" {...P} /><path d="M12 3v4.2M4.3 9.2l4.3 .5M6.6 18.5l2.4-3.4M17.4 18.5l-2.4-3.4M19.7 9.2l-4.3 .5" {...P} /></>,
    logout: <><path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" {...P} /><path d="M17 8l4 4-4 4M21 12H9" {...P} /></>,
    chevronL: <path d="M14 6l-6 6 6 6" {...P} />,
    chevronR: <path d="M9 6l6 6-6 6" {...P} />,
    check: <path d="M5 12.5 10 17l9-10" {...P} />,
    x: <path d="M6 6l12 12M18 6 6 18" {...P} />,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" {...P} /><path d="M3.5 9.5h17M8 3v4M16 3v4" {...P} /></>,
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" {...P} />,
    shield: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" {...P} /></>,
    flame: <path d="M12 22c4 0 6.5-2.6 6.5-6 0-3.8-3.5-5.5-2.8-9.6C13 8 12.5 9.6 11.4 11 10 8.8 11 5.6 9 3 8.5 7 5.5 8.4 5.5 13c0 4 3 9 6.5 9Z" {...P} />,
    target: <><circle cx="12" cy="12" r="8.5" {...P} /><circle cx="12" cy="12" r="4.5" {...P} /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    coins: <><ellipse cx="9" cy="7" rx="5.5" ry="2.8" {...P} /><path d="M3.5 7v5c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8V7" {...P} /><path d="M9 14.6v2.6c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8V12c0-1.5-2.5-2.8-5.5-2.8" {...P} /></>,
    lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" {...P} /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...P} /><path d="M12 14.5v2.5" {...P} /></>,
    atUser: <><circle cx="12" cy="9" r="3.5" {...P} /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" {...P} /></>,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6" {...P} />,
    crown: <path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 10h-13L4 8Z" {...P} />,
    medal: <><circle cx="12" cy="14" r="5" {...P} /><path d="M9 9.5 6.5 3M15 9.5 17.5 3M12 12l1 2h-2l1-2Z" {...P} /></>,
    clock: <><circle cx="12" cy="12" r="9" {...P} /><path d="M12 7v5l3.5 2" {...P} /></>,
    expand: <path d="M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7" {...P} />,
    collapse: <path d="M21 9h-6V3M14 10l7-7M3 15h6v6M10 14l-7 7" {...P} />,
    send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" {...P} />,
    chat: <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" {...P} />,
    plus: <path d="M12 5v14M5 12h14" {...P} />,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" {...P} /><path d="M14 6l4 4" {...P} /></>,
    star: <path d="m12 3 2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.9 6.6 19.5l1.2-6L3.4 9.3l6-.7L12 3Z" {...P} />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} className={className} aria-hidden="true">
      {paths[name] || null}
    </svg>
  );
}
