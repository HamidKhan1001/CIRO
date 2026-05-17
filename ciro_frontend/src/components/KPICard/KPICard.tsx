import React from 'react';
import styled from 'styled-components';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    percent: number;
    label: string;
  };
  color?: 'danger' | 'warning' | 'success' | 'info';
}

const StyledCard = styled.div<{ color: string }>`
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 200ms ease;
  cursor: pointer;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0.02) 100%
    );
    border-color: var(--border-light);
    box-shadow: 0 0 24px rgba(59, 130, 246, 0.1);
    transform: translateY(-4px);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
`;

const IconContainer = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: ${props => {
    const colors = {
      danger: 'rgba(239, 68, 68, 0.1)',
      warning: 'rgba(245, 158, 11, 0.1)',
      success: 'rgba(16, 185, 129, 0.1)',
      info: 'rgba(59, 130, 246, 0.1)'
    };
    return colors[props.color] || colors.info;
  }};
  color: ${props => {
    const colors = {
      danger: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
      info: '#3B82F6'
    };
    return colors[props.color] || colors.info;
  }};
  font-size: 24px;
`;

const Value = styled.div`
  font-size: 48px;
  font-weight: 700;
  color: var(--text-primary);
`;

const TrendContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TrendBadge = styled.span<{ direction: 'up' | 'down' }>`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${props => 
    props.direction === 'up' 
      ? 'rgba(16, 185, 129, 0.1)' 
      : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => 
    props.direction === 'up' 
      ? '#10B981' 
      : '#EF4444'};
`;

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'info'
}) => (
  <StyledCard color={color}>
    <Header>
      <Title>{title}</Title>
      {icon && <IconContainer color={color}>{icon}</IconContainer>}
    </Header>
    <div>
      <Value>{value}</Value>
      {trend && (
        <TrendContainer>
          <TrendBadge direction={trend.direction}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.percent}%
          </TrendBadge>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {trend.label}
          </span>
        </TrendContainer>
      )}
    </div>
  </StyledCard>
);
