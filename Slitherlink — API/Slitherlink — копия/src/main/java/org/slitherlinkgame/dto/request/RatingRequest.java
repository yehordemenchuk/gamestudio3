package org.slitherlinkgame.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;

import java.util.Date;

public record RatingRequest(@NotEmpty String game,
                            @NotEmpty String player,
                            @Min(0) @Max(5) Integer rating,
                          @PastOrPresent Date ratedOn) {
}
