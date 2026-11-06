import React, { Component } from "react";
import ButtonPrompt from "./ButtonPrompt";
import { SERVER_TIMEOUT } from "../constants";
import { SendWSCommand, WSCommandType } from "../types";

type VetoPromptProps = {
  sendWSCommand: SendWSCommand;
  electionTracker: number;
};

type VetoPromptState = {
  waitingForServer: boolean;
};

class VetoPrompt extends Component<VetoPromptProps, VetoPromptState> {
  constructor(props: VetoPromptProps) {
    super(props);
    this.state = {
      waitingForServer: false,
    };
  }

  onButtonClick(accepted: boolean) {
    this.setState({ waitingForServer: true });
    setTimeout(
      () => this.setState({ waitingForServer: false }),
      SERVER_TIMEOUT
    );

    this.props.sendWSCommand({
      command: WSCommandType.REGISTER_PRESIDENT_VETO,
      veto: accepted,
    });
  }

  render() {
    return (
      <ButtonPrompt
        label={"WETO LEGISLATYWNE"}
        renderHeader={() => {
          return (
            <>
              <p className={"left-align"}>
                Kanclerz poprosił o odrzucenie obu ustaw.
              </p>
              {this.props.electionTracker === 2 && (
                <p className={"left-align highlight"}>
                  Jeśli weto zostanie zaakceptowane, pierwsza ustawa ze stosu
                  dobierania zostanie automatycznie uchwalona.
                </p>
              )}
              {this.props.electionTracker !== 2 && (
                <p className={"left-align"}>
                  Jeśli weto zostanie zaakceptowane, pozostałe ustawy zostaną
                  odrzucone, a licznik wyborów przesunie się o 1.
                </p>
              )}
              <p className={"left-align"}>
                W przeciwnym razie kanclerz będzie musiał normalnie uchwalić ustawę.
              </p>
              <br />
            </>
          );
        }}
        footerText={"Zaakceptować weto?"}
        renderButton={() => {
          return (
            <>
              <button
                onClick={() => this.onButtonClick(false)}
                disabled={this.state.waitingForServer}
              >
                ODRZUĆ
              </button>
              <button
                onClick={() => this.onButtonClick(true)}
                disabled={this.state.waitingForServer}
              >
                ZAAKCEPTUJ
              </button>
            </>
          );
        }}
      />
    );
  }
}

export default VetoPrompt;
