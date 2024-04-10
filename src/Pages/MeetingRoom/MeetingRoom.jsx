
import React, { useEffect, useRef, useState } from "react";
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
  const [stream, setStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // Handling local stream setup
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream); // Set the stream state
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        socket.emit('join-room', { meetingCode, stream: true });
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
      });
  }, [socket, meetingCode]);

  useEffect(() => {
    if (!stream) return; // Ensure stream is available
  
    const peerConnection = new RTCPeerConnection({
      iceServers: [ // Using Google's public STUN server for demo purposes
        { urls: "stun:stun2.1.google.com:19302" },
      ],
    });
  
    // Add each track from the local stream to the peer connection
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });
  
    // Listen for ICE candidates and send them to the remote peer
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('ice-candidate', { meetingCode, candidate: event.candidate.toJSON() });
      }
    };
  
    // When a remote stream is added, set the stream on the remote video element
    peerConnection.ontrack = event => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
  
    // Handle receiving an offer from a peer
    socket.on('offer', async (data) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', { meetingCode, sdp: peerConnection.localDescription.toJSON() });
    });
  
    // Handle receiving an answer from a peer
    socket.on('answer', (data) => {
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    });
  
    // Handle receiving ICE candidates from a peer
    socket.on('ice-candidate', (data) => {
      if (data.candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
  
    // Cleanup on unmount
    return () => {
      peerConnection.close();
      // Also, remove all event listeners to prevent memory leaks
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [stream, socket, meetingCode]); // Make sure to include stream in the dependency array
  


  const handleMicToggle = () => {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
        audioTracks[0].enabled = !micEnabled;
        setMicEnabled(!micEnabled);
    }
  };
  
  const handleCameraToggle = () => {
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
        videoTracks[0].enabled = !cameraEnabled;
        setCameraEnabled(!cameraEnabled);
    }
  };
  
  const handleHangUp = () => navigate('/');
  
  const handleChatToggle = () => {
    setShowChat(!showChat);
  };

  
  return (
    <div className="meeting-room-container">
      <div className="video-container">
        <video ref={localVideoRef} autoPlay playsInline ></video> {/* Local stream */}
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


