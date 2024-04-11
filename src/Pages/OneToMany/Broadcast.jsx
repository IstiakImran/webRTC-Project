import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const Broadcast = () => {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null); // Add a ref to access the video element

  
  const init = useCallback(async () => {
    const createPeer = () => {
      const peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.stunprotocol.org"
          }
        ]
      });
      peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
  
      return peer;
    };
  
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    setStream(stream);
    const peer = createPeer();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    // Set the stream directly to the video element once obtained
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
      sdp: peer.localDescription
    };

    const { data } = await axios.post('https://obyoy-meet-backend.onrender.com/broadcast', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
  }

  return (
    <div>
      <button onClick={init}>Start Stream</button>
      {stream && <video ref={videoRef} autoPlay />}
    </div>
  );
}

export default Broadcast;
