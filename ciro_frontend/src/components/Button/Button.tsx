import React from 'react';
import styled from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const StyledButton = styled.button<ButtonProps>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 150ms ease-out;
  white-space: nowrap;

  /* Sizing */
  padding: ${props => {
    const sizes = { sm: '8px 16px', md: '12px 24px', lg: '16px 32px' };
    return sizes[props.size || 'md'];
  }};

  font-size: ${props => {
    const sizes = { sm: '13px', md: '14px', lg: '16px' };
    return sizes[props.size || 'md'];
  }};

  height: ${props => {
    const sizes = { sm: '32px', md: '40px', lg: '48px' };
    return sizes[props.size || 'md'];
  }};

  /* Variants */
  ${props => {
    const variants = {
      primary: `
        background-color: #3B82F6;
        color: #fff;

        &:hover:not(:disabled) {
          background-color: #2563EB;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      `,
      secondary: `
        background-color: transparent;
        color: #F9FAFB;
        border: 1px solid var(--border);

        &:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: var(--border-light);
        }
      `,
      danger: `
        background-color: #EF4444;
        color: #fff;

        &:hover:not(:disabled) {
          background-color: #DC2626;
        }
      `,
      ghost: `
        background-color: transparent;
        color: var(--text-secondary);

        &:hover:not(:disabled) {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.05);
        }
      `
    };
    return variants[props.variant || 'primary'];
  }};

  /* States */
  ${props => props.fullWidth && 'width: 100%;'}
  
  ${props => props.disabled && `
    opacity: 0.5;
    cursor: not-allowed;
  `}

  /* Accessibility */
  &:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  ...props
}) => (
  <StyledButton
    variant={variant}
    size={size}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? '⏳' : children}
  </StyledButton>
);
