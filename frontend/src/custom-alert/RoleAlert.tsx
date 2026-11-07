import React, { Component } from "react";
import RoleHitler from "../assets/pl/role-hitler.png";
import RoleLiberal1 from "../assets/pl/role-liberal-1.png";
import RoleLiberal2 from "../assets/pl/role-liberal-2.png";
import RoleLiberal3 from "../assets/pl/role-liberal-3.png";
import RoleLiberal4 from "../assets/pl/role-liberal-4.png";
import RoleLiberal5 from "../assets/pl/role-liberal-5.png";
import RoleLiberal6 from "../assets/pl/role-liberal-6.png";
import RoleFascist1 from "../assets/pl/role-fascist-1.png";
import RoleFascist2 from "../assets/pl/role-fascist-2.png";
import RoleFascist3 from "../assets/pl/role-fascist-3.png";

import "./RoleAlert.css";
import { GameState, Role } from "../types";
import { alt, common, prompts } from "../strings";

const LiberalImages = [
  RoleLiberal1,
  RoleLiberal2,
  RoleLiberal3,
  RoleLiberal4,
  RoleLiberal5,
  RoleLiberal6,
];
const LiberalImagesAltText = alt.liberalRoleCards;
const HitlerImages = [RoleHitler];
const HitlerImagesAltText = alt.hitlerRoleCards;
const FascistImages = [RoleFascist1, RoleFascist2, RoleFascist3];
const FascistImagesAltText = alt.fascistRoleCards;

const LiberalText = prompts.liberalText;
const FascistText = prompts.fascistText;
const HitlerText = prompts.hitlerText;

type RoleAlertProps = {
  role?: Role;
  name: string;
  gameState: GameState;
  onClick: () => void;
};

/**
 * CustomAlert content that shows the player's current role and a quick guide on how to play
 * the game.
 * Parameters:
 *      - {@code role} [String]: The role of the player. Should be either LIBERAL, FASCIST, or HITLER.
 *      - {@code roleID} [int]: The integer roleID of the player. This is used to show unique role cards.
 *          The roleID can range from [1, 6] for LIBERALS, [1, 3] for FASCISTS, and [1] for HITLER. If out of bounds,
 *          the value is set to 1 (default).
 *      - {@code onClick} [()]: The callback function for when confirmation button ("OKAY") is pressed.
 */
class RoleAlert extends Component<RoleAlertProps> {
  getRoleImageAndAlt(): { image: string; alt: string } {
    let images: string[];
    let imageAlts: string[];
    switch (this.props.role) {
      case Role.LIBERAL:
        images = LiberalImages;
        imageAlts = LiberalImagesAltText;
        break;
      case Role.FASCIST:
        images = FascistImages;
        imageAlts = FascistImagesAltText;
        break;
      default: // Hitler
        images = HitlerImages;
        imageAlts = HitlerImagesAltText;
    }
    const playerIndex = this.props.gameState.playerOrder.indexOf(
      this.props.name
    );
    const roleId = playerIndex % images.length;

    return {
      image: images[roleId],
      alt: imageAlts[roleId],
    };
  }

  render() {
    let roleText = HitlerText;
    if (this.props.role === Role.FASCIST) {
      roleText = FascistText;
    } else if (this.props.role === Role.LIBERAL) {
      roleText = LiberalText;
    }

    const { image, alt } = this.getRoleImageAndAlt();

    return (
      <div>
        <div>
          <h2 id="alert-header" className={"left-align"}>
            {prompts.yourRole(this.props.role)}
          </h2>
          <img id="role" src={image} alt={alt} />

          <p className={"left-align"}>{roleText[0]}</p>
          <p className={"left-align"}>{roleText[1]}</p>
          <p className="highlight left-align">{roleText[2]}</p>
        </div>

        <button onClick={this.props.onClick}>{common.ok}</button>
      </div>
    );
  }
}

export default RoleAlert;
