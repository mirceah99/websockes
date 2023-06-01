import { WebSocket, WebSocketServer } from "ws";
export enum ACTIONS {
  REGISTER = "register",
  ERROR = "error",
  START_ROUND = "starRound",
  PRESS_THE_BUTTON = "pressTheButton",
  PLAYER_PRESSED = "playerPressed",
  ROUND_ENDED = "roundEnded",
}
const players: Record<string, Player> = {};
const wss = new WebSocketServer({ port: 3300 });
wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(rawData) {
    const data = JSON.parse(rawData.toString());
    const action = data.ACTION;
    switch (action) {
      case ACTIONS.REGISTER:
        registerPlayer(data.parameters.userName, this);
        break;
      case ACTIONS.PLAYER_PRESSED:
        gameServer.sendResponse(data.parameters.key, data.parameters.userName);
        break;
      default:
        console.log(`Unknown action received: ${action}`);
        break;
    }
    console.log(data);
  });
  ws.on("close", function () {
    for (const [playerName, player] of Object.entries(players)) {
      if (player.ws === ws) delete players[playerName];
    }
  });
});

function registerPlayer(name: string, ws: WebSocket) {
  if (players[name]) {
    const data = {
      ACTION: ACTIONS.ERROR,
      parameters: {
        message: "Username already used",
        code: 1,
      },
    };
    ws.send(JSON.stringify(data));
    console.log("Player name already used");
  }
  console.log(`registered player ${name}`);
  players[name] = { ws, name };
}

interface Player {
  name: string;
  ws: WebSocket;
}

class GameServer {
  private roundId = 0;
  private roundKey: number = 0;
  private roundMaxDuration = 30;
  private roundDuration = 0;
  private pauseBetweenRounds = 10;
  private waitForPlayers = 5;
  private winner: string | null = null;
  constructor(public players: Record<string, Player>) {
    this.players = players;
    console.log(players);
  }
  start() {
    this.startNewRound();
  }
  startNewRound() {
    this.roundId++;
    console.log(`START-ROUND ${this.roundId}`);
    this.roundKey = Math.random();
    this.winner = null;
    const startMessage = JSON.stringify({
      ACTION: ACTIONS.START_ROUND,
      parameters: {
        roundId: this.roundId,
      },
    });
    for (const [playerName, player] of Object.entries(this.players)) {
      console.log(`send message to player ${playerName}`);
      player.ws.send(startMessage);
    }
    this.roundDuration = this.roundMaxDuration * Math.random() * 1000 + 2000;
    setTimeout(this.pressTheButton.bind(this), this.roundDuration);
  }
  pressTheButton() {
    console.log("EMIT PRESS THE BUTTON");

    const message = JSON.stringify({
      ACTION: ACTIONS.PRESS_THE_BUTTON,
      parameters: {
        roundId: this.roundId,
        roundKey: this.roundKey,
      },
    });
    for (const [playerName, player] of Object.entries(this.players)) {
      console.log(`send message to player ${playerName}`);

      player.ws.send(message);
    }
    setTimeout(this.displayResult.bind(this), this.waitForPlayers * 1000);
  }
  sendResponse(key: number, playerName: string) {
    console.log("RECEIVED RESPONSE");
    if (key !== this.roundKey) return;
    if (!this.winner) this.winner = playerName;
  }
  displayResult() {
    console.log("DISPLAY RESULTS");

    const message = JSON.stringify({
      ACTION: ACTIONS.ROUND_ENDED,
      parameters: {
        winner: this.winner,
        message: `Player ${this.winner} won round ${this.roundId}`,
      },
    });
    for (const [playerName, player] of Object.entries(this.players)) {
      console.log(`send message to player ${playerName}`);

      player.ws.send(message);
    }
    setTimeout(this.startNewRound.bind(this), this.pauseBetweenRounds * 1000);
  }
}
const gameServer = new GameServer(players);
gameServer.start();
