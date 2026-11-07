import React, { Component } from "react";
import "./App.css";
import "./Lobby.css";
import "./fonts.css";
import MaxLengthTextField from "./util/MaxLengthTextField";
import CustomAlert from "./custom-alert/CustomAlert";
import RoleAlert from "./custom-alert/RoleAlert";
import EventBar from "./event-bar/EventBar";

// TODO: replace constants with enums from types
import {
  PAGE,
  MAX_FAILED_CONNECTIONS,
  SERVER_ADDRESS_HTTP,
  CHECK_LOGIN,
  SERVER_ADDRESS,
  WEBSOCKET,
  PARAM_USERNAMES,
  PARAM_HIDE_COUNTS,
  PARAM_STATE,
  STATE_CHANCELLOR_NOMINATION,
  STATE_CHANCELLOR_VOTING,
  PARAM_PRESIDENT,
  STATE_LEGISLATIVE_PRESIDENT,
  STATE_LEGISLATIVE_CHANCELLOR,
  PARAM_PACKET_TYPE,
  PACKET_LOBBY,
  PACKET_GAME_STATE,
  PACKET_INVESTIGATION,
  PACKET_OK,
  STATE_SETUP,
  STATE_POST_LEGISLATIVE,
  STATE_LEGISLATIVE_PRESIDENT_VETO,
  STATE_PP_INVESTIGATE,
  STATE_PP_EXECUTION,
  STATE_PP_ELECTION,
  STATE_PP_PEEK,
  PLAYER_IS_ALIVE,
  PARAM_TARGET,
  STATE_FASCIST_VICTORY_ELECTION,
  STATE_FASCIST_VICTORY_POLICY,
  STATE_LIBERAL_VICTORY_EXECUTION,
  STATE_LIBERAL_VICTORY_POLICY,
  WEBSOCKET_HEADER,
  DEBUG,
  PACKET_PONG,
  PING_INTERVAL,
  SERVER_PING,
  PARAM_ICON,
  PARAM_INVESTIGATION,
  HOUSE_LOBBY,
  PARAM_CLIENT,
  PARAM_GAME_SETTINGS,
} from "./constants";

import PlayerDisplay, {
  DISABLE_EXECUTED_PLAYERS,
  DISABLE_NONE,
} from "./player/PlayerDisplay";
import StatusBar from "./status-bar/StatusBar";
import Board from "./board/Board";
import VotingPrompt from "./custom-alert/VotingPrompt";
import PresidentLegislativePrompt from "./custom-alert/PresidentLegislativePrompt";
import ChancellorLegislativePrompt from "./custom-alert/ChancellorLegislativePrompt";
import VetoPrompt from "./custom-alert/VetoPrompt";
import ElectionTrackerAlert from "./custom-alert/ElectionTrackerAlert";
import PolicyEnactedAlert from "./custom-alert/PolicyEnactedAlert";
import {
  SelectExecutionPrompt,
  SelectInvestigationPrompt,
  SelectNominationPrompt,
  SelectSpecialElectionPrompt,
} from "./custom-alert/SelectPlayerPrompt";
import ButtonPrompt from "./custom-alert/ButtonPrompt";
import PeekPrompt from "./custom-alert/PeekPrompt";
import InvestigationAlert from "./custom-alert/InvestigationAlert";
import Deck from "./board/Deck";
import PlayerPolicyStatus from "./util/PlayerPolicyStatus";

import VictoryFascistHeader from "./assets/pl/victory-fascist-header.png";
import VictoryLiberalHeader from "./assets/pl/victory-liberal-header.png";
import IconSelection from "./custom-alert/IconSelection";
import { defaultPortrait } from "./assets";
import Player from "./player/Player";
import Cookies from "js-cookie";
import JoinQRCode from "./util/JoinQRCode";
import { installKeepAwake } from "./util/keepAwake";
import { installViewportHeight } from "./util/viewportHeight";
import {
  GameState,
  LobbyState,
  Role,
  ServerRequestPayload,
  WSCommand,
  WSCommandType,
} from "./types";
// Imported last so phone overrides win over component styles.
import "./mobile.css";
import { common, game, login, lobby, prompts, alt } from "./strings";

const EVENT_BAR_FADE_OUT_DURATION = 500;
const CUSTOM_ALERT_FADE_DURATION = 1000;

const DEFAULT_GAME_STATE: GameState = {
  liberalPolicies: 0,
  fascistPolicies: 0,
  discardSize: 0,
  drawSize: 17,
  players: {},
  playerOrder: [],
  state: LobbyState.SETUP,
  president: "",
  chancellor: "",
  electionTracker: 0,
  vetoOccurred: false,
  lastState: LobbyState.SETUP,
  lastChancellor: "",
  lastPresident: "",
  electionTrackerAdvanced: false,
  userVotes: {},
  presidentChoices: [],
  chancellorChoices: [],
  targetUser: "",
  lastPolicy: "",
  peek: [],
  icon: {},
};

const COOKIE_NAME = "name";
const COOKIE_LOBBY = "lobby";

const CLIENT_ID_KEY = "sh-client-id";
// Set while the player is (or should be) in the house lobby, so a page that the
// phone's browser reloaded in the background rejoins automatically.
const AUTO_REJOIN_KEY = "sh-auto-rejoin";
// After the page has been hidden this long, assume the socket may be dead.
const STALE_AFTER_HIDDEN_MS = 4000;

/** A random id that identifies this browser, so it can reclaim its seat. */
function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id =
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return "";
  }
}

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function storageSet(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    // Private mode etc.; auto-rejoin just won't work.
  }
}

if (DEBUG) {
  console.warn("Running in debug mode.");
}

// TODO: Turn App into a functional component
// TODO: Refactor out pages into separate components
// TODO: Refactor out AnimationQueue

// TODO: Remove this type and replace with actual state variables.
type AppState = {
  page: PAGE;
  joinName: string;
  joinLobby: string;
  joinError: string;
  createLobbyName: string;
  createLobbyError: string;
  name: string;
  lobby: string;
  lobbyFromURL: boolean;
  usernames: string[];
  icons: { [key: string]: string };
  /* Host's lobby setting: hide the pile and policies-left counts. */
  hideCounts: boolean;
  gameSettings: {
    fascistDeckSize: number;
    liberalDeckSize: number;
    fascistVictoryThreshold: number;
    liberalVictoryThreshold: number;
    hitlerChancellorThreshold: number;
  };
  gameState: GameState;
  /* Stores the last gameState[PARAM_STATE] value to check for changes. */
  lastState: any;
  liberalPolicies: number;
  fascistPolicies: number;
  /*The position of the election tracker, ranging from 0 to 3.*/
  electionTracker: number;
  showVotes: boolean;
  drawDeckSize: number;
  discardDeckSize: number;
  snackbarMessage: string;
  showAlert: boolean;
  alertContent: JSX.Element;
  showEventBar: boolean;
  eventBarMessage: string;
  statusBarText: string;
  allAnimationsFinished: boolean;
};

const defaultAppState: AppState = {
  page: PAGE.LOGIN,
  joinName: "",
  joinLobby: "",
  joinError: "",
  createLobbyName: "",
  createLobbyError: "",
  name: "P1",
  lobby: "AAAAAA",
  lobbyFromURL: false,
  usernames: [],
  icons: {},
  hideCounts: false,
  gameSettings: {
    fascistDeckSize: 11,
    liberalDeckSize: 6,
    fascistVictoryThreshold: 6,
    liberalVictoryThreshold: 5,
    hitlerChancellorThreshold: 3,
  },
  gameState: DEFAULT_GAME_STATE,
  lastState: {},
  liberalPolicies: 0,
  fascistPolicies: 0,
  electionTracker: 0,
  showVotes: false,
  drawDeckSize: 17,
  discardDeckSize: 0,
  snackbarMessage: "",
  showAlert: false,
  alertContent: <div />,
  showEventBar: false,
  eventBarMessage: "",
  statusBarText: game.statusInitial,
  allAnimationsFinished: true,
};

class App extends Component<{}, AppState> {
  websocket?: WebSocket = undefined;
  failedConnections: number = 0;
  pingInterval?: NodeJS.Timeout = undefined;
  reconnectOnConnectionClosed: boolean = true;
  snackbarMessages: number = 0;
  animationQueue: (() => void)[] = [];
  okMessageListeners: (() => void)[] = [];
  allAnimationsFinished: boolean = true;
  gameOver: boolean = false;
  clientId: string = getClientId();
  reconnectTimer?: ReturnType<typeof setTimeout> = undefined;
  hiddenSince?: number = undefined;

  // noinspection DuplicatedCode
  constructor(props: any) {
    super(props);

    let name = Cookies.get(COOKIE_NAME) ? Cookies.get(COOKIE_NAME) : "";

    this.state = {
      ...defaultAppState,
      joinName: name || "",
      joinLobby: HOUSE_LOBBY,
      createLobbyName: name || "",
    };

    // These are necessary for handling class fields safely (ex: websocket)
    this.onWebSocketClose = this.onWebSocketClose.bind(this);
    this.tryOpenWebSocket = this.tryOpenWebSocket.bind(this);
    this.onClickLeaveLobby = this.onClickLeaveLobby.bind(this);
    this.onClickStartGame = this.onClickStartGame.bind(this);
    this.sendWSCommand = this.sendWSCommand.bind(this);
    this.showSnackBar = this.showSnackBar.bind(this);
    this.onAnimationFinish = this.onAnimationFinish.bind(this);
    this.onGameStateChanged = this.onGameStateChanged.bind(this);
    this.hideAlertAndFinish = this.hideAlertAndFinish.bind(this);
    this.addAnimationToQueue = this.addAnimationToQueue.bind(this);
    this.clearAnimationQueue = this.clearAnimationQueue.bind(this);
    this.queueAlert = this.queueAlert.bind(this);
    this.showChangeIconAlert = this.showChangeIconAlert.bind(this);
    this.updateChangeIconAlert = this.updateChangeIconAlert.bind(this);
    this.onClickChangeIcon = this.onClickChangeIcon.bind(this);

    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onBrowserOnline = this.onBrowserOnline.bind(this);

    // Ping the server to wake it up if it's not currently being used
    // This reduces the delay users experience when starting lobbies
    fetch(SERVER_ADDRESS_HTTP + SERVER_PING).catch(() => {});
  }

  componentDidMount() {
    installKeepAwake();
    installViewportHeight();
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("online", this.onBrowserOnline);

    // If the browser threw this page away while the phone was locked, put the
    // player straight back into the game.
    const rejoinName = storageGet(AUTO_REJOIN_KEY);
    if (rejoinName) {
      this.setState({ joinName: rejoinName }, () => this.onClickJoin());
    }
  }

  componentWillUnmount() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("online", this.onBrowserOnline);
  }

  /** True while the player should be connected to a lobby. */
  isInSession() {
    return this.state.page !== PAGE.LOGIN && this.reconnectOnConnectionClosed;
  }

  /**
   * Phones freeze background pages and often kill their sockets silently. When
   * the page comes back after a while, open a fresh connection; the server hands
   * the seat over to it because this browser's client id matches.
   */
  onVisibilityChange() {
    if (document.visibilityState === "hidden") {
      this.hiddenSince = Date.now();
      return;
    }
    const hiddenFor =
      this.hiddenSince === undefined ? 0 : Date.now() - this.hiddenSince;
    this.hiddenSince = undefined;
    const socketDown =
      !this.websocket || this.websocket.readyState !== WebSocket.OPEN;
    if (
      this.isInSession() &&
      (socketDown || hiddenFor > STALE_AFTER_HIDDEN_MS)
    ) {
      this.reconnectNow();
    }
  }

  onBrowserOnline() {
    if (this.isInSession()) {
      this.reconnectNow();
    }
  }

  reconnectNow() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.failedConnections = 0;
    this.tryOpenWebSocket(this.state.name, this.state.lobby);
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }
    // 0.5s, 1s, 2s, 4s, then every 8s.
    const delay = Math.min(500 * Math.pow(2, this.failedConnections), 8000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.tryOpenWebSocket(this.state.name, this.state.lobby);
    }, delay);
  }

  /////////// Server Communication
  // <editor-fold desc="Server Communication">

  /**
   * Checks if the login is valid.
   * @param name the name of the user.
   * @param lobby the lobby code.
   * @return {Promise<Response>} The response from the server.
   */
  async tryLogin(name: string, lobby: string) {
    return await fetch(
      SERVER_ADDRESS_HTTP +
        CHECK_LOGIN +
        "?name=" +
        encodeURIComponent(name) +
        "&lobby=" +
        encodeURIComponent(lobby) +
        "&" +
        PARAM_CLIENT +
        "=" +
        encodeURIComponent(this.clientId)
    );
  }

  /**
   * Attempts to open a WebSocket with the server.
   * @param name the name of the user to connect with.
   * @param lobby the lobby to connect with.
   * @effects If a connection was successfully established, sets the state with the {@code name}, {@code lobby},
   *          and {@code ws} parameters. The WebSocket has a message callback to this.onWebSocketMessage().
   * @return {boolean} true if the connection was opened successfully. Otherwise, returns false.
   */
  tryOpenWebSocket(name: string, lobby: string) {
    if (DEBUG) {
      console.log("Opening connection with lobby: " + lobby);
      console.log("Failed connections: " + this.failedConnections);
    }
    let url =
      WEBSOCKET_HEADER +
      SERVER_ADDRESS +
      WEBSOCKET +
      "?name=" +
      encodeURIComponent(name) +
      "&lobby=" +
      encodeURIComponent(lobby) +
      "&" +
      PARAM_CLIENT +
      "=" +
      encodeURIComponent(this.clientId);
    if (DEBUG) {
      console.trace("TryOpenWebsocket URL: " + url);
    }

    // Close existing websocket
    if (this.websocket) {
      // Clear onClose event to prevent reconnection
      this.websocket.onclose = () => {};
      this.websocket.close();
      this.websocket = undefined;
    }

    let ws = new WebSocket(url);
    if (ws.OPEN) {
      console.log("Websocket opened successfully to " + url);
      this.websocket = ws;
      this.reconnectOnConnectionClosed = true;
      // Only move the player to the lobby page if they were logging in.
      // This is to prevent the bug where players flash in/out of the lobby page
      // at random points in the game.
      if (this.state.page === PAGE.LOGIN) {
        this.setState({ page: PAGE.LOBBY });
      }
      this.setState({
        name: name,
        lobby: lobby,
        usernames: [],
        joinName: "",
        joinLobby: "",
        joinError: "",
        createLobbyName: "",
        createLobbyError: "",
      });
      ws.onmessage = (msg) => this.onWebSocketMessage(msg);
      ws.onclose = (event) => {
        // Ignore late close events from sockets we've already replaced.
        if (this.websocket === ws) {
          this.onWebSocketClose(event);
        }
      };

      // Ping the web server at a set interval.
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
      }
      this.pingInterval = setInterval(() => {
        this.sendWSCommand({ command: WSCommandType.PING });
      }, PING_INTERVAL);

      return true;
    } else {
      return false;
    }
  }

  /**
   * Called when the websocket closes.
   * @effects attempts to reopen the websocket connection.
   *          If the user pressed the "Leave Lobby" button or a maximum number of attempts has been reached
   *          ({@code MAX_FAILED_CONNECTIONS}), does not reopen the websocket connection and returns the user to the
   *          login screen with a relevant error message.
   */
  onWebSocketClose(event?: CloseEvent) {
    // Clear the server ping interval when the socket is closed.
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // The server replaced this socket with a newer one from the same browser
    // (e.g. the game was opened in a second tab). Don't fight over the seat.
    if (event && event.reason && event.reason.startsWith("Replaced")) {
      this.websocket = undefined;
      this.setState({
        joinName: this.state.name,
        joinError: login.openedElsewhere,
        page: PAGE.LOGIN,
      });
      this.clearAnimationQueue();
      return;
    }

    console.log(
      "A websocket closed: " +
        this.websocket?.url +
        ". Reopening to current lobby " +
        this.state.lobby
    );
    //

    if (
      this.reconnectOnConnectionClosed &&
      this.failedConnections < MAX_FAILED_CONNECTIONS
    ) {
      if (this.failedConnections >= 1) {
        // Only show the error bar if the first attempt has failed.
        this.showSnackBar(login.retrying);
      }
      this.scheduleReconnect();
      this.failedConnections += 1;
    } else if (this.reconnectOnConnectionClosed) {
      if (DEBUG) {
        console.log("Disconnecting from lobby.");
      }
      this.failedConnections = 0;
      this.setState({
        joinName: this.state.name,
        joinError: login.lostGame,
        page: PAGE.LOGIN,
      });
      this.clearAnimationQueue();
    } else {
      // User purposefully closed the connection.
      if (this.gameOver) {
        // Do not reopen if the game is over, since disconnecting is intentional.
      } else {
        this.setState({
          page: PAGE.LOGIN,
          joinName: this.state.name,
          joinError: "",
        });
        this.clearAnimationQueue();
      }
    }
  }

  async onWebSocketMessage(msg: MessageEvent) {
    this.failedConnections = 0;
    let message = JSON.parse(msg.data);
    // Decode message contents as communication is encoded
    if (DEBUG) {
      console.log(message);
    }
    switch (message[PARAM_PACKET_TYPE]) {
      case PACKET_LOBBY:
        this.setState({
          usernames: message[PARAM_USERNAMES],
          hideCounts: !!message[PARAM_HIDE_COUNTS],
          gameSettings: message[PARAM_GAME_SETTINGS] || defaultAppState.gameSettings,
          icons: message[PARAM_ICON],
          page: PAGE.LOBBY,
        });
        if (message[PARAM_ICON][this.state.name] === defaultPortrait) {
          this.showChangeIconAlert();
        }
        this.updateChangeIconAlert();
        break;

      case PACKET_GAME_STATE:
        if (message !== this.state.gameState) {
          this.onGameStateChanged(message);
        }
        this.setState({
          gameState: message,
          page: PAGE.GAME,
          hideCounts: !!message[PARAM_HIDE_COUNTS],
          gameSettings: message[PARAM_GAME_SETTINGS] || defaultAppState.gameSettings,
        });
        break;

      case PACKET_OK: // Traverse all listeners and call the functions.
        let i = 0;
        for (i; i < this.okMessageListeners.length && i < 1; i++) {
          this.okMessageListeners[i]();
        }
        this.okMessageListeners = []; // clear all listeners.
        break;

      case PACKET_INVESTIGATION:
        // Trigger investigation screen when the server responds.
        console.log(
          "Investigated player role: " + message[PARAM_INVESTIGATION]
        );
        // Set party to liberal/fascist using sent packet
        const party = message[PARAM_INVESTIGATION];

        this.queueAlert(
          <InvestigationAlert
            party={party}
            target={message[PARAM_TARGET]}
            hideAlert={this.hideAlertAndFinish}
          />,
          false
        );
        break;
      case PACKET_PONG:
      default:
      // No action
    }
  }

  /**
   * Sends a specified command to the server.
   * @param command the String command label.
   * @param params a dictionary of any parameters that need to be provided with the command.
   * @effects sends a message to the server with the following parameters:
   *          {@code PARAM_COMMAND}: {@code command}
   *          {@code PARAM_LOBBY}: {@code this.state.lobby}
   *          {@code PARAM_NAME}: {@code this.state.name}
   *          and each (key, value) pair in {@code params}.
   */
  sendWSCommand(request: ServerRequestPayload) {
    // Do not need to encode name + lobby because this is sent through websocket
    const data: WSCommand = {
      ...request,
      name: this.state.name,
      lobby: this.state.lobby,
    };

    if (DEBUG) {
      console.log(JSON.stringify(data));
    }
    if (this.websocket !== undefined) {
      this.websocket.send(JSON.stringify(data));
    } else {
      this.showSnackBar(login.sendFailed);
    }
  }

  //</editor-fold>

  /////////////////// Login Page
  // <editor-fold desc="Login Page">

  /**
   * Updates the "Name" field.
   * @param text the text to update the text field to.
   */
  updateJoinName = (text: string) => {
    this.setState({
      joinName: text,
    });
  };

  shouldJoinButtonBeEnabled() {
    return this.state.joinName.trim().length !== 0;
  }

  /**
   * Joins the house lobby with the entered name.
   */
  onClickJoin = () => {
    const name = this.state.joinName.trim();
    if (name.length === 0) {
      return;
    }
    const lobby = HOUSE_LOBBY;
    this.setState({ joinName: name, joinError: login.connecting });
    const fail = (message: string) => {
      // Don't keep auto-rejoining into a lobby we can't enter.
      storageSet(AUTO_REJOIN_KEY, null);
      this.setState({ joinError: message });
    };
    this.tryLogin(name, lobby)
      .then((response) => {
        if (!response.ok) {
          if (DEBUG) {
            console.log("Response is not ok");
          }
          if (response.status === 403) {
            fail(login.nameTaken(name));
          } else if (response.status === 488) {
            fail(login.gameInProgress);
          } else if (response.status === 489) {
            fail(login.gameFull);
          } else {
            fail(login.unreachable);
          }
        } else if (!this.tryOpenWebSocket(name, lobby)) {
          fail(login.unreachable);
        } else {
          // Save the username for next time, and remember to auto-rejoin.
          Cookies.set(COOKIE_NAME, name, { expires: 7 });
          Cookies.set(COOKIE_LOBBY, lobby);
          storageSet(AUTO_REJOIN_KEY, name);
        }
      })
      .catch(() => {
        this.setState({
          joinError: login.unreachableWifi,
        });
      });
  };

  renderLoginPage() {
    return (
      <div className="App page-login">
        <header className="App-header">{common.title}</header>
        <div className="login-card">
          <h2>{login.question}</h2>
          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (this.shouldJoinButtonBeEnabled()) {
                this.onClickJoin();
              }
            }}
          >
            <MaxLengthTextField
              label={login.nameLabel}
              onChange={this.updateJoinName}
              value={this.state.joinName}
              maxLength={12}
            />
            <p id={"errormessage"}>{this.state.joinError}</p>
            <button type="submit" disabled={!this.shouldJoinButtonBeEnabled()}>
              {login.join}
            </button>
          </form>
        </div>
        <JoinQRCode caption={login.qrCaption} />
        <p className="credits">{login.credits}</p>
      </div>
    );
  }

  //</editor-fold>

  /////////////////// Lobby Page
  //<editor-fold desc="Lobby Page">

  /**
   * Renders the playerlist as a sequence of paragraph tags.
   * Written as "{@literal <p>} - {@code username} {@literal </p>}".
   */
  renderPlayerList() {
    return this.state.usernames.map((name: string, i: number) => {
      return (
        <Player
          key={i}
          name={name}
          showRole={false}
          icon={this.state.icons[name]}
          isBusy={this.state.icons[name] === defaultPortrait}
          highlight={name === this.state.name}
        />
      );
    });
  }

  onClickChangeIcon() {
    this.showChangeIconAlert();
  }

  updateChangeIconAlert() {
    this.setState({
      alertContent: (
        <IconSelection
          onConfirm={() => {
            this.clearAnimationQueue();
            this.hideAlertAndFinish();
          }}
          sendWSCommand={this.sendWSCommand}
          playerToIcon={this.state.icons}
          players={this.state.usernames}
          user={this.state.name}
        />
      ),
    });
  }

  showChangeIconAlert() {
    this.queueAlert(<div />, false); // false here prevents dialog from closing when server confirms selection
    this.updateChangeIconAlert();
  }

  /**
   * Determines whether the 'Start Game' button in the lobby should be enabled.
   */
  shouldStartGameBeEnabled() {
    // Verify that all players have icons
    for (let i = 0; i < this.state.usernames.length; i++) {
      if (this.state.icons[this.state.usernames[i]] === defaultPortrait) {
        return false;
      }
    }
    return true;
  }

  /**
   * Contacts the server and requests to start the game.
   */
  onClickStartGame() {
    this.sendWSCommand({ command: WSCommandType.START_GAME });
  }

  onClickLeaveLobby() {
    storageSet(AUTO_REJOIN_KEY, null);
    this.reconnectOnConnectionClosed = false;
    this.websocket?.close();
  }

  showSnackBar(message: string) {
    this.setState({ snackbarMessage: message });
    let snackbar = document.getElementById("snackbar");
    if (snackbar === null) {
      return;
    }
    snackbar.className = "show";
    this.snackbarMessages++;
    setTimeout(() => {
      this.snackbarMessages--;
      if (this.snackbarMessages === 0) {
        snackbar!.className = snackbar!.className.replace("show", "");
      }
    }, 3000);
  }

  renderLobbyPage() {
    // The first player in the lobby is counted as the host (VIP).
    let isVIP =
      this.state.usernames.length > 0 &&
      this.state.usernames[0] === this.state.name;
    const host = this.state.usernames.length > 0 ? this.state.usernames[0] : "";
    const playerCount = this.state.usernames.length;
    return (
      <div className="App page-lobby">
        <header className="App-header">{common.title}</header>

        <CustomAlert show={this.state.showAlert}>
          {this.state.alertContent}
        </CustomAlert>

        <div id={"lobby-lower-container"}>
          <div id={"lobby-player-area-container"}>
            <div id={"lobby-player-text-choose-container"}>
              <p id={"lobby-player-count-text"}>{lobby.players(playerCount)}</p>
              <button
                id={"lobby-change-icon-button"}
                onClick={this.onClickChangeIcon}
              >
                {lobby.changeLook}
              </button>
            </div>
            <div id={"lobby-player-container"}>{this.renderPlayerList()}</div>
          </div>

          <div id={"lobby-button-container"}>
            {isVIP ? (
              <p id={"lobby-vip-text"}>
                {playerCount < 5
                  ? lobby.hostFewPlayers
                  : lobby.hostReady}
              </p>
            ) : (
              <p id={"lobby-vip-text"}>{lobby.waitingForHost(host)}</p>
            )}
            <label className="lobby-option">
              <input
                type="checkbox"
                checked={this.state.hideCounts}
                disabled={!isVIP}
                onChange={(event) =>
                  this.sendWSCommand({
                    command: WSCommandType.SET_HIDE_COUNTS,
                    hideCounts: event.target.checked,
                  })
                }
              />
              <span>
                {lobby.hideCounts}
                {!isVIP && (
                  <span className="lobby-option-note"> · {lobby.hostOnly}</span>
                )}
              </span>
            </label>
            {isVIP && (
              <div className="lobby-game-settings">
                <strong>USTAWIENIA GRY</strong>
                <small>{lobby.customRules}</small>
                {([
                  ["fascistDeckSize", "Karty faszystowskie"],
                  ["liberalDeckSize", "Karty liberalne"],
                  ["fascistVictoryThreshold", "Faszyści wygrywają"],
                  ["liberalVictoryThreshold", "Liberałowie wygrywają"],
                  ["hitlerChancellorThreshold", "Hitler jako kanclerz od"],
                ] as const).map(([field, label]) => (
                  <label key={field}>
                    {label}
                    <input
                      type="number"
                      min={field === "hitlerChancellorThreshold" ? 0 : 1}
                      max={30}
                      value={this.state.gameSettings[field]}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        this.setState((state) => ({
                          gameSettings: { ...state.gameSettings, [field]: value },
                        }));
                      }}
                      onBlur={() => {
                        const settings = this.state.gameSettings;
                        if (
                          settings.fascistDeckSize >= 6 &&
                          settings.fascistDeckSize <= 30 &&
                          settings.liberalDeckSize >= 5 &&
                          settings.liberalDeckSize <= 20 &&
                          settings.fascistVictoryThreshold >= 1 &&
                          settings.fascistVictoryThreshold <= settings.fascistDeckSize &&
                          settings.liberalVictoryThreshold >= 1 &&
                          settings.liberalVictoryThreshold <= settings.liberalDeckSize &&
                          settings.hitlerChancellorThreshold >= 0 &&
                          settings.hitlerChancellorThreshold < settings.fascistVictoryThreshold
                        ) {
                          this.sendWSCommand({
                            command: WSCommandType.SET_GAME_SETTINGS,
                            ...settings,
                          });
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="lobby-actions">
              <button
                onClick={this.onClickStartGame}
                disabled={!isVIP || !this.shouldStartGameBeEnabled()}
              >
                {lobby.start}
              </button>
              <button
                className="button-secondary"
                onClick={this.onClickLeaveLobby}
              >
                {lobby.leave}
              </button>
            </div>
          </div>

          <JoinQRCode compact caption={lobby.qrCaption} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div id="snackbar">{this.state.snackbarMessage}</div>
        </div>
      </div>
    );
  }

  //</editor-fold>

  /////////////////// Game Page
  //<editor-fold desc="Game Page">

  showExecutionResults(name: string, newState: GameState): void {
    if (name === newState.targetUser) {
      this.queueAlert(
        <ButtonPrompt
          label={prompts.executedYouLabel}
          headerText={prompts.executedYouHelp}
          buttonText={common.ok}
          buttonOnClick={this.hideAlertAndFinish}
        />,
        false
      );
    } else {
      this.queueAlert(
        <ButtonPrompt
          label={prompts.executionResultsLabel}
          footerText={prompts.executedOther(newState.targetUser!)}
          buttonOnClick={this.hideAlertAndFinish}
          buttonText={common.ok}
        >
          <PlayerDisplay
            user={name}
            gameState={newState}
            showRoles={false}
            playerDisabledFilter={DISABLE_EXECUTED_PLAYERS}
            players={[newState.targetUser!]}
          />
        </ButtonPrompt>,
        false
      );
    }
  }

  /**
   * Queues animations for when the game state has changed.
   * @param newState {Object} the new game state sent from the server.
   */
  onGameStateChanged(newState: GameState) {
    let oldState = this.state.gameState;
    let name = this.state.name;
    let isPresident = this.state.name === newState.president;
    let isChancellor = this.state.name === newState.chancellor;
    let state = newState.state;

    // If last state was setup, which indicates that the client is re-entering the game or starting the game, then
    // we set the card count, liberal/fascist policy count, and the tracker.
    if (
      oldState.hasOwnProperty(PARAM_STATE) &&
      oldState[PARAM_STATE] === STATE_SETUP
    ) {
      this.setState({
        liberalPolicies: newState.liberalPolicies,
        fascistPolicies: newState.fascistPolicies,
        electionTracker: newState.electionTracker,
        drawDeckSize: newState.drawSize,
        discardDeckSize: newState.discardSize,
      });
    }

    // Check for changes in enacted policies and election tracker.
    const statesToShowPolicyFor = [
      LobbyState.POST_LEGISLATIVE,
      LobbyState.PP_INVESTIGATE,
      LobbyState.PP_EXECUTION,
      LobbyState.PP_ELECTION,
      LobbyState.PP_PEEK,
      LobbyState.FASCIST_VICTORY_POLICY,
      LobbyState.LIBERAL_VICTORY_POLICY,
    ];
    if (statesToShowPolicyFor.includes(state)) {
      // Check if the election tracker changed positions.
      if (newState.electionTracker !== this.state.gameState.electionTracker) {
        let newPos = newState.electionTracker;
        let advancedToThree = newPos === 0 && newState.electionTrackerAdvanced;
        // We ignore all resets to 0, unless that reset was caused by the election tracker reaching 3.
        if (newPos !== 0 || advancedToThree) {
          // If the last phase was voting, we failed due to voting. Therefore, show votes.
          if (oldState[PARAM_STATE] === STATE_CHANCELLOR_VOTING) {
            //this.queueAlert(<RoleAlert onClick={this.hideAlertAndFinish} />);
            this.addAnimationToQueue(() => this.showVotes(newState));
          }

          let trackerPosition = newPos;
          if (advancedToThree) {
            // If the tracker was reset because it advanced to 3, show it moving to 3 in the dialog box.
            trackerPosition = 3;
          }
          this.queueAlert(
            <ElectionTrackerAlert
              trackerPosition={trackerPosition}
              closeAlert={this.hideAlertAndFinish}
            />
          );
        }
      }

      let liberalChanged =
        newState.liberalPolicies !== oldState.liberalPolicies;
      let fascistChanged =
        newState.fascistPolicies !== oldState.fascistPolicies;

      if (liberalChanged || fascistChanged) {
        // Show an alert with the new policy
        this.queueAlert(
          <PolicyEnactedAlert
            hideAlert={this.hideAlertAndFinish}
            policyType={newState.lastPolicy}
          />
        );
      }

      // Update the decks, board with the new policies / election tracker.
      this.addAnimationToQueue(() => {
        this.setState({
          liberalPolicies: newState.liberalPolicies,
          fascistPolicies: newState.fascistPolicies,
          electionTracker: newState.electionTracker,
        });
        setTimeout(() => this.onAnimationFinish(), 500);
      });
    }

    // Check for state change
    if (newState[PARAM_STATE] !== this.state.gameState[PARAM_STATE]) {
      // state has changed
      switch (newState[PARAM_STATE]) {
        case STATE_CHANCELLOR_NOMINATION:
          if (
            newState.electionTracker === 0 &&
            newState.liberalPolicies === 0 &&
            newState.fascistPolicies === 0
          ) {
            // If the game has just started (everything in default state), show the player's role.
            this.queueAlert(
              <RoleAlert
                role={newState.players[this.state.name].id}
                gameState={newState}
                name={name}
                onClick={() => {
                  this.hideAlertAndFinish();
                }}
              />,
              false
            );
          }

          this.queueEventUpdate(game.eventNomination);
          this.queueStatusMessage(game.statusNomination);

          if (isPresident) {
            //Show the chancellor nomination window.
            this.queueAlert(
              SelectNominationPrompt(name, newState, this.sendWSCommand)
            );
          }

          break;

        case STATE_CHANCELLOR_VOTING:
          this.setState({ statusBarText: "" });
          this.queueEventUpdate(game.eventVoting);
          this.queueStatusMessage(game.statusVoting);
          // Check if the player is dead or has already voted-- if so, do not show the voting prompt.
          if (
            newState.players[name][PLAYER_IS_ALIVE] &&
            !Object.keys(newState.userVotes).includes(name)
          ) {
            this.queueAlert(
              <VotingPrompt
                gameState={newState}
                sendWSCommand={this.sendWSCommand}
                user={this.state.name}
              />,
              true
            );
          }

          break;

        case STATE_LEGISLATIVE_PRESIDENT:
          // The vote completed, so show the votes.
          this.addAnimationToQueue(() => this.showVotes(newState));
          this.queueEventUpdate(game.eventLegislative);

          // TODO: Animate cards being pulled from the draw deck for all users.

          this.queueStatusMessage(game.statusPresidentDiscard);

          if (isPresident) {
            if (!newState.presidentChoices) {
              throw new Error("President choices not found.");
            }
            this.queueAlert(
              <PresidentLegislativePrompt
                policyOptions={newState.presidentChoices}
                sendWSCommand={this.sendWSCommand}
              />
            );
          }

          break;

        case STATE_LEGISLATIVE_CHANCELLOR:
          this.queueStatusMessage(game.statusChancellorEnact);
          if (isChancellor) {
            if (!newState.chancellorChoices) {
              throw new Error("Chancellor choices not found.");
            }
            this.queueAlert(
              <ChancellorLegislativePrompt
                fascistPolicies={newState.fascistPolicies}
                showError={(message: string) =>
                  this.setState({ snackbarMessage: message })
                }
                policyOptions={newState.chancellorChoices}
                sendWSCommand={this.sendWSCommand}
                // Disable if veto has already happened
                enableVeto={
                  newState.fascistPolicies === 5 && !newState.vetoOccurred
                }
              />
            );
          }
          break;

        case STATE_LEGISLATIVE_PRESIDENT_VETO:
          this.queueStatusMessage(game.statusVetoRequested);
          if (isPresident) {
            this.queueAlert(
              <VetoPrompt
                sendWSCommand={this.sendWSCommand}
                electionTracker={newState.electionTracker}
              />,
              true
            );
          }
          break;

        case STATE_PP_PEEK:
          this.queueEventUpdate(game.eventPower);
          if (isPresident) {
            if (!newState.peek) {
              throw new Error("Peek policies not found.");
            }
            this.queueAlert(
              <PeekPrompt
                policies={newState.peek}
                sendWSCommand={this.sendWSCommand}
              />,
              true
            );
          } else {
            this.queueStatusMessage(game.statusPeek);
          }
          break;

        case STATE_PP_ELECTION:
          this.queueEventUpdate(game.eventPower);
          if (isPresident) {
            this.queueAlert(
              SelectSpecialElectionPrompt(name, newState, this.sendWSCommand)
            );
          } else {
            this.queueStatusMessage(game.statusSpecialElection);
          }
          break;

        case STATE_PP_EXECUTION:
          this.queueEventUpdate(game.eventPower);
          if (isPresident) {
            this.queueAlert(
              SelectExecutionPrompt(name, newState, this.sendWSCommand),
              true
            );
          } else {
            this.queueStatusMessage(game.statusExecution);
          }
          break;

        case STATE_PP_INVESTIGATE:
          this.queueEventUpdate(game.eventPower);
          if (isPresident) {
            this.queueAlert(
              SelectInvestigationPrompt(name, newState, this.sendWSCommand)
            );
          } else {
            this.queueStatusMessage(game.statusInvestigation);
          }
          break;

        case STATE_POST_LEGISLATIVE:
          // Show results of any special elections, executions, or investigations.
          switch (newState.lastState) {
            case STATE_PP_ELECTION:
              if (!isPresident) {
                console.log("Special Election Alert: " + newState.targetUser);
                this.queueAlert(
                  <ButtonPrompt
                    label={prompts.specialElectionLabel}
                    footerText={prompts.specialElectionResult(
                      newState[PARAM_PRESIDENT],
                      newState.targetUser!
                    )}
                    buttonText={common.ok}
                    buttonOnClick={this.hideAlertAndFinish}
                  >
                    <PlayerDisplay
                      user={name}
                      gameState={newState}
                      showLabels={false}
                      players={[newState.targetUser!]}
                    />
                  </ButtonPrompt>,
                  false
                );
              }
              break;
            case STATE_PP_EXECUTION:
              // If player was executed
              this.showExecutionResults(name, newState);
              break;
            case STATE_PP_INVESTIGATE:
              if (!isPresident) {
                let isTarget = newState.targetUser === name;
                let footerText = isTarget
                  ? prompts.investigatedYou(newState[PARAM_PRESIDENT])
                  : prompts.investigatedOther(
                      newState.targetUser!,
                      newState[PARAM_PRESIDENT]
                    );
                this.queueAlert(
                  <ButtonPrompt
                    label={prompts.investigationResultsLabel}
                    footerText={footerText}
                    buttonOnClick={this.hideAlertAndFinish}
                    buttonText={common.ok}
                  >
                    <PlayerDisplay
                      user={name}
                      gameState={newState}
                      showLabels={false}
                      players={[newState.targetUser!]}
                    />
                  </ButtonPrompt>,
                  true
                );
              } else {
                // Is President; do nothing because we handle the
                // response directly from the server.
              }
              break;
            case STATE_PP_PEEK: // No additional case is necessary for peeking.
            default:
          }

          this.queueStatusMessage(game.statusEndTerm);
          break;

        case STATE_LIBERAL_VICTORY_EXECUTION:
        case STATE_FASCIST_VICTORY_ELECTION:
        case STATE_FASCIST_VICTORY_POLICY:
        case STATE_LIBERAL_VICTORY_POLICY:
          // Show normal enactments when victory events happen.
          if (newState.state === STATE_LIBERAL_VICTORY_EXECUTION) {
            this.showExecutionResults(name, newState);
          }
          if (newState.state === STATE_FASCIST_VICTORY_ELECTION) {
            this.addAnimationToQueue(() => this.showVotes(newState));
          }
          // Policies will already be shown for policy-based victories.
          // If the game was won via election, show the votes.

          // Divide fascist and liberal players.
          const fascistPlayers: string[] = [];
          const liberalPlayers: string[] = [];
          newState.playerOrder.forEach((player) => {
            const role = newState.players[player].id;
            if (role === Role.FASCIST || role === Role.HITLER) {
              fascistPlayers.push(player);
            } else {
              liberalPlayers.push(player);
            }
          });

          let victoryMessage: string,
            messageClass: string,
            headerImage: string,
            headerAlt: string;
          let players: string[] = [];
          let state = newState.state;
          let fascistVictoryPolicy = state === STATE_FASCIST_VICTORY_POLICY;
          let fascistVictoryElection = state === STATE_FASCIST_VICTORY_ELECTION;
          let liberalVictoryPolicy = state === STATE_LIBERAL_VICTORY_POLICY;
          let liberalVictoryExecution =
            state === STATE_LIBERAL_VICTORY_EXECUTION;
          let playerID = newState.players[name].id;
          let playerWon =
            (playerID === Role.LIBERAL &&
              (liberalVictoryExecution || liberalVictoryPolicy)) ||
            (playerID !== Role.LIBERAL &&
              (fascistVictoryElection || fascistVictoryPolicy));

          // Register player victory/loss with analytics.
          // TODO: Only register if player is host, or if player is the only
          // non-bot player in the game.
          if (playerWon) {
          } else {
          }

          if (fascistVictoryElection || fascistVictoryPolicy) {
            players = fascistPlayers.concat(liberalPlayers);
            headerImage = VictoryFascistHeader;
            headerAlt = alt.fascistVictory;
            messageClass = "highlight";
            if (fascistVictoryPolicy) {
              victoryMessage = prompts.fascistsPassedPolicies;
            } else if (fascistVictoryElection) {
              victoryMessage = prompts.fascistsElectedHitler;
            }
          } else {
            players = liberalPlayers.concat(fascistPlayers);
            headerImage = VictoryLiberalHeader;
            headerAlt = alt.liberalVictory;
            messageClass = "highlight-blue";
            if (liberalVictoryPolicy) {
              victoryMessage = prompts.liberalsPassedPolicies;
            } else if (liberalVictoryExecution) {
              victoryMessage = prompts.liberalsExecutedHitler;
            }
          }
          if (DEBUG) {
            console.log("Player ordering: " + players);
          }
          this.addAnimationToQueue(() => {
            this.setState({
              alertContent: (
                <ButtonPrompt
                  renderLabel={() => {
                    return (
                      <>
                        <img
                          src={headerImage}
                          alt={headerAlt}
                          id={"victory-header"}
                        />
                        <p
                          style={{ textAlign: "center" }}
                          className={messageClass}
                        >
                          {victoryMessage}
                        </p>
                      </>
                    );
                  }}
                  buttonText={prompts.returnToLobby}
                  buttonOnClick={() => {
                    this.gameOver = false;
                    this.reconnectOnConnectionClosed = true;
                    this.tryOpenWebSocket(this.state.name, this.state.lobby);
                    this.hideAlertAndFinish();
                    this.setState({
                      page: PAGE.LOBBY,
                      gameState: DEFAULT_GAME_STATE,
                      liberalPolicies: 0,
                      fascistPolicies: 0,
                      electionTracker: 0,
                      drawDeckSize: 17,
                      discardDeckSize: 0,
                    });
                  }}
                >
                  <PlayerDisplay
                    players={players}
                    playerDisabledFilter={DISABLE_NONE}
                    showRoles={true}
                    showLabels={false}
                    useAsButtons={false}
                    user={this.state.name}
                    gameState={newState}
                  />
                </ButtonPrompt>
              ),
              showAlert: true,
            });
          });
          this.gameOver = true;
          this.reconnectOnConnectionClosed = false;
          this.websocket?.close();
          break;

        default:
        // Do nothing
      }
    }

    // Update the draw decks
    this.addAnimationToQueue(() => {
      this.setState({
        drawDeckSize: newState.drawSize,
        discardDeckSize: newState.discardSize,
      });
      this.onAnimationFinish();
    });
  }

  //// Animation Handling
  // <editor-fold desc="Animation Handling">

  /**
   * Plays the next animation in the queue if it exists.
   * @effects If {@code this.animationQueue} is not empty,
   *          removes the function at the front of the animation queue and calls it.
   */
  onAnimationFinish() {
    if (this.animationQueue.length > 0) {
      let func = this.animationQueue.shift();
      if (func !== undefined) {
        func(); //call the function.
      }
    } else {
      // the animation queue is empty, so we set a flag.
      this.allAnimationsFinished = true;
      this.setState({ allAnimationsFinished: true });
    }
  }

  /**
   * Clears the animation queue and ends any currently playing animations.
   */
  clearAnimationQueue() {
    this.allAnimationsFinished = true;
    this.setState({ allAnimationsFinished: true });
    this.animationQueue = [];
  }

  /**
   * Adds the specified animation to the end of the queue.
   * @param func {function} the function to add to the animation queue.
   * @effects Adds the function to the back of the animation queue. If no animations are currently playing,
   *          starts the specified animation.
   */
  addAnimationToQueue(func: () => void) {
    this.animationQueue.push(func);
    if (this.allAnimationsFinished) {
      this.allAnimationsFinished = false;
      this.setState({ allAnimationsFinished: false });
      let func = this.animationQueue.shift();
      if (func !== undefined) {
        func(); //call the function.
      }
    }
  }

  showVotes(newState: GameState) {
    this.setState({ statusBarText: game.statusTallying });
    setTimeout(() => {
      this.setState({ showVotes: true });
    }, 1000);
    // Calculate final result:

    let noVotes = 0;
    let yesVotes = 0;
    Object.values(newState.userVotes).forEach((value) => {
      if (value) {
        yesVotes++;
      } else {
        noVotes++;
      }
    });
    setTimeout(() => {
      if (yesVotes > noVotes) {
        this.setState({
          statusBarText: game.voteResult(yesVotes, noVotes, true),
        });
      } else {
        this.setState({
          statusBarText: game.voteResult(yesVotes, noVotes, false),
        });
      }
    }, 2000);
    setTimeout(
      () => this.setState({ showVotes: false, statusBarText: "" }),
      6000
    );
    setTimeout(() => {
      this.onAnimationFinish();
    }, 6500);
  }

  /**
   * Adds a listener to be called when the server returns an 'OK' status.
   * @param func The function to be called.
   * @effects adds the listener to the queue of functions. When the server returns an 'OK' status, all of the
   *          listeners will be called and then cleared from the queue.
   */
  addServerOKListener(func: () => void) {
    this.okMessageListeners.push(func);
  }

  /**
   * Hides the CustomAlert and marks this animation as finished.
   * @param delayExit {boolean} When true, delays advancing the animation queue until after the alert is hidden.
   * @effects: Sets {@code this.state.showAlert} to false and hides the CustomAlert.
   *           If delayExit is true, waits until the CustomAlert is done hiding before advancing the animation queue.
   *           Otherwise, immediately queues the next animation.
   */
  hideAlertAndFinish(delayExit = true) {
    this.setState({ showAlert: false });
    if (delayExit) {
      setTimeout(() => {
        this.setState({ alertContent: <div /> }); // reset the alert box contents
        this.onAnimationFinish();
      }, CUSTOM_ALERT_FADE_DURATION);
    } else {
      this.setState({ alertContent: <div /> });
      this.onAnimationFinish();
    }
  }

  /**
   * Shows the eventBar for a set period of time.
   * @param message {String} the message for the Event Bar to be fully visible.
   * @param duration {Number} the duration (in ms) for the Event Bar to be visible. (default is 3000 ms).
   * @effects Adds a function to the animation queue that, when called, shows the EventBar with the given message
   *          for {@code duration} ms, then advances to the next animation when finished.
   */
  queueEventUpdate(message: string, duration = 2000) {
    this.addAnimationToQueue(() => {
      this.setState({
        showEventBar: true,
        eventBarMessage: message,
      });
      setTimeout(() => {
        this.setState({ showEventBar: false });
      }, duration);
      setTimeout(() => {
        this.onAnimationFinish();
      }, duration + EVENT_BAR_FADE_OUT_DURATION);
    });
  }

  /**
   * Adds a CustomAlert to the animation queue.
   * @param content {html} the contents to be shown in the AlertBox.
   * @param closeOnOK {boolean} whether to close the alert when the server responds with an ok message. (default = true)
   * @effects Adds a new function to the animation queue that, when called, causes a CustomAlert with the
   *          given {@code content} to appear. If {@code closeOnOK} is true, once shown, the alert box will
   *          be closed when the server responds with an 'ok' to any command. (There will be a short delay before the
   *          animation queue advances if not waiting for a server response.)
   */
  queueAlert(content: React.JSX.Element, closeOnOK = true) {
    this.addAnimationToQueue(() => {
      this.setState({
        alertContent: content,
        showAlert: true,
      });
      if (closeOnOK) {
        // Remove the exit delay if waiting for the server response, because otherwise the player will lag
        // behind everyone else.
        this.addServerOKListener(() => this.hideAlertAndFinish(false));
      }
    });
  }

  /**
   * Adds an update to the status message to the animation queue.
   * @param message {String} the text for the status bar to display.
   * @effects Adds a new function to the animation queue that, when called, updates {@code this.state.statusBarText} to
   *          the message provided then instantly advances the animation queue.
   */
  queueStatusMessage(message: string) {
    this.addAnimationToQueue(() => {
      this.setState({ statusBarText: message });
      this.onAnimationFinish();
    });
  }

  // </editor-fold>

  /**
   * Renders the game page.
   */
  renderGamePage() {
    return (
      <div
        className={
          "App page-game" +
          (this.state.gameState.playerOrder.length > 5
            ? " players-two-rows"
            : "")
        }
        style={{ textAlign: "center" }}
      >
        <header className="App-header">{common.title}</header>

        <CustomAlert show={this.state.showAlert}>
          {this.state.alertContent}
        </CustomAlert>

        <EventBar
          show={this.state.showEventBar}
          message={this.state.eventBarMessage}
        />

        <div
          className="game-player-area"
          style={{ backgroundColor: "var(--backgroundDark)" }}
        >
          <PlayerDisplay
            gameState={this.state.gameState}
            user={this.state.name}
            showVotes={this.state.showVotes}
            showBusy={this.state.allAnimationsFinished} // Only show busy when there isn't an active animation.
            playerDisabledFilter={DISABLE_EXECUTED_PLAYERS}
          />
        </div>

        <StatusBar>{this.state.statusBarText}</StatusBar>

        <div className="game-board-area">
          <div id={"Board Layout"} className="game-board-layout">
            <div className="game-deck-row">
              <Deck
                cardCount={this.state.drawDeckSize}
                deckType={"DRAW"}
                hideCount={this.state.hideCounts}
              />

              <div className="game-deck-center">
                <button
                  className="end-term-button"
                  disabled={
                    this.state.gameState[PARAM_STATE] !==
                      STATE_POST_LEGISLATIVE ||
                    this.state.name !== this.state.gameState[PARAM_PRESIDENT]
                  }
                  onClick={() => {
                    this.sendWSCommand({ command: WSCommandType.END_TERM });
                  }}
                >
                  {game.endTerm}
                </button>

                <PlayerPolicyStatus
                  numFascistPolicies={this.state.fascistPolicies}
                  numLiberalPolicies={this.state.liberalPolicies}
                  playerCount={this.state.gameState.playerOrder.length}
                  hidePoliciesLeft={this.state.hideCounts}
                />
              </div>

              <Deck
                cardCount={this.state.discardDeckSize}
                deckType={"DISCARD"}
                hideCount={this.state.hideCounts}
              />
            </div>

            <Board
              numPlayers={this.state.gameState.playerOrder.length}
              numFascistPolicies={this.state.fascistPolicies}
              numLiberalPolicies={this.state.liberalPolicies}
              electionTracker={this.state.electionTracker}
            />
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div id="snackbar">{this.state.snackbarMessage}</div>
        </div>
      </div>
    );
  }

  //</editor-fold>

  render() {
    let page_render;
    switch (this.state.page) {
      case PAGE.LOBBY:
        page_render = this.renderLobbyPage();
        break;
      case PAGE.GAME:
        page_render = this.renderGamePage();
        break;
      case PAGE.LOGIN: // login is default
      default:
        page_render = this.renderLoginPage();
    }
    return page_render;
  }
}

export default App;
