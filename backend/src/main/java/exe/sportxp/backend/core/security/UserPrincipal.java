package exe.sportxp.backend.core.security;

import java.security.Principal;
import java.util.Collection;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;

public record UserPrincipal (
    UUID id, 
    String email,
    Collection<? extends GrantedAuthority> authorities ) implements Principal    
{
    @Override
    public String getName() {
        return id != null ? id.toString() : "";
    }
}
