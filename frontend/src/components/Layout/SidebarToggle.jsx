import React from 'react';
import './SidebarToggle.css';

/**
 * SidebarToggle
 * Renders the Claude.ai-style sidebar toggle icon:
 *   • A solid left panel rectangle
 *   • Three horizontal lines on the right side
 * When `collapsed` is true the icon is mirrored horizontally so
 * the "lines" side points toward the open direction.
 */
const SidebarToggle = ({ collapsed, onToggle, light = false }) => (
  <button
    className={[
      'sidebar-toggle-btn',
      collapsed ? 'sidebar-toggle-btn--collapsed' : '',
      light     ? 'sidebar-toggle-btn--light'     : '',
    ].filter(Boolean).join(' ')}
    onClick={onToggle}
    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer rounded rectangle — the "window" frame */}
      <rect
        x="1"
        y="1"
        width="16"
        height="16"
        rx="3"
        ry="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Solid left panel */}
      <rect
        x="1"
        y="1"
        width="5.5"
        height="16"
        rx="3"
        ry="3"
        fill="currentColor"
      />
      {/* Square off the right edge of the solid panel */}
      <rect x="4.5" y="1" width="2" height="16" fill="currentColor" />

      {/* Three horizontal lines — content area on the right */}
      <line x1="9"  y1="5.5" x2="15.5" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9"  y1="9"   x2="15.5" y2="9"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9"  y1="12.5" x2="15.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </button>
);

export default SidebarToggle;
