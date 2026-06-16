import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Pause, Play, Square, Loader2 } from 'lucide-react';

/**
 * VoiceControlPanel Component
 * Displays controls for voice assistant interaction
 * Features:
 * - Microphone toggle (listen/stop)
 * - Volume controls
 * - Pause/Resume speech
 * - Replay current response
 * - Status indicators
 * - Visual feedback
 */
export const VoiceControlPanel = ({
  // State
  isListening = false,
  isSpeaking = false,
  isPausedSpeaking = false,
  micStatus = 'idle', // idle, listening, processing, speaking, paused
  error = '',
  listeningText = '',
  speakingText = '',

  // Methods
  onStartListening = () => {},
  onStopListening = () => {},
  onTogglePause = () => {},
  onStop = () => {},
  onReplay = () => {},
  onContinuousListening = () => {},

  // Options
  showContinuousOption = true,
  compact = false,
  showStatus = true,
  className = '',
}) => {
  const statusColors = {
    idle: 'text-slate-400',
    listening: 'text-red-500 animate-pulse',
    processing: 'text-violet-500 animate-pulse',
    speaking: 'text-emerald-500 animate-pulse',
    paused: 'text-yellow-500',
  };

  const statusLabels = {
    idle: 'Ready',
    listening: 'Listening...',
    processing: 'Processing...',
    speaking: 'Speaking...',
    paused: 'Paused',
  };

  // Compact Mode - Single Row Controls
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800/60 ${className}`}
      >
        {/* Microphone Toggle */}
        <button
          onClick={isListening ? onStopListening : onStartListening}
          className={`p-2 rounded-lg transition-all ${
            isListening
              ? 'bg-red-950/50 text-red-500 border border-red-800/40'
              : 'bg-slate-800/40 text-slate-400 hover:text-violet-400 border border-slate-700/40 hover:border-violet-500/30'
          }`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>

        {/* Speaking Controls */}
        {isSpeaking && (
          <>
            <button
              onClick={onTogglePause}
              className="p-2 rounded-lg bg-slate-800/40 text-slate-400 hover:text-yellow-400 border border-slate-700/40 hover:border-yellow-500/30 transition-all"
              title={isPausedSpeaking ? 'Resume' : 'Pause'}
            >
              {isPausedSpeaking ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onStop}
              className="p-2 rounded-lg bg-slate-800/40 text-slate-400 hover:text-rose-400 border border-slate-700/40 hover:border-rose-500/30 transition-all"
              title="Stop speaking"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={onReplay}
              className="p-2 rounded-lg bg-slate-800/40 text-slate-400 hover:text-emerald-400 border border-slate-700/40 hover:border-emerald-500/30 transition-all"
              title="Replay response"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Status Indicator */}
        {showStatus && (
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold ${statusColors[micStatus]}`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {statusLabels[micStatus]}
          </span>
        )}
      </div>
    );
  }

  // Full Mode - Comprehensive Controls
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200">Voice Assistant Controls</h3>
        <span
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-lg ${
            statusColors[micStatus]
          } bg-slate-800/40 border border-slate-700/40`}
        >
          <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
          {statusLabels[micStatus]}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Listening Text */}
      {isListening && listeningText && (
        <div className="p-3 rounded-lg bg-violet-950/40 border border-violet-800/60">
          <p className="text-xs text-slate-400 font-semibold mb-1">Recognized Text:</p>
          <p className="text-sm text-violet-300 italic">"{listeningText}"</p>
        </div>
      )}

      {/* Speaking Text */}
      {isSpeaking && speakingText && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
          <p className="text-xs text-slate-400 font-semibold mb-1">Speaking:</p>
          <p className="text-sm text-emerald-300 italic">"{speakingText}"</p>
        </div>
      )}

      {/* Main Controls */}
      <div className="space-y-3">
        {/* Microphone Controls */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Microphone Input
          </label>
          <div className="flex gap-2">
            <button
              onClick={onStartListening}
              disabled={isListening}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                isListening
                  ? 'bg-slate-800/40 text-slate-400 cursor-not-allowed opacity-50 border border-slate-700/40'
                  : 'bg-violet-600 text-white hover:bg-violet-700 border border-violet-500/40 shadow-md'
              }`}
              title="Start listening for voice input"
            >
              <Mic className="h-4 w-4" />
              Start Listening
            </button>

            {isListening && (
              <button
                onClick={onStopListening}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm bg-red-600/80 text-white hover:bg-red-700 border border-red-500/40 transition-all shadow-md"
                title="Stop listening"
              >
                <MicOff className="h-4 w-4" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Continuous Listening Option */}
        {showContinuousOption && (
          <button
            onClick={onContinuousListening}
            className="w-full px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700/60 bg-slate-800/40 text-slate-300 hover:text-slate-200 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all"
            title="Keep listening continuously"
          >
            🔄 Enable Continuous Listening
          </button>
        )}

        {/* Speech Controls */}
        {(isSpeaking || isPausedSpeaking) && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Speech Controls
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onTogglePause}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-semibold text-xs bg-yellow-600/60 text-yellow-100 hover:bg-yellow-600/80 border border-yellow-500/40 transition-all"
                title={isPausedSpeaking ? 'Resume speech' : 'Pause speech'}
              >
                {isPausedSpeaking ? (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </>
                )}
              </button>

              <button
                onClick={onStop}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-semibold text-xs bg-rose-600/60 text-rose-100 hover:bg-rose-600/80 border border-rose-500/40 transition-all"
                title="Stop speech"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Stop
              </button>

              <button
                onClick={onReplay}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-semibold text-xs bg-emerald-600/60 text-emerald-100 hover:bg-emerald-600/80 border border-emerald-500/40 transition-all"
                title="Replay response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Replay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="space-y-2 pt-3 border-t border-slate-800/60">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Features</p>
        <ul className="space-y-1.5 text-xs text-slate-400">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Speech-to-text voice input
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Text-to-speech response output
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            Pause, resume, and replay options
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Real-time waveform visualization
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceControlPanel;
