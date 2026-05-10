package org.slitherlinkgame.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.Date;

public record ScoreRequest(@NotEmpty String game,
                           @NotEmpty String player,
                           @PositiveOrZero Integer points,
                           @PastOrPresent Date playedOn) {
}
