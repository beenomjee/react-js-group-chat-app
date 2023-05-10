const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export async function addPeer(
  socketId,
  localStream,
  remoteVideosContainer,
  selectedVideoRef
) {
  const peer = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach((track) => {
    peer.addTrack(track, localStream);
  });

  peer.ontrack = (event) => {
    const videoElement = remoteVideosContainer.querySelector(`#a${socketId}`);
    if (videoElement) return;
    const stream = event.streams[0];
    const video = document.createElement("video");
    video.srcObject = stream;
    video.setAttribute("id", `a${socketId}`);
    video.autoplay = true;
    video.playsInline = true;
    video.addEventListener("click", () => {
      selectedVideoRef.srcObject = video.srcObject;
    });
    remoteVideosContainer.append(video);
  };

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  return [peer, offer];
}

export async function createAnswer(
  socketId,
  localStream,
  remoteVideosContainer,
  offer,
  selectedVideoRef
) {
  const peer = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach((track) => {
    peer.addTrack(track, localStream);
  });

  peer.ontrack = (event) => {
    const videoElement = remoteVideosContainer.querySelector(`#a${socketId}`);
    if (videoElement) return;
    const stream = event.streams[0];
    const video = document.createElement("video");
    video.srcObject = stream;
    video.setAttribute("id", `a${socketId}`);
    video.autoplay = true;
    video.playsInline = true;
    video.addEventListener("click", () => {
      selectedVideoRef.srcObject = video.srcObject;
    });
    remoteVideosContainer.append(video);
  };

  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer(offer);
  await peer.setLocalDescription(answer);
  return [peer, answer];
}
