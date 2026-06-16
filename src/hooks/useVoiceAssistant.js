import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for managing voice recognition and text-to-speech
 * Features:
 * - Speech recognition with Web Speech API
 * - Text-to-speech with Web Speech API
 * - Microphone status tracking
 * - Voice response control (stop, pause, replay)
 * - Continuous listening mode
 */
export const useVoiceAssistant = () => {
  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [listeningText, setListeningText] = useState('');

  // Text-to-Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPausedSpeaking, setIsPausedSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakingText, setSpeakingText] = useState('');

  // Status indicators
  const [micStatus, setMicStatus] = useState('idle'); // idle, listening, processing, speaking, paused
  const [error, setError] = useState('');
  const [wavAmplitudes, setWavAmplitudes] = useState([]);

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const continuousListeningRef = useRef(false);

  // Initialize speech APIs on mount
  useEffect(() => {
    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionSupported(true);
      recognitionRef.current = new SpeechRecognition();
      setupRecognition();
    }

    // Check for Text-to-Speech support
    if (window.speechSynthesis) {
      setSpeechSupported(true);
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * Setup speech recognition event handlers
   */
  const setupRecognition = () => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setMicStatus('listening');
      setError('');
      setWavAmplitudes([]);
      startAudioVisualization();
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Filter out non-English characters (Telugu, Hindi, etc.)
      const cleanFinal = filterNonEnglish(finalTranscript);
      const cleanInterim = filterNonEnglish(interimTranscript);

      if (cleanFinal) {
        setListeningText(cleanFinal);
      } else if (cleanInterim) {
        setListeningText(cleanInterim);
      }
    };

    recognition.onerror = (event) => {
      setError(`Voice recognition error: ${event.error}`);
      setMicStatus('idle');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setMicStatus('idle');
      stopAudioVisualization();

      // Auto-restart if continuous listening is enabled
      if (continuousListeningRef.current && !error) {
        setTimeout(() => {
          if (recognitionRef.current && continuousListeningRef.current) {
            recognitionRef.current.start();
          }
        }, 1000);
      }
    };
  };

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(
    (continuous = false) => {
      if (!recognitionSupported) {
        setError('Voice recognition is not supported in your browser');
        return;
      }

      if (isListening) return;

      continuousListeningRef.current = continuous;
      setListeningText('');
      setError('');

      try {
        recognitionRef.current.start();
      } catch (err) {
        setError('Failed to start voice recognition');
      }
    },
    [recognitionSupported, isListening]
  );

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
      setMicStatus('idle');
      stopAudioVisualization();
    }
    continuousListeningRef.current = false;
  }, [isListening]);

  /**
   * Speak text response using Text-to-Speech
   */
  const speakResponse = useCallback(
    (text, options = {}) => {
      if (!speechSupported) {
        setError('Text-to-speech is not supported in your browser');
        return;
      }

      const {
        rate = 0.95,
        pitch = 1,
        volume = 1,
        lang = 'en-US',
        onComplete = null,
      } = options;

      // Cancel any existing speech
      if (synthRef.current) {
        synthRef.current.cancel();
      }

      setSpeakingText(text);
      setMicStatus('speaking');
      setIsSpeaking(true);
      setIsPausedSpeaking(false);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.lang = lang;

      utterance.onstart = () => {
        setMicStatus('speaking');
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setMicStatus('idle');
        setIsSpeaking(false);
        setIsPausedSpeaking(false);
        setSpeakingText('');
        if (onComplete) onComplete();
      };

      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setMicStatus('idle');
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [speechSupported]
  );

  /**
   * Pause/Resume speech
   */
  const togglePauseSpeech = useCallback(() => {
    if (!synthRef.current) return;

    if (isPausedSpeaking) {
      synthRef.current.resume();
      setIsPausedSpeaking(false);
      setMicStatus('speaking');
    } else {
      synthRef.current.pause();
      setIsPausedSpeaking(true);
      setMicStatus('paused');
    }
  }, [isPausedSpeaking]);

  /**
   * Stop speech
   */
  const stopSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPausedSpeaking(false);
      setMicStatus('idle');
      setSpeakingText('');
    }
  }, []);

  /**
   * Replay current response
   */
  const replaySpeech = useCallback(() => {
    if (speakingText) {
      stopSpeech();
      setTimeout(() => {
        speakResponse(speakingText);
      }, 200);
    }
  }, [speakingText, stopSpeech, speakResponse]);

  /**
   * Get available voices
   */
  const getAvailableVoices = useCallback(() => {
    if (!synthRef.current) return [];
    return synthRef.current.getVoices();
  }, []);

  /**
   * Set voice by index
   */
  const setVoice = useCallback(
    (voiceIndex) => {
      const voices = getAvailableVoices();
      if (voiceIndex >= 0 && voiceIndex < voices.length && utteranceRef.current) {
        utteranceRef.current.voice = voices[voiceIndex];
      }
    },
    [getAvailableVoices]
  );

  /**
   * Start audio visualization for microphone input
   */
  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      microphone.connect(analyser);
      analyzerRef.current = analyser;

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        analyser.getByteFrequencyData(dataArray);
        const amplitudes = Array.from(dataArray)
          .slice(0, 30)
          .map((v) => v / 255);
        setWavAmplitudes(amplitudes);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch (err) {
      console.error('Microphone access error:', err);
    }
  }, []);

  /**
   * Stop audio visualization
   */
  const stopAudioVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setWavAmplitudes([]);
  }, []);

  /**
   * Filter non-English characters
   */
  const filterNonEnglish = (text) => {
    // Remove Telugu characters (U+0C00 - U+0C7F)
    // Remove Hindi characters (U+0900 - U+097F)
    // Remove other common non-English scripts
    return text
      .replace(/[\u0c00-\u0c7f]/g, '') // Telugu
      .replace(/[\u0900-\u097f]/g, '') // Hindi
      .replace(/[\u0a00-\u0a7f]/g, '') // Punjabi
      .replace(/[\u0b00-\u0b7f]/g, '') // Oriya
      .trim();
  };

  return {
    // Recognition state
    isListening,
    recognitionSupported,
    listeningText,

    // Speech state
    isSpeaking,
    isPausedSpeaking,
    speechSupported,
    speakingText,

    // Status
    micStatus, // 'idle', 'listening', 'processing', 'speaking', 'paused'
    error,
    wavAmplitudes,

    // Methods
    startListening,
    stopListening,
    speakResponse,
    togglePauseSpeech,
    stopSpeech,
    replaySpeech,
    getAvailableVoices,
    setVoice,
    clearError: () => setError(''),
  };
};
