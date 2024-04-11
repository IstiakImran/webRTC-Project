
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
  const remoteVideoRefs = useRef({}); // Store references to remote video elements
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
      iceServers: [{ urls: 'stun.12connect.com:3478stun.l.google.com:19302' }],
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

    peerConnection.ontrack = event => {
      if (event.streams[0]) {
        remoteVideoRefs.current[socketId] = remoteVideoRefs.current[socketId] || React.createRef();
        remoteVideoRefs.current[socketId].current.srcObject = event.streams[0];
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

  const handleRequestOffer = useCallback(() => {
    if (typeof window === 'undefined') return; // Check if we're in a browser environment

    for (const [socketId, peerConnection] of Object.entries(peerConnections)) {
      peerConnection.createOffer().then(offer => {
        return peerConnection.setLocalDescription(offer);
      }).then(() => {
        socket.emit('offer', { target: socketId, sdp: peerConnection.localDescription });
      });
    }
  }, [socket, peerConnections]);

  const handleReceiveStream = useCallback(({ userId, stream }) => {
    if (typeof window === 'undefined') return; // Check if we're in a browser environment
  
    if (!remoteVideoRefs.current[userId]) {
      remoteVideoRefs.current[userId] = React.createRef();
    }
  
    if (remoteVideoRefs.current[userId].current && stream instanceof MediaStream) {
      try {
        remoteVideoRefs.current[userId].current.srcObject = stream;
      } catch (error) {
        console.error('Error setting remote video stream:', error);
      }
    }
  }, [remoteVideoRefs]);

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

        // Broadcast media stream to other participants
        socket.emit('stream-offer', { meetingCode, userId: socket.id, stream });
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
      });
  }, [socket, meetingCode]);

  // Handling socket events
  useEffect(() => {
    if (!socket) return; // Check if socket is available

    // Listen for requests to send an offer
    socket.on('request-offer', handleRequestOffer);

    // Listen for offers
    socket.on('offer', handleReceiveOffer);

    // Listen for answers
    socket.on('answer', handleReceiveAnswer);

    // Listen for ICE candidates
    socket.on('ice-candidate', handleNewICECandidateMsg);

    // Listen for media streams from other participants
    socket.on('participant-stream', handleReceiveStream);

    return () => {
      socket.off('request-offer', handleRequestOffer);
      socket.off('offer', handleReceiveOffer);
      socket.off('answer', handleReceiveAnswer);
      socket.off('ice-candidate', handleNewICECandidateMsg);
      socket.off('participant-stream', handleReceiveStream);
    };
  }, [socket, handleNewICECandidateMsg, handleReceiveAnswer, handleReceiveOffer, handleRequestOffer, handleReceiveStream]);

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
  
  const handleBugg = () => {
    console.log("bugg")
  }

  return (
    <div className="meeting-room-container">
      <div className="video-container">
        {/* <video ref={localVideoRef} autoPlay muted playsInline></video> Local stream */}
        {Object.values(remoteVideoRefs.current).map((remoteVideoRef, index) => (
        remoteVideoRef?.current && (
          <video key={index} ref={remoteVideoRef} autoPlay playsInline></video>
        )
      ))}
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