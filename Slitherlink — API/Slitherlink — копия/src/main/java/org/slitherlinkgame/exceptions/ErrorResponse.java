package org.slitherlinkgame.exceptions;

public record ErrorResponse(
        int status,
        String message,
        long timestamp
) {}