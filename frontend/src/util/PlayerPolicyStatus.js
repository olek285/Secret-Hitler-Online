import React, {Component} from "react";
import PropTypes from "prop-types";
import IconFascist from "../assets/player-icon-fascist.png";
import IconHitler from "../assets/player-icon-hitler.png";
import IconLiberal from "../assets/player-icon-liberal.png";

import './PlayerPolicyStatus.css';
import { FASCIST, HITLER, LIBERAL } from '../constants';
import { game, roleName } from '../strings';

const NUM_HITLER_PLAYERS = 1;
const MAX_FASCIST_POLICIES = 11;
const MAX_LIBERAL_POLICIES = 6;

class PlayerPolicyStatus extends  Component {

    render() {
        let fascistPlayers, liberalPlayers;
        let props = this.props;
        if (props.playerCount <= 6) {
            fascistPlayers = 1;
        } else if (props.playerCount <= 8) {
            fascistPlayers = 2;
        } else {
            fascistPlayers = 3;
        }
        liberalPlayers = props.playerCount - fascistPlayers - NUM_HITLER_PLAYERS;

        return (
            <div id={"pps-container"}>
                <p id={"pps-text"}>
                    <span className="pps-long">{game.rolesLong}</span>
                    <span className="pps-short">{game.rolesShort}</span>
                </p>
                <div id={"pps-icon-container"}>
                    <img id="pps-icon" src={IconLiberal} alt={roleName(LIBERAL)}/>
                    <p id={"pps-icon-number"} className={"highlight-blue"}>{liberalPlayers}</p>
                    <img id="pps-icon" src={IconFascist} alt={roleName(FASCIST)}/>
                    <p id={"pps-icon-number"} className={"highlight"}>{fascistPlayers}</p>
                    <img id="pps-icon" src={IconHitler} alt={roleName(HITLER)}/>
                    <p id={"pps-icon-number"}  className={"highlight"}>{NUM_HITLER_PLAYERS}</p>
                </div>

                {!props.hidePoliciesLeft && <>
                <p id={"pps-text"}>
                    <span className="pps-long">{game.policiesLeftLong}</span>
                    <span className="pps-short">{game.policiesLeftShort}</span>
                </p>
                <div id={"pps-icon-container"}>
                    <img id="pps-icon" className={"highlight-blue"} src={IconLiberal} alt={roleName(LIBERAL)}/>
                    <p id={"pps-icon-number"} className={"highlight-blue"}>{MAX_LIBERAL_POLICIES - props.numLiberalPolicies}</p>
                    <img id="pps-icon" className={"highlight"} src={IconFascist} alt={roleName(FASCIST)}/>
                    <p id={"pps-icon-number"} className={"highlight"}>{MAX_FASCIST_POLICIES - props.numFascistPolicies}</p>
                </div>
                </>}
            </div>
        )
    }
}

PlayerPolicyStatus.propTypes = {
    numFascistPolicies: PropTypes.number.isRequired,
    numLiberalPolicies: PropTypes.number.isRequired,
    playerCount: PropTypes.number.isRequired,
    hidePoliciesLeft: PropTypes.bool, // lobby setting: hide the policies-left row
};

export default PlayerPolicyStatus;