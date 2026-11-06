import React, {Component} from 'react';
import PropTypes from "prop-types";
import ButtonPrompt from "./ButtonPrompt";

import ETBoard from '../assets/board-election-tracker.png';
import ETToken from '../assets/board-tracker.png';

import './ElectionTrackerAlert.css';

class ElectionTrackerAlert extends Component {

    constructor(props) {
        super(props);
        let initialPos = "et-position-" + (this.props.trackerPosition - 1);
        let moveClass = "et-moveto-" + (this.props.trackerPosition);
        this.state = {
            trackerClass: initialPos
        };
        setTimeout(()=>this.setState({trackerClass:moveClass}), 500);
    }

    render() {
        return (
            <ButtonPrompt
                label={"RZĄD NIE ZOSTAŁ UCHWALONY"}
                renderHeader={() => {
                    return (<>
                            <p className={"left-align"}>
                                Licznik wyborów przesuwa się o 1 za każdym razem, gdy rząd nie uchwali
                                (lub odmawia uchwalenia) ustawy, i resetuje się po każdym jej uchwaleniu.
                            </p>
                            <p className={"left-align highlight"}>
                                Gdy licznik osiągnie 3, pierwsza ustawa ze stosu dobierania zostaje natychmiast
                                uchwalona. Nie uruchamiają się wtedy uprawnienia prezydenta, a wszystkie ograniczenia kadencji zostają zresetowane.
                            </p>
                        </>);
                }}
                buttonText={"OK"}
                buttonOnClick={this.props.closeAlert}
            >
                <div id={"election-tracker-container"}>
                    <img id="election-tracker-board"
                         src={ETBoard}
                         alt={"Plansza licznika wyborów. Niebieska plansza z czterema polami, po których przesuwa się licznik."}
                    />
                    <img id="election-tracker-token"
                         className={this.state.trackerClass}
                         src={ETToken}
                         alt={"Znacznik licznika wyborów na pozycji " + this.props.trackerPosition + " z 3."}
                     />
                </div>
            </ButtonPrompt>
        )
    }
}

ElectionTrackerAlert.propTypes = {
    trackerPosition: PropTypes.number.isRequired,
    closeAlert: PropTypes.func.isRequired,
};

export default ElectionTrackerAlert;