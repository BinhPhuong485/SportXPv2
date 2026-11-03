package exe.sportxp.backend.core.security;

import exe.sportxp.backend.core.exception.BusinessException;
import exe.sportxp.backend.core.exception.ErrorCode;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    // Clean code pattern
    private SecurityUtils() { }

    public static UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal userPrincipal) {
            return userPrincipal.id();
        }

        return null;
    }

    public static UUID requireCurrentUserId() {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return userId;
    }
}
