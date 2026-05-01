import { useState, useRef, useCallback, useEffect } from 'react';

const useInterview = () => {
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState([]);
  const [report, setReport] = useState(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const ws = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const currentAudioSource = useRef(null);
  const sessionId = useRef(null);

  // ── Cleanup: runs when the component unmounts (user navigates away) ──
  const cleanup = useCallback(() => {
    // Stop mic recording
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      try { mediaRecorder.current.stop(); } catch (_) {}
    }
    if (mediaRecorder.current?.stream) {
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    }

    // Stop AI audio playback
    if (currentAudioSource.current) {
      try {
        currentAudioSource.current.pause();
        currentAudioSource.current.src = '';
      } catch (_) {}
      currentAudioSource.current = null;
    }

    // Close WebSocket
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }

    setIsRecording(false);
    setIsAiSpeaking(false);
  }, []);

  useEffect(() => {
    // Handle browser tab close / page refresh
    const handleBeforeUnload = () => cleanup();
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup when component unmounts (navigate to dashboard etc.)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, [cleanup]);

  // --- Start interview session ---
  const startInterview = async (email, resume, jd) => {
    setStatus('connecting');

    // Upload resume/JD context first
    const formData = new FormData();
    formData.append('email', email);
    if (resume) formData.append('resume', resume);
    if (jd) formData.append('job_description', jd);

    try {
      await fetch('/api/upload-context', { method: 'POST', body: formData });
    } catch (e) {
      console.error("Context upload failed", e);
    }

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/interview?email=${encodeURIComponent(email)}`;

    ws.current = new WebSocket(wsUrl);
    ws.current.binaryType = 'arraybuffer';

    ws.current.onopen = () => {
      setStatus('interviewing');
    };

    ws.current.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);
        if (msg.type === 'session_id') {
          sessionId.current = msg.session_id;
        } else if (msg.type === 'transcript') {
          setTranscript(prev => [...prev, {
            role: msg.speaker === 'recruiter' ? 'assistant' : 'user',
            content: msg.text
          }]);
        } else if (msg.type === 'speaking_start') {
          setIsAiSpeaking(true);
        } else if (msg.type === 'speaking_done' || msg.type === 'interrupted') {
          setIsAiSpeaking(false);
        } else if (msg.type === 'generating_report') {
          setStatus('analyzing');
        } else if (msg.type === 'report') {
          setReport(msg.report);
          setStatus('finished');
        }
      } else {
        // Binary: AI audio
        await playAudio(event.data);
      }
    };

    ws.current.onclose = () => {
      if (status !== 'finished') setStatus('idle');
    };
  };

  // --- Record audio ---
  const startRecording = useCallback(async () => {
    if (isRecording || isAiSpeaking) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied. Please allow microphone in browser settings.");
    }
  }, [isRecording, isAiSpeaking]);

  // --- Stop recording and send ---
  const stopAndSend = useCallback(() => {
    if (!isRecording || !mediaRecorder.current) return;

    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(arrayBuffer);
      }
      // Stop all mic tracks
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    };

    mediaRecorder.current.stop();
    setIsRecording(false);
  }, [isRecording]);

  // --- Play AI audio (using HTML Audio element — more browser-compatible) ---
  const playAudio = (arrayBuffer) => {
    return new Promise((resolve) => {
      // Stop any current audio
      if (currentAudioSource.current) {
        currentAudioSource.current.pause();
        currentAudioSource.current.src = '';
        currentAudioSource.current = null;
      }

      setIsAiSpeaking(true);

      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      currentAudioSource.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsAiSpeaking(false);
        currentAudioSource.current = null;
        resolve();
      };

      audio.onerror = (e) => {
        console.error('[Audio] Playback error:', e);
        URL.revokeObjectURL(url);
        setIsAiSpeaking(false);
        currentAudioSource.current = null;
        resolve();
      };

      audio.play().catch(err => {
        console.error('[Audio] play() blocked:', err);
        setIsAiSpeaking(false);
        resolve();
      });
    });
  };

  // --- End interview ---
  const endInterview = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'end_interview' }));
      // Status will update to 'analyzing' when the server sends 'generating_report'
      // and then 'finished' when the report arrives via WebSocket
    }
  };

  return {
    status, transcript, report, isAiSpeaking,
    isRecording, startRecording, stopAndSend,
    startInterview, endInterview, setStatus
  };
};

export default useInterview;
