import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

const VideoCall = ({ roomId, userId, onCallEnd }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callActive, setCallActive] = useState(false);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('accessToken') },
    });
    socketRef.current = socket;

    const initializeLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit('join-room', { roomId, userId });

        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerConnectionRef.current = peerConnection;

        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('send-ice-candidate', {
              candidate: event.candidate,
              targetSocketId: socket.otherId,
            });
          }
        };

        peerConnection.onconnectionstatechange = () => {
          if (
            peerConnection.connectionState === 'disconnected' ||
            peerConnection.connectionState === 'failed'
          ) {
            handleCallEnd();
          }
        };

        setCallActive(true);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeLocalStream();

    const handleUserJoined = async (data) => {
      socket.otherId = data.socketId;
      if (peerConnectionRef.current) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit('send-offer', { offer, targetSocketId: data.socketId });
      }
    };

    const handleReceiveOffer = async (data) => {
      socket.otherId = data.senderSocketId;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('send-answer', { answer, targetSocketId: data.senderSocketId });
      }
    };

    const handleReceiveAnswer = async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    };

    const handleReceiveCandidate = async (data) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    const handleCallEnd = () => {
      socket.emit('call-ended', { roomId, userId });
      setCallActive(false);
      onCallEnd();
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('receive-offer', handleReceiveOffer);
    socket.on('receive-answer', handleReceiveAnswer);
    socket.on('receive-ice-candidate', handleReceiveCandidate);
    socket.on('call-ended', handleCallEnd);

    return () => {
      socket.disconnect();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomId, userId]);

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-4 right-4 w-32 h-32 bg-black rounded-lg border-2 border-white"
      />
      {callActive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${isAudioOn ? 'bg-gray-700' : 'bg-red-600'} hover:opacity-80`}
          >
            {isAudioOn ? <Mic className="text-white" size={20} /> : <MicOff className="text-white" size={20} />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'} hover:opacity-80`}
          >
            {isVideoOn ? <Video className="text-white" size={20} /> : <VideoOff className="text-white" size={20} />}
          </button>
          <button
            onClick={() => {
              socketRef.current?.emit('call-ended', { roomId, userId });
              setCallActive(false);
              onCallEnd();
            }}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="text-white" size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCall;