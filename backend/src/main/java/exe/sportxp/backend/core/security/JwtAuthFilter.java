package exe.sportxp.backend.core.security;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component 
@RequiredArgsConstructor 
@Slf4j 
public class JwtAuthFilter extends OncePerRequestFilter{
    
    private final JwtDecoder decoder;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Jwt jwt = decoder.decode(token);
                UUID userId = UUID.fromString(jwt.getSubject());
                String email = jwt.getClaimAsString("email");
                List <GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
                
                var auth = new UsernamePasswordAuthenticationToken(
                    new UserPrincipal(userId, email, authorities), null, authorities
                );
                
                SecurityContextHolder.getContext().setAuthentication(auth);
                
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                log.warn("JWT Authentication failed: {}", e.getMessage());
            } 
        }
        filterChain.doFilter(request, response);
    }
}
