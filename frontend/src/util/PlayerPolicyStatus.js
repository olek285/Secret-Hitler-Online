import React, {Component} from "react";
import PropTypes from "prop-types";
import IconFascist from "../assets/player-icon-fascist.png";
import IconHitler from "../assets/player-icon-hitler.png";
import IconLiberal from "../assets/player-icon-liberal.png";

import './PlayerPolicyStatus.css';

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
        let fascistActions = props.playerCount <= 6
            ? ["1: brak akcji", "2: brak akcji", "3: śledztwo", "4: specjalne wybory", "5: egzekucja", "6: zwycięstwo"]
            : props.playerCount <= 8
                ? ["1: brak akcji", "2: śledztwo", "3: specjalne wybory", "4: egzekucja", "5: egzekucja", "6: zwycięstwo"]
                : ["1: śledztwo", "2: śledztwo", "3: specjalne wybory", "4: egzekucja", "5: egzekucja", "6: zwycięstwo"];

        return (
            <div id={"pps-container"}>
                <p id={"pps-text"}>
                    Gracze:
                </p>
                <div id={"pps-icon-container"}>
                    <img id="pps-icon" src={IconLiberal} alt={"Liberałowie"}/>
                    <p id={"pps-icon-number"} className={"highlight-blue"}>{liberalPlayers}</p>
                    <img id="pps-icon" src={IconFascist} alt={"Faszyści"}/>
                    <p id={"pps-icon-number"} className={"highlight"}>{fascistPlayers}</p>
                    <img id="pps-icon" src={IconHitler} alt={"Hitler"}/>
                    <p id={"pps-icon-number"}  className={"highlight"}>{NUM_HITLER_PLAYERS}</p>
                </div>

                <p id={"pps-text"}>
                    Pozostałe ustawy:
                </p>
                <div id={"pps-icon-container"}>
                    <img id="pps-icon" className={"highlight-blue"} src={IconLiberal} alt={"Liberałowie"}/>
                    <p id={"pps-icon-number"} className={"highlight-blue"}>{MAX_LIBERAL_POLICIES - props.numLiberalPolicies}</p>
                    <img id="pps-icon" className={"highlight"} src={IconFascist} alt={"Faszyści"}/>
                    <p id={"pps-icon-number"} className={"highlight"}>{MAX_FASCIST_POLICIES - props.numFascistPolicies}</p>
                </div>
                <div id="pps-rules">
                    <p>Liberałowie wygrywają po 5 ustawach, a faszyści po 6.</p>
                    <p>Po 3 ustawach faszystowskich Hitler nie może zostać kanclerzem.</p>
                    <p>Akcje faszystów: {fascistActions.join(" • ")}.</p>
                </div>
            </div>
        )
    }
}

PlayerPolicyStatus.propTypes = {
    numFascistPolicies: PropTypes.number.isRequired,
    numLiberalPolicies: PropTypes.number.isRequired,
    playerCount: PropTypes.number.isRequired,
};

export default PlayerPolicyStatus;