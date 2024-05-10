var connection = new WebSocket("ws://localhost:8000");
connection.onopen = function () {
  console.log("Connected to wss");
};
connection.onmessage = function (message) {
  var data = JSON.parse(message.data);
};

connection.onerror = function (error) {
  alert(error.toString());
};
setTimeout(function () {
  if (connection.readyState == 1) {
    if (username != null) {
      name = username;
      console.log("Username is :- " + name);
      send({
        type: "online",
        name: name,
      });
    }
  }
}, 3000);

function send(message) {
  if (connectedUser) {
    message.name = connectedUser;
  }
  connection.send(JSON.stringify(message));
}

var local_video = document.querySelector("#local-video");
navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.getUserMedia(
  {
    audio: false,
    video: true,
  },
  function (myStream) {
    stream = myStream;
    local_video.srcObject = stream;
  },
  function (error) {
    alert("Access Denied");
  }
);
