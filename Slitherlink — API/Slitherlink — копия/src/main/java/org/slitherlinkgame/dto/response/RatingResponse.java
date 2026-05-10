package org.slitherlinkgame.dto.response;

import java.util.Date;

public record RatingResponse(Long id,
                             String game,
                             String player,
                             Integer ratingPoints,
                             Date ratedOn) {
}
