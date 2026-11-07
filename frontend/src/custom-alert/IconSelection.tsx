import React, { Component } from "react";
import { prompts } from "../strings";
import "../selectable.css";
import "./IconSelection.css";
import portraits, {
  unlockedPortraits,
  lockedPortraits,
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
  unlockLockedIcons: boolean;
};

class IconSelection extends Component<IconSelectionProps, IconSelectionState> {
  timeoutID: NodeJS.Timeout | undefined;

  constructor(props: IconSelectionProps) {
    super(props);

    // Private build: every portrait is available (upstream gated half of them
    // behind sharing a tweet).
    this.state = {
      unlockLockedIcons: true,
    };

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
    let isPremium = lockedPortraits.indexOf(iconID) !== -1;
    // Also does not allow selection if user has already selected this icon
    let unselectable =
      (isPremium && !this.state.unlockLockedIcons) || this.isIconInUse(iconID);

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

  /**
   * Called when any icon is clicked.
   * @effects Attempts to send the server a command with the player's vote, and locks access to the button
   *          for {@code SERVER_TIMEOUT} ms.
   */
  onConfirmButtonClick() {
    // Check that user has a profile picture assigned according to the game state
    if (this.props.playerToIcon[this.props.user] !== defaultPortrait) {
      this.props.onConfirm();
    }
  }

  onPhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
        window.alert("Wybierz zdjęcie do 8 MB.");
        return;
      }
      const image = new Image();
      image.onload = () => {
        const maxSide = 256;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          window.alert("Nie udało się przygotować zdjęcia.");
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.72);
        if (compressed.length > 120000) {
          window.alert("Zdjęcie jest nadal za duże. Wybierz inne.");
          return;
        }
        this.props.sendWSCommand({
          command: WSCommandType.SELECT_ICON,
          icon: compressed,
        });
        URL.revokeObjectURL(image.src);
      };
      image.onerror = () => window.alert("Nie udało się odczytać zdjęcia.");
      image.src = URL.createObjectURL(file);
  };

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
        let isIconUnlocked =
          lockedPortraits.indexOf(portraitID) === -1 ||
          this.state.unlockLockedIcons;
        let isEnabled = isIconUnlocked && isIconAvailable;
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
    const allPortraits = unlockedPortraits.concat(lockedPortraits);
    return (
      <ButtonPrompt
        label={prompts.lookLabel}
        renderHeader={() => {
          return (
            <>
              <p>{prompts.lookHelp}</p>
              <label className="custom-photo-upload">
                WŁASNE ZDJĘCIE
                <input type="file" accept="image/*" onChange={this.onPhotoSelected} />
              </label>
              {this.props.playerToIcon[this.props.user]?.startsWith("data:") && (
                <img
                  className="custom-photo-preview"
                  src={this.props.playerToIcon[this.props.user]}
                  alt="Wybrane zdjęcie"
                />
              )}
              {this.getIconButtonHML(allPortraits)}
            </>
          );
        }}
        buttonDisabled={
          this.props.playerToIcon[this.props.user] === defaultPortrait
        }
        buttonOnClick={this.onConfirmButtonClick}
      ></ButtonPrompt>
    );
  }
}

export default IconSelection;
