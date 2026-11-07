import React, { Component } from "react";
import PropTypes from "prop-types";
import ButtonPrompt from "./ButtonPrompt";

import LiberalPolicy from "../assets/pl/policy-liberal.png";
import FascistPolicy from "../assets/pl/policy-fascist.png";
import FolderCoverFront from "../assets/pl/policy-folder-cover-front.png";
import FolderCoverBack from "../assets/policy-folder-cover-back.png";
import FolderBack from "../assets/policy-folder-back.png";

import "./PolicyEnactedAlert.css";
import { LIBERAL } from "../constants";
import { alt, common, prompts } from "../strings";

class PolicyEnactedAlert extends Component {
  shiftAnimationTimeout;
  flipAnimationTimeout;

  constructor(props) {
    super(props);
    this.state = {
      className: "",
    };
  }

  componentDidMount() {
    // Set up animations
    this.shiftAnimationTimeout = setTimeout(() => {
      this.setState({ className: "show-policy-shift" });
    }, 500);
    this.flipAnimationTimeout = setTimeout(() => {
      this.setState({ className: "show-policy-flip show-policy-shift" });
    }, 1000);
  }

  componentWillUnmount() {
    clearTimeout(this.shiftAnimationTimeout);
    clearTimeout(this.flipAnimationTimeout);
  }

  render() {
    return (
      <ButtonPrompt
        renderLabel={() => {
          return <h2 className={"left-align"}>{prompts.policyEnacted}</h2>; // aligns text with center
        }}
        buttonText={common.ok}
        buttonOnClick={this.props.hideAlert}
      >
        <div id={"policy-enacted-container"}>
          <img
            id={"policy-enacted-back"}
            className={this.state.className}
            src={FolderBack}
            alt={""}
          />
          <img
            id={"policy-enacted-policy"}
            className={this.state.className}
            src={
              this.props.policyType === LIBERAL ? LiberalPolicy : FascistPolicy
            }
            alt={alt.policyEnacted(this.props.policyType)}
          />
          <img
            id={"policy-enacted-cover-back"}
            src={FolderCoverBack}
            className={this.state.className}
            alt={alt.newPolicyFolder}
          />
          <img
            id={"policy-enacted-cover-front"}
            src={FolderCoverFront}
            className={this.state.className}
            alt={alt.newPolicyFolder}
          />
        </div>
      </ButtonPrompt>
    );
  }
}

PolicyEnactedAlert.propTypes = {
  hideAlert: PropTypes.func.isRequired,
  policyType: PropTypes.string.isRequired,
};

export default PolicyEnactedAlert;
