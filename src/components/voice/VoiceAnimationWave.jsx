import React from 'react';

/**
 * VoiceAnimationWave Component
 * Displays animated wave visualization while listening to user input
 * Features:
 * - Real-time frequency visualization
 * - Smooth animation transitions
 * - Responsive design
 * - Multiple animation styles
 */
export const VoiceAnimationWave = ({
  amplitudes = [],
  isActive = false,
  style = 'bars', // 'bars', 'line', 'dots', 'circle'
  color = 'from-violet-500 to-indigo-500',
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { height: 'h-6', barWidth: 'w-1', gap: 'gap-0.5', count: 15 },
    md: { height: 'h-10', barWidth: 'w-1.5', gap: 'gap-1', count: 20 },
    lg: { height: 'h-16', barWidth: 'w-2', gap: 'gap-1.5', count: 25 },
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const normalizedAmplitudes = amplitudes.slice(0, config.count);
  const paddedAmplitudes = [
    ...normalizedAmplitudes,
    ...Array(Math.max(0, config.count - normalizedAmplitudes.length)).fill(0.1),
  ];

  /**
   * Bars Style - Classic VU meter style bars
   */
  const BarsVisualization = () => (
    <div className={`flex items-center justify-center ${config.gap}`}>
      {paddedAmplitudes.map((amplitude, i) => (
        <div
          key={i}
          className={`${config.barWidth} rounded-full bg-gradient-to-t ${color} transition-all duration-100 ${
            isActive ? 'opacity-100' : 'opacity-40'
          }`}
          style={{
            height: `${Math.max(8, amplitude * 100)}%`,
            transform: isActive ? 'scaleY(1)' : 'scaleY(0.6)',
          }}
        />
      ))}
    </div>
  );

  /**
   * Line Style - Smooth waveform line
   */
  const LineVisualization = () => {
    const width = 300;
    const height = 60;
    const points = paddedAmplitudes
      .map((amp, i) => {
        const x = (i / (paddedAmplitudes.length - 1)) * width;
        const y = height / 2 - amp * (height / 2) * 0.8;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={`${isActive ? 'opacity-100' : 'opacity-40'} transition-opacity duration-300`}
      >
        <polyline
          points={points}
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  /**
   * Dots Style - Pulsing dots
   */
  const DotsVisualization = () => (
    <div className={`flex items-center justify-center ${config.gap}`}>
      {paddedAmplitudes.map((amplitude, i) => (
        <div
          key={i}
          className={`rounded-full bg-gradient-to-r ${color} transition-all duration-100`}
          style={{
            width: `${Math.max(4, amplitude * 16)}px`,
            height: `${Math.max(4, amplitude * 16)}px`,
            opacity: isActive ? Math.min(1, 0.3 + amplitude * 0.7) : 0.3,
          }}
        />
      ))}
    </div>
  );

  /**
   * Circle Style - Circular visualization
   */
  const CircleVisualization = () => {
    const radius = 40;
    const centerX = 50;
    const centerY = 50;

    const points = paddedAmplitudes
      .map((amp, i) => {
        const angle = (i / paddedAmplitudes.length) * Math.PI * 2;
        const distance = radius + amp * 15;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg
        width={120}
        height={120}
        viewBox="0 0 100 100"
        className={`${isActive ? 'opacity-100' : 'opacity-40'} transition-opacity duration-300`}
      >
        <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <polyline
          points={points}
          fill="none"
          stroke="url(#circleGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r="3"
          fill="currentColor"
          opacity="0.6"
        />
        <defs>
          <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const renderVisualization = () => {
    switch (style) {
      case 'line':
        return <LineVisualization />;
      case 'dots':
        return <DotsVisualization />;
      case 'circle':
        return <CircleVisualization />;
      case 'bars':
      default:
        return <BarsVisualization />;
    }
  };

  return (
    <div
      className={`flex items-center justify-center ${config.height} ${className}`}
      style={{
        minHeight: '40px',
      }}
    >
      {isActive ? (
        renderVisualization()
      ) : (
        <div className={`${config.height} flex items-center justify-center text-slate-400 opacity-50`}>
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-violet-500/30 to-indigo-500/30" />
        </div>
      )}
    </div>
  );
};

export default VoiceAnimationWave;
