import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --color-primary: #3B82F6;
    --color-danger: #EF4444;
    --color-warning: #F59E0B;
    --color-success: #10B981;
    
    --bg-primary: #0A0E1A;
    --bg-secondary: #111827;
    
    --text-primary: #F9FAFB;
    --text-secondary: #9CA3AF;
    --text-muted: #6B7280;
    
    --border: rgba(255, 255, 255, 0.08);
    --border-light: rgba(255, 255, 255, 0.15);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    overflow: hidden;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 4px;

    &:hover {
      background: var(--text-secondary);
    }
  }
`;

export default GlobalStyles;
