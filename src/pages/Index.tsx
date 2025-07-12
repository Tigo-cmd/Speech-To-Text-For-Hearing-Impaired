
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Upload, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
 //const [apiEndpoint, setApiEndpoint] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const apiEndpoint = "https://emmanueltigo.pythonanywhere.com/transcribe"

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record audio",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast({
        title: "Recording stopped",
        description: `Recorded ${recordingTime} seconds of audio`,
      });
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const transcribeAudio = async () => {
    if (!audioBlob || !apiEndpoint) {
      toast({
        title: "Missing requirements",
        description: "Please record audio and provide an API endpoint",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.transcription) {
        setTranscription(result.transcription);     
        toast({
          title: "Transcription complete",
          description: "Your audio has been successfully transcribed",
        });
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: "Unable to transcribe audio. Please check your API endpoint.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setTranscription('');
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Nisha RealTime Audio Transcription</h1>
          <p className="text-gray-600">Record audio and Transcribe to Text</p>
        </div>

        {/* Recording Section */}
        <Card className="backdrop-blur-sm bg-white/80 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Record Clear Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Record Button */}
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                size="lg"
                className={`w-24 h-24 rounded-full transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
              
              {/* Timer */}
              <div className="text-2xl font-mono text-gray-700">
                {formatTime(recordingTime)}
              </div>
              
              <p className="text-sm text-gray-500">
                {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
              </p>
            </div>

            {/* Audio Playback */}
            {audioUrl && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={togglePlayback}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? 'Pause' : 'Play Recording'}
                  </Button>
                  
                  <Button
                    onClick={clearRecording}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear
                  </Button>
                </div>
                
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="w-full"
                  controls
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="backdrop-blur-sm bg-white/80 shadow-xl">
          <CardContent className="space-y-4">
            <Button
              onClick={transcribeAudio}
              disabled={!audioBlob || !apiEndpoint || isTranscribing}
              className="w-full"
            >
              {isTranscribing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Transcribing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Transcribe Audio
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Transcription Results */}
        <Card className="backdrop-blur-sm bg-white/80 shadow-xl">
          <CardHeader>
            <CardTitle>Transcription Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Transcribed text will appear here..."
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              className="min-h-32 resize-none"
              readOnly={!transcription}
            />
            {transcription && (
              <p className="text-xs text-gray-500 mt-2">
                You can edit the transcription above if needed
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
