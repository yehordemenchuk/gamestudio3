package org.slitherlinkgame.dto.response;

import java.util.Date;

public record CommentResponse(Long id,
                              String game,
                              String player,
                              String comment,
                              Date datedOn) {
}
