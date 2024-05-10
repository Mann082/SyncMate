var socket = io();

var videoCharForm = document.getElementById("video-chat-form");
var videoCharRooms = document.getElementById("video-chat-rooms");
var joinBtn = document.getElementById("join");
var roomInput = document.getElementById("roomName");
var userVideo = document.getElementById("user-video");
var peerVideo = document.getElementById("peer-video");
var muteButton = document.getElementById("mute-btn");
var divBtnGroup = document.getElementById("btn-group");
var hideCameraBtn = document.getElementById("hideCamera");
var leaveRoomBtn = document.getElementById("leave-room-btn");

var muteFlag = false;
var hideCameraFlag = false;

navigator.mediaDevices.getUserMedia =
  navigator.mediaDevices.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

var roomName = roomInput.value;
var creator = false;
var userStream;
var rtcPeerConnection;

var iceServer = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

joinBtn.addEventListener("click", function () {
  roomName = roomInput.value;
  console.log(roomName);
  if (roomName == "") {
    alert("Please enter a room name!");
  } else {
    socket.emit("join", roomName);
  }
});

muteButton.addEventListener("click", function () {
  muteFlag = !muteFlag;
  if (muteFlag) {
    userStream.getTracks()[0].enabled = false;
    muteButton.textContent = "Unmute";
  } else {
    userStream.getTracks()[0].enabled = true;
    muteButton.textContent = "mute";
  }
});

hideCameraBtn.addEventListener("click", function () {
  hideCameraFlag = !hideCameraFlag;
  if (hideCameraFlag) {
    userStream.getTracks()[1].enabled = false;
    hideCameraBtn.textContent = "Show Camera";
  } else {
    userStream.getTracks()[1].enabled = true;
    hideCameraBtn.textContent = "Hide Camera";
  }
});

leaveRoomBtn.addEventListener("click", function () {
  socket.emit("leave", roomName);
  videoCharForm.style = "display:block";
  divBtnGroup.style = "display:none";
  if (userVideo.srcObject) {
    userVideo.srcObject.getTracks()[0].stop();
    userVideo.srcObject.getTracks()[1].stop();
  }
  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }
  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
  }
});

socket.on("created", function () {
  creator = true;
  navigator.getUserMedia(
    {
      audio: true,
      video: true,
    },
    function (stream) {
      divBtnGroup.style = "display:flex";
      videoCharForm.style = "display:none";
      userStream = stream;
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
    },
    function (error) {
      alert("access denied");
    }
  );
});

socket.on("joined", function () {
  creator = false;
  navigator.getUserMedia(
    {
      audio: true,
      video: true,
    },
    function (stream) {
      divBtnGroup.style = "display:flex";
      videoCharForm.style = "display:none";
      userVideo.srcObject = stream;
      userStream = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
      socket.emit("ready", roomName);
    },
    function (error) {
      alert("access denied");
    }
  );
});

socket.on("full", function () {
  alert("room is full, can't join");
});

socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServer);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); //audio track
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); //video track
    rtcPeerConnection.createOffer(
      function (offer) {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName);
      },
      function (error) {
        console.log(error);
      }
    );
  }
});

socket.on("candidate", function (candidate) {
  var iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);
});

socket.on("offer", function (offer) {
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServer);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); //audio track
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); //video track
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection.createAnswer(
      function (answer) {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomName);
      },
      function (error) {
        console.log(error);
      }
    );
  }
});

socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});

function OnIceCandidateFunction(event) {
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}
function OnTrackFunction(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function (e) {
    peerVideo.play();
  };
}

socket.on("leave", function () {
  creator = true;
  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }
  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
  }
});
