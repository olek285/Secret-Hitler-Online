import React, { Component } from "react";
import { alt, prompts } from "../strings";
import "../selectable.css";
import "./IconSelection.css";
import portraits, {
  unlockedPortraits,
  lockedPortraits,
  defaultPortrait,
} from "../assets";
import { portraitsAltText } from "../assets";
import {
  iconSrc,
  isPhotoIcon,
  makeAvatarDataUrl,
  PHOTO_TOO_BIG,
} from "../util/avatar";

import ButtonPrompt from "./ButtonPrompt";
import { SendWSCommand, WSCommandType } from "../types";

// The last photo this browser used, so the photo tile can switch back to it
// after a portrait was picked (also across reloads).
const PHOTO_STORAGE_KEY = "sh-photo";

function loadSavedPhoto(): string | undefined {
  try {
    const id = window.localStorage.getItem(PHOTO_STORAGE_KEY);
    return isPhotoIcon(id) ? (id as string) : undefined;
  } catch (e) {
    return undefined;
  }
}

function savePhoto(id: string | undefined) {
  try {
    if (id) {
      window.localStorage.setItem(PHOTO_STORAGE_KEY, id);
    } else {
      window.localStorage.removeItem(PHOTO_STORAGE_KEY);
    }
  } catch (e) {
    // Storage blocked (private mode): the tile just forgets the photo.
  }
}

type IconSelectionProps = {
  playerToIcon: Record<string, string>;
  players: string[];
  sendWSCommand: SendWSCommand;
  user: string;
  onConfirm: () => void;
};

type IconSelectionState = {
  unlockLockedIcons: boolean;
  /* The photo shown on the photo tile: the current icon if it is a photo, else the last one used. */
  photoId?: string;
  /* A picked file is being shrunk. */
  photoBusy: boolean;
  /* Shown instead of the help line after a failed photo. */
  photoError?: string;
};

class IconSelection extends Component<IconSelectionProps, IconSelectionState> {
  timeoutID: NodeJS.Timeout | undefined;
  fileInput = React.createRef<HTMLInputElement>();
  unmounted = false;
  // Photos that failed to load (gone after a server restart); never remembered again.
  brokenPhotos = new Set<string>();

  constructor(props: IconSelectionProps) {
    super(props);

    // Private build: every portrait is available (upstream gated half of them
    // behind sharing a tweet).
    this.state = {
      unlockLockedIcons: true,
      photoId: loadSavedPhoto(),
      photoBusy: false,
    };

    this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
    this.getIconButtonHML = this.getIconButtonHML.bind(this);
    this.isIconInUse = this.isIconInUse.bind(this);
  }

  componentDidMount() {
    this.rememberCurrentPhoto();
  }

  componentDidUpdate(prevProps: IconSelectionProps) {
    if (prevProps.playerToIcon !== this.props.playerToIcon) {
      this.rememberCurrentPhoto();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    clearTimeout(this.timeoutID);
  }

  /** When the server confirms a photo as our icon, keep it for the photo tile. */
  rememberCurrentPhoto() {
    const current = this.props.playerToIcon[this.props.user];
    if (
      isPhotoIcon(current) &&
      current !== this.state.photoId &&
      !this.brokenPhotos.has(current)
    ) {
      this.setState({ photoId: current, photoError: undefined });
      savePhoto(current);
    }
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
      if (this.state.photoError) {
        this.setState({ photoError: undefined });
      }
    }
  }

  /**
   * The photo tile is a label for the hidden file input, so a tap opens the
   * picker. When it shows a photo that is not the current icon, the tap
   * selects that photo instead.
   */
  onPhotoTileClick = (event: React.MouseEvent<HTMLLabelElement>) => {
    if (event.target === this.fileInput.current) {
      return; // the click the label forwards to the input
    }
    if (this.state.photoBusy) {
      event.preventDefault();
      return;
    }
    const current = this.props.playerToIcon[this.props.user];
    const photoId = this.state.photoId;
    if (photoId && photoId !== current) {
      event.preventDefault();
      this.setState({ photoError: undefined });
      this.props.sendWSCommand({
        command: WSCommandType.SELECT_ICON,
        icon: photoId,
      });
    }
  };

  /** Shrinks the picked photo and sends it right away. */
  onPhotoPicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files && input.files[0];
    input.value = ""; // so picking the same file again still fires a change
    if (!file) {
      return;
    }
    this.setState({ photoBusy: true, photoError: undefined });
    try {
      const dataUrl = await makeAvatarDataUrl(file);
      this.props.sendWSCommand({
        command: WSCommandType.SELECT_ICON,
        icon: dataUrl,
      });
      if (!this.unmounted) {
        this.setState({ photoBusy: false });
      }
    } catch (e) {
      if (!this.unmounted) {
        const tooBig = e instanceof Error && e.message === PHOTO_TOO_BIG;
        this.setState({
          photoBusy: false,
          photoError: tooBig ? prompts.lookPhotoTooBig : prompts.lookPhotoError,
        });
      }
    }
  };

  onPhotoTileImageError = () => {
    const photoId = this.state.photoId;
    if (photoId) {
      this.brokenPhotos.add(photoId);
      savePhoto(undefined);
      this.setState({ photoId: undefined });
    }
  };

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

  renderPhotoTile(currPortrait: string): React.JSX.Element {
    const { photoId, photoBusy } = this.state;
    const isSelected = !!photoId && photoId === currPortrait;
    return (
      <label
        id={"icon"}
        key={"photo"}
        className={
          "selectable icon-photo" +
          (isSelected ? " selected" : "") +
          (photoBusy ? " busy" : "")
        }
        onClick={this.onPhotoTileClick}
      >
        {photoId && !photoBusy ? (
          <img
            className="icon-photo-image"
            src={iconSrc(photoId)}
            alt={alt.yourPhoto}
            draggable={false}
            onError={this.onPhotoTileImageError}
          />
        ) : (
          <span className="icon-photo-add">
            <span className="icon-photo-plus">{photoBusy ? "…" : "+"}</span>
            {prompts.lookPhoto}
          </span>
        )}
        {isSelected && !photoBusy && (
          <span className="icon-photo-change">{prompts.lookPhotoChange}</span>
        )}
        <input
          ref={this.fileInput}
          className="icon-photo-input"
          type="file"
          accept="image/*"
          aria-label={alt.addPhoto}
          onChange={this.onPhotoPicked}
        />
      </label>
    );
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

    // Return all the icons in a div container, the photo tile first.
    return (
      <div id={"icon-container"}>
        {this.renderPhotoTile(currPortrait)}
        {iconHTML}
      </div>
    );
  }

  render() {
    const allPortraits = unlockedPortraits.concat(lockedPortraits);
    return (
      <ButtonPrompt
        label={prompts.lookLabel}
        renderHeader={() => {
          return (
            <>
              <p
                className={this.state.photoError ? "icon-photo-error" : ""}
                role={this.state.photoError ? "alert" : undefined}
              >
                {this.state.photoError || prompts.lookHelp}
              </p>
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
