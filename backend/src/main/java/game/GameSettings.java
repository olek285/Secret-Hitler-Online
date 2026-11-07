package game;

import java.io.Serializable;

/**
 * Rules selected by the lobby host before a game starts.
 */
public class GameSettings implements Serializable {
    public static final int DEFAULT_FASCIST_DECK_SIZE = 11;
    public static final int DEFAULT_LIBERAL_DECK_SIZE = 6;
    public static final int DEFAULT_FASCIST_VICTORY_THRESHOLD = 6;
    public static final int DEFAULT_LIBERAL_VICTORY_THRESHOLD = 5;
    public static final int DEFAULT_HITLER_CHANCELLOR_THRESHOLD = 3;

    private final int fascistDeckSize;
    private final int liberalDeckSize;
    private final int fascistVictoryThreshold;
    private final int liberalVictoryThreshold;
    private final int hitlerChancellorThreshold;

    public GameSettings() {
        this(DEFAULT_FASCIST_DECK_SIZE, DEFAULT_LIBERAL_DECK_SIZE,
                DEFAULT_FASCIST_VICTORY_THRESHOLD, DEFAULT_LIBERAL_VICTORY_THRESHOLD,
                DEFAULT_HITLER_CHANCELLOR_THRESHOLD);
    }

    public GameSettings(int fascistDeckSize, int liberalDeckSize,
            int fascistVictoryThreshold, int liberalVictoryThreshold,
            int hitlerChancellorThreshold) {
        if (fascistDeckSize < 6 || fascistDeckSize > 30
                || liberalDeckSize < 5 || liberalDeckSize > 20
                || fascistVictoryThreshold < 1 || fascistVictoryThreshold > fascistDeckSize
                || liberalVictoryThreshold < 1 || liberalVictoryThreshold > liberalDeckSize
                || hitlerChancellorThreshold < 0
                || hitlerChancellorThreshold >= fascistVictoryThreshold) {
            throw new IllegalArgumentException("Invalid game settings.");
        }
        this.fascistDeckSize = fascistDeckSize;
        this.liberalDeckSize = liberalDeckSize;
        this.fascistVictoryThreshold = fascistVictoryThreshold;
        this.liberalVictoryThreshold = liberalVictoryThreshold;
        this.hitlerChancellorThreshold = hitlerChancellorThreshold;
    }

    public int getFascistDeckSize() {
        return fascistDeckSize;
    }

    public int getLiberalDeckSize() {
        return liberalDeckSize;
    }

    public int getFascistVictoryThreshold() {
        return fascistVictoryThreshold;
    }

    public int getLiberalVictoryThreshold() {
        return liberalVictoryThreshold;
    }

    public int getHitlerChancellorThreshold() {
        return hitlerChancellorThreshold;
    }
}
