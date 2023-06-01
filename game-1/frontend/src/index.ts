const socket = new WebSocket("ws://192.168.100.11:3300");
const userNameElement = document.querySelector("#name") as HTMLElement;
const button = document.querySelector("#game") as HTMLButtonElement;
const status = document.querySelector("#status") as HTMLElement;
const info = document.querySelector("#info") as HTMLElement;
let roundKey = 0;
let userName: string | null = "";
export enum ACTIONS {
  REGISTER = "register",
  ERROR = "error",
  START_ROUND = "starRound",
  PRESS_THE_BUTTON = "pressTheButton",
  PLAYER_PRESSED = "playerPressed",
  ROUND_ENDED = "roundEnded",
}
socket.addEventListener("open", function (event) {
  status.innerHTML = "Live";
  while (!userName) {
    userName = prompt("Please enter a username");
    // userName = Math.random().toString();
    if (!userName) break;
    const data = {
      ACTION: "register",
      parameters: {
        userName,
      },
    };
    socket.send(JSON.stringify(data));
    userNameElement.innerHTML = `Your username: ${userName}`;
  }
});
socket.addEventListener("message", function (event) {
  const data = JSON.parse(event.data.toString());
  console.log(data);

  switch (data.ACTION) {
    case ACTIONS.START_ROUND:
      startRound();
      break;
    case ACTIONS.PRESS_THE_BUTTON:
      pressTheButton();
      roundKey = data?.parameters?.roundKey;
      break;
    case ACTIONS.ROUND_ENDED:
      roundEnded(data?.parameters?.message);
      break;
    default:
      console.log(`Unknown action received: ${data.ACTION}`);
      break;
  }
});
function startRound() {
  button.innerHTML = `Be ready`;
  button.style.backgroundColor = "yellow";
}
function pressTheButton() {
  button.innerHTML = `Press quick`;
  button.style.backgroundColor = "green";
  button.disabled = false;
}
function roundEnded(result: string) {
  button.innerHTML = `Wait`;
  button.style.backgroundColor = "grey";
  button.disabled = true;
  info.innerHTML = result;
}
button.addEventListener("click", () => {
  button.disabled = true;
  button.style.backgroundColor = "grey";
  button.innerHTML = `Wait`;
  const data = {
    ACTION: ACTIONS.PLAYER_PRESSED,
    parameters: {
      key: roundKey,
      userName,
    },
  };
  socket.send(JSON.stringify(data));
});
