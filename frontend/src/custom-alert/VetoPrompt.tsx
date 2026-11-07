import React, { Component } from "react";
import { prompts } from "../strings";
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
        label={prompts.vetoLabel}
        renderHeader={() => {
          return (
            <>
              <p className={"left-align"}>{prompts.vetoRequested}</p>
              {this.props.electionTracker === 2 && (
                <p className={"left-align highlight"}>
                  {prompts.vetoTrackerWarning}
                </p>
              )}
              {this.props.electionTracker !== 2 && (
                <p className={"left-align"}>{prompts.vetoTrackerAdvance}</p>
              )}
              <p className={"left-align"}>{prompts.vetoOtherwise}</p>
              <br />
            </>
          );
        }}
        footerText={prompts.vetoQuestion}
        renderButton={() => {
          return (
            <>
              <button
                onClick={() => this.onButtonClick(false)}
                disabled={this.state.waitingForServer}
              >
                {prompts.reject}
              </button>
              <button
                onClick={() => this.onButtonClick(true)}
                disabled={this.state.waitingForServer}
              >
                {prompts.accept}
              </button>
            </>
          );
        }}
      />
    );
  }
}

export default VetoPrompt;
