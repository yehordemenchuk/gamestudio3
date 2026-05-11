package org.slitherlinkgame.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;

import java.util.Date;

public record CommentRequest(@NotEmpty String game,
                             @NotEmpty String player,
                             @NotEmpty String comment,
                             Date datedOn) {

}

