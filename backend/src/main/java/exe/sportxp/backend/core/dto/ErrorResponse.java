package exe.sportxp.backend.core.dto;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

public record ErrorResponse(
    boolean success,
    String errorCode,
    String message,
    List<String> details,
    Instant timestamp
) {
    public static ErrorResponse of(String errorCode, String message) {
        return new ErrorResponse(false, errorCode, message, Collections.emptyList(), Instant.now());
    }

    public static ErrorResponse of(String errorCode, String message, List<String> details) {
        return new ErrorResponse(false, errorCode, message, details != null ? details : Collections.emptyList(), Instant.now());
    }
}

