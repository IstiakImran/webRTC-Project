import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

function Viewer() {
  const [video, setVideo] = useState(null);
  const videoRef = useRef(null); // Add this line to create a ref for your video element

  const init = useCallback(async () => {
    function createPeer() {
      const peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.stunprotocol.org"
          }
        ]
      });
      peer.ontrack = handleTrackEvent;
      peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

      return peer;
    }
    const peer = createPeer();
    peer.addTransceiver("video", { direction: "recvonly" });
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

    const { data } = await axios.post('https://obyoy-meet-backend.onrender.com/consumer', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
  }

  function handleTrackEvent(e) {
    setVideo(e.streams[0]);
  }

  // Use an effect to update the video srcObject when the video state updates
  useEffect(() => {
    if (videoRef.current && video) {
      videoRef.current.srcObject = video;
    }
  }, [video]);

  return (
    <div>
      <h1>Viewer</h1>
      {video && <video autoPlay ref={videoRef} />}
      <button onClick={init}>View Stream</button>
    </div>
  );
}

export default Viewer;
