package br.org.jslg.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import br.org.jslg.repository.CoordenadorRepository;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final CoordenadorRepository coordenadores;
    public JwtAuthenticationFilter(JwtService jwt, CoordenadorRepository coordenadores) { this.jwt = jwt; this.coordenadores = coordenadores; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            JwtService.Identidade identidade = jwt.validar(header.substring(7));
            var coordenadorAtual = identidade == null ? null : coordenadores.findByUsuarioIgnoreCaseAndAtivoTrue(identidade.usuario())
                    .filter(conta -> conta.getPapel() == identidade.papel() && conta.getVersaoToken() == identidade.versaoToken())
                    .orElse(null);
            if (coordenadorAtual != null) {
                var authorities = identidade.papel() == br.org.jslg.domain.PapelCoordenador.MASTER
                        ? List.of(new SimpleGrantedAuthority("ROLE_COORDENADOR"), new SimpleGrantedAuthority("ROLE_MASTER"))
                        : List.of(new SimpleGrantedAuthority("ROLE_COORDENADOR"));
                var auth = new UsernamePasswordAuthenticationToken(identidade.usuario(), null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }
}
