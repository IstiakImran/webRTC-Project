import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from 'react-redux';
import MicIcon from "../../assets/MicIcon.png";
import CameraIcon from "../../assets/CameraIcon.png";
import HangUpIcon from "../../assets/HangUpIcon.png";
import ChatIcon from "../../assets/ChatIcon.png";
import "./MeetingRoom.css";

const MeetingRoom = () => {
  const { socket } = useSelector((state) => state.socket);
  const navigate = useNavigate();
  const { meetingCode } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const peerConnections = useMemo(() => ({}), []); // Store peer connections


  const createPeerConnection = useCallback((socketId) => {
    if (typeof window === 'undefined') {
      return null; // Return null if we're not in a browser environment
    }

    if (peerConnections[socketId]) {
      return peerConnections[socketId];
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.stunprotocol.org' }],
    });

    peerConnections[socketId] = peerConnection;

    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('ice-candidate', { target: socketId, candidate: event.candidate.toJSON() });
      }
    };

    // Assume there's a remoteVideoRef pointing to the remote video element
    peerConnection.ontrack = event => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return peerConnection;
  }, [socket, peerConnections, localStream]);
  const handleReceiveOffer = useCallback(({ sender, sdp }) => {
    if (typeof window === 'undefined') return; // Check if we're in a browser environment

    const peerConnection = createPeerConnection(sender);
    peerConnection.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
      return peerConnection.createAnswer();
    }).then(answer => {
      return peerConnection.setLocalDescription(answer);
    }).then(() => {
      socket.emit('answer', { target: sender, sdp: peerConnection.localDescription });
    });
  }, [socket, createPeerConnection]);

  const handleReceiveAnswer = useCallback(({ sender, sdp }) => {
    if (typeof window === 'undefined') return; // Check if we're in a browser environment

    const peerConnection = peerConnections[sender];
    if (peerConnection) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }, [peerConnections]);

  const handleNewICECandidateMsg = useCallback(({ sender, candidate }) => {
    if (typeof window === 'undefined') return; // Check if we're in a browser environment

    const peerConnection = peerConnections[sender];
    if (peerConnection) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, [peerConnections]);



  // Handling local stream setup
 // Handling local stream setup
useEffect(() => {
  if (typeof window === 'undefined') return; // Check if we're in a browser environment

  // Get local media stream
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setLocalStream(stream);
    })
    .catch(error => {
      console.error('Error accessing media devices:', error);
    });
}, []);

// Handling socket events
useEffect(() => {
  if (!socket) return; // Check if socket is available

  // Listen for offers
  socket.on('offer', handleReceiveOffer);

  // Listen for answers
  socket.on('answer', handleReceiveAnswer);

  // Listen for ICE candidates
  socket.on('ice-candidate', handleNewICECandidateMsg);

  return () => {
    socket.off('offer', handleReceiveOffer);
    socket.off('answer', handleReceiveAnswer);
    socket.off('ice-candidate', handleNewICECandidateMsg);
  };
}, [socket, handleNewICECandidateMsg, handleReceiveAnswer, handleReceiveOffer]);

useEffect(() => {
  if (localVideoRef.current && localStream) {
    localVideoRef.current.srcObject = localStream;
  }
}, [localStream]);
  const handleMicToggle = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    }
  };

  const handleCameraToggle = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !cameraEnabled;
        setCameraEnabled(!cameraEnabled);
      }
    }
  };

  const handleHangUp = () => navigate('/');

  const handleChatToggle = () => {
    setShowChat(!showChat);
  };

  return (
    <div className="meeting-room-container">
      <div className="video-container">
        <video ref={localVideoRef} autoPlay playsInline></video> {/* Local stream */}
        <video ref={remoteVideoRef} autoPlay playsInline></video> {/* Remote stream */}
      </div>

      <div className="controls-container">
        <button className="control-button" onClick={handleMicToggle}>
          <img className="control-button-icon" src={MicIcon} alt="Mic" />
        </button>
        <button className="control-button" onClick={handleCameraToggle}>
          <img className="control-button-icon" src={CameraIcon} alt="Camera" />
        </button>
        <button className="control-button" onClick={handleHangUp}>
          <img className="control-button-icon" src={HangUpIcon} alt="Hang Up" />
        </button>
        <button className="control-button" onClick={handleChatToggle}>
          <img className="control-button-icon" src={ChatIcon} alt="Chat" />
        </button>
      </div>
    </div>
  );
};

export default MeetingRoom;