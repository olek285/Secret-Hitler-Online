import React, { Component } from "react";
import PropTypes from "prop-types";
import ButtonPrompt from "./ButtonPrompt";

import LiberalPolicy from "../assets/policy-liberal.png";
import FascistPolicy from "../assets/policy-fascist.png";
import FolderCoverFront from "../assets/policy-folder-cover-front.png";
import FolderCoverBack from "../assets/policy-folder-cover-back.png";
import FolderBack from "../assets/policy-folder-back.png";

import "./PolicyEnactedAlert.css";
import { LIBERAL } from "../constants";

class PolicyEnactedAlert extends Component {
  shiftAnimationTimeout;
  flipAnimationTimeout;
  closeAnimationTimeout;

  constructor(props) {
    super(props);
    this.state = {
      className: "",
    };
  }

  componentDidMount() {
    // Open the folder, slide the policy inside, then close the folder.
    this.shiftAnimationTimeout = setTimeout(() => {
      this.setState({ className: "policy-folder-open" });
    }, 500);
    this.flipAnimationTimeout = setTimeout(() => {
      this.setState({ className: "policy-folder-inserted" });
    }, 1000);
    this.closeAnimationTimeout = setTimeout(() => {
      this.setState({ className: "policy-folder-closed" });
    }, 1600);
  }

  componentWillUnmount() {
    clearTimeout(this.shiftAnimationTimeout);
    clearTimeout(this.flipAnimationTimeout);
    clearTimeout(this.closeAnimationTimeout);
  }

  render() {
    return (
      <ButtonPrompt
        renderLabel={() => {
          return <h2 className={"left-align"}>USTAWA UCHWALONA</h2>; // aligns text with center
        }}
        buttonText={"OK"}
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
            alt={
              this.props.policyType === LIBERAL
                ? "Uchwalona ustawa liberalna, oznaczona niebieskim symbolem gołębia."
                : "Uchwalona ustawa faszystowska, oznaczona czerwonym symbolem czaszki."
            }
          />
          <img
            id={"policy-enacted-cover-back"}
            src={FolderCoverBack}
            className={this.state.className}
            alt={"Teczka opisana „Nowa ustawa”."}
          />
          <img
            id={"policy-enacted-cover-front"}
            src={FolderCoverFront}
            className={this.state.className}
            alt={"Teczka opisana „Nowa ustawa”."}
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
