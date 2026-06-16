/**
 * Voice AI Assistant Configuration
 * Customize speech recognition and text-to-speech settings
 */

export const VOICE_CONFIG = {
  // Speech Recognition Settings
  recognition: {
    // Language code for speech recognition
    language: 'en-IN',
    
    // Alternative languages to try
    supportedLanguages: [
      { code: 'en-IN', label: 'English (India)' },
      { code: 'en-US', label: 'English (US)' },
      { code: 'en-GB', label: 'English (UK)' },
      { code: 'en-AU', label: 'English (Australia)' },
    ],
    
    // Enable interim results while speaking
    interimResults: true,
    
    // Maximum number of alternative transcriptions
    maxAlternatives: 1,
    
    // Continuous recognition
    continuous: false,
    
    // Recognition timeout (ms)
    timeout: 30000,
    
    // Silence timeout (ms)
    silenceTimeout: 5000,
  },

  // Text-to-Speech Settings
  synthesis: {
    // Default language for speech output
    language: 'en-US',
    
    // Speech rate (0.1 to 10)
    rate: 0.95,
    
    // Voice pitch (0 to 2)
    pitch: 1,
    
    // Volume (0 to 1)
    volume: 1,
    
    // Preferred voice (if available)
    preferredVoice: null, // Can be set dynamically
    
    // Available voice options
    voiceOptions: [
      { label: 'Default', value: null },
      { label: 'Natural', value: 'natural' },
      { label: 'Expressive', value: 'expressive' },
    ],
  },

  // UI/UX Settings
  ui: {
    // Show wave animation while listening
    showWaveAnimation: true,
    
    // Wave animation style
    waveStyle: 'bars', // 'bars', 'line', 'dots', 'circle'
    
    // Wave animation size
    waveSize: 'md', // 'sm', 'md', 'lg'
    
    // Show microphone status indicator
    showStatusIndicator: true,
    
    // Show voice control panel by default
    showControlPanel: false,
    
    // Auto-collapse voice panel after action
    autoCollapsePanel: true,
    
    // Show recognized text in real-time
    showRecognizedText: true,
    
    // Show speaking text in real-time
    showSpeakingText: true,
  },

  // Behavior Settings
  behavior: {
    // Auto-speak AI responses
    autoSpeak: true,
    
    // Auto-submit query when speech recognized
    autoSubmit: true,
    
    // Enable continuous listening by default
    continuousListeningDefault: false,
    
    // Auto-focus input after recognition
    autoFocusInput: false,
    
    // Play sound effects
    playSounds: true,
    
    // Sound effect volume (0 to 1)
    soundVolume: 0.5,
    
    // Show notifications for voice events
    showNotifications: true,
    
    // Notification timeout (ms)
    notificationTimeout: 3000,
  },

  // Feature Toggles
  features: {
    // Enable voice recognition
    enableRecognition: true,
    
    // Enable text-to-speech
    enableSynthesis: true,
    
    // Enable wave visualization
    enableWaveVisualization: true,
    
    // Enable continuous listening mode
    enableContinuousListening: true,
    
    // Enable voice control panel
    enableControlPanel: true,
    
    // Enable voice shortcuts/commands
    enableVoiceCommands: false, // Future feature
    
    // Enable voice preferences saving
    enablePreferencesSaving: true,
  },

  // Error Handling
  errors: {
    // Retry on error
    retryOnError: true,
    
    // Max retry attempts
    maxRetries: 3,
    
    // Show error details
    showErrorDetails: true,
    
    // Error message timeout (ms)
    errorTimeout: 5000,
  },

  // Accessibility Settings
  accessibility: {
    // Enable screen reader support
    enableScreenReader: true,
    
    // Enable keyboard navigation
    enableKeyboardNav: true,
    
    // High contrast mode
    highContrast: false,
    
    // Reduce animations
    reduceAnimations: false,
    
    // Adjust text size multiplier
    textSizeMultiplier: 1, // 0.8, 0.9, 1, 1.1, 1.2
  },

  // Analytics Settings
  analytics: {
    // Track voice interactions
    trackInteractions: true,
    
    // Track recognition accuracy
    trackAccuracy: true,
    
    // Track feature usage
    trackFeatureUsage: true,
  },

  // Performance Settings
  performance: {
    // Max simultaneous audio streams
    maxAudioStreams: 1,
    
    // Audio buffer size
    audioBufferSize: 256,
    
    // Animation frame rate (fps)
    animationFrameRate: 30,
    
    // Debounce recognition (ms)
    debounceRecognition: 100,
  },
};

/**
 * Get user voice preferences from localStorage
 */
export const getUserVoicePreferences = () => {
  try {
    const stored = localStorage.getItem('voice-preferences');
    return stored ? JSON.parse(stored) : VOICE_CONFIG;
  } catch {
    return VOICE_CONFIG;
  }
};

/**
 * Save user voice preferences to localStorage
 */
export const saveUserVoicePreferences = (preferences) => {
  try {
    localStorage.setItem('voice-preferences', JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
};

/**
 * Reset voice preferences to defaults
 */
export const resetVoicePreferences = () => {
  try {
    localStorage.removeItem('voice-preferences');
    return true;
  } catch {
    return false;
  }
};

/**
 * Merge user preferences with defaults
 */
export const mergeVoicePreferences = (userPrefs) => {
  return {
    recognition: { ...VOICE_CONFIG.recognition, ...userPrefs?.recognition },
    synthesis: { ...VOICE_CONFIG.synthesis, ...userPrefs?.synthesis },
    ui: { ...VOICE_CONFIG.ui, ...userPrefs?.ui },
    behavior: { ...VOICE_CONFIG.behavior, ...userPrefs?.behavior },
    features: { ...VOICE_CONFIG.features, ...userPrefs?.features },
    errors: { ...VOICE_CONFIG.errors, ...userPrefs?.errors },
    accessibility: { ...VOICE_CONFIG.accessibility, ...userPrefs?.accessibility },
    analytics: { ...VOICE_CONFIG.analytics, ...userPrefs?.analytics },
    performance: { ...VOICE_CONFIG.performance, ...userPrefs?.performance },
  };
};

/**
 * Voice command shortcuts (Future enhancement)
 */
export const VOICE_COMMANDS = {
  'open tickets': '/tickets',
  'open devices': '/devices',
  'open teams': '/teams',
  'open training': '/training',
  'open analytics': '/analytics',
  'open attendance': '/attendance',
  'open map': '/map',
  'open users': '/users',
  'open inventory': '/inventory',
  'go to tickets': '/tickets',
  'go to devices': '/devices',
  'show tickets': '/tickets',
  'show tasks': '/tickets',
  'view attendance': '/attendance',
  'check training': '/training',
  'view reports': '/analytics',
  'create ticket': '/tickets',
  'add device': '/devices',
};

/**
 * Sound effects configuration (Future enhancement)
 */
export const VOICE_SOUNDS = {
  listeningStart: {
    url: '/sounds/listening-start.mp3',
    duration: 500,
  },
  recognitionSuccess: {
    url: '/sounds/recognition-success.mp3',
    duration: 300,
  },
  recognitionError: {
    url: '/sounds/recognition-error.mp3',
    duration: 400,
  },
  speechStart: {
    url: '/sounds/speech-start.mp3',
    duration: 200,
  },
  speechEnd: {
    url: '/sounds/speech-end.mp3',
    duration: 200,
  },
};

export default VOICE_CONFIG;
