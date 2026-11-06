import React, { Component } from "react";
import "../selectable.css";
import "./IconSelection.css";
import portraits, {
  unlockedPortraits,
  defaultPortrait,
} from "../assets";
import { portraitsAltText } from "../assets";

import ButtonPrompt from "./ButtonPrompt";
import { SendWSCommand, WSCommandType } from "../types";

type IconSelectionProps = {
  playerToIcon: Record<string, string>;
  players: string[];
  sendWSCommand: SendWSCommand;
  user: string;
  onConfirm: () => void;
};

type IconSelectionState = {
  customIcon?: string;
};

class IconSelection extends Component<IconSelectionProps, IconSelectionState> {
  timeoutID: NodeJS.Timeout | undefined;

  constructor(props: IconSelectionProps) {
    super(props);

    this.state = {};

    this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
    this.getIconButtonHML = this.getIconButtonHML.bind(this);
    this.isIconInUse = this.isIconInUse.bind(this);
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutID);
  }

  isIconInUse(iconID: string) {
    let playerOrder = this.props.players;
    for (let i = 0; i < playerOrder.length; i++) {
      let player = playerOrder[i];
      if (this.props.playerToIcon[player] === iconID) {
        return true;
      }
    }
    return false;
  }

  onClickIcon(iconID: string) {
    // Verify that player is able to select this icon.
    // Also does not allow selection if user has already selected this icon
    let unselectable = this.isIconInUse(iconID);

    if (!unselectable) {
      // This is a valid choice according to our current game state
      // Register the selection with the server.
      // Contact the server using provided method.
      this.props.sendWSCommand({
        command: WSCommandType.SELECT_ICON,
        icon: iconID,
      });
    }
  }

  onSelectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const cropSize = Math.min(source.width, source.height);
        const cropX = (source.width - cropSize) / 2;
        const cropY = (source.height - cropSize) / 2;
        const maxDimension = 512;
        const scale = Math.min(1, maxDimension / cropSize);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(cropSize * scale));
        canvas.height = canvas.width;
        const context = canvas.getContext("2d");
        if (!context) {
          return;
        }
        context.drawImage(
          source,
          cropX,
          cropY,
          cropSize,
          cropSize,
          0,
          0,
          canvas.width,
          canvas.height
        );
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        if (compressed.length <= 700000) {
          this.setState({ customIcon: compressed });
        }
      };
      source.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Called when any icon is clicked.
   * @effects Attempts to send the server a command with the player's vote, and locks access to the button
   *          for {@code SERVER_TIMEOUT} ms.
   */
  onConfirmButtonClick() {
    // Check that user has a profile picture assigned according to the game state
    if (this.props.playerToIcon[this.props.user] !== defaultPortrait) {
      this.props.onConfirm();
    } else if (this.state.customIcon) {
      this.onClickIcon(this.state.customIcon);
      this.props.onConfirm();
    }
  }

  getIconButtonHML(portraitNames: string[]): React.JSX.Element {
    // Update selections based on game state given by the server (this prevents duplicate player icons).

    let currPortrait = this.props.playerToIcon[this.props.user];

    const iconHTML: (React.JSX.Element | undefined)[] = portraitNames.map(
      (portraitID, index: number) => {
        // Check if valid portrait name
        if (!portraits[portraitID]) {
          return undefined;
        }
        // Disable locked icons or icons currently selected by other players.
        let isIconAvailable =
          !this.isIconInUse(portraitID) || portraitID === currPortrait;
        let isEnabled = isIconAvailable;
        let isSelected = currPortrait === portraitID;
        // TODO: Convert this to a button since a clickable div is not accessible.
        return (
          <img
            id={"icon"}
            key={index}
            className={
              "selectable" +
              (isSelected ? " selected" : "") +
              (!isEnabled ? " disabled" : "")
            } // Determines if selected / selectable
            alt={portraitsAltText[portraitID]}
            src={portraits[portraitID]}
            draggable={false}
            onClick={() => this.onClickIcon(portraitID)}
          ></img>
        );
      }
    );

    // Return all the icons in a div container.
    return <div id={"icon-container"}>{iconHTML}</div>;
  }

  render() {
    return (
      <ButtonPrompt
        label={"WYGLĄD GRACZA"}
        renderHeader={() => {
          return (
            <>
              <p>Wybierz wygląd, a następnie naciśnij przycisk potwierdzenia.</p>
              {this.getIconButtonHML(unlockedPortraits)}
              <label className="photo-upload">
                DODAJ WŁASNE ZDJĘCIE
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={this.onSelectPhoto}
                />
              </label>
              {this.state.customIcon && (
                <img
                  id="icon"
                  className="selectable selected"
                  src={this.state.customIcon}
                  alt="Podgląd własnego zdjęcia."
                />
              )}
            </>
          );
        }}
        buttonDisabled={
          this.props.playerToIcon[this.props.user] === defaultPortrait &&
          !this.state.customIcon
        }
        buttonOnClick={this.onConfirmButtonClick}
      ></ButtonPrompt>
    );
  }
}

export default IconSelection;
