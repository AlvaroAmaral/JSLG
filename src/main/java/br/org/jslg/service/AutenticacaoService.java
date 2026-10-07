package br.org.jslg.service;

import br.org.jslg.config.JwtService;
import br.org.jslg.domain.Coordenador;
import br.org.jslg.dto.LoginRequest;
import br.org.jslg.dto.LoginResponse;
import br.org.jslg.repository.CoordenadorRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AutenticacaoService {
    private final CoordenadorRepository repository;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    public AutenticacaoService(CoordenadorRepository repository, PasswordEncoder encoder, JwtService jwt) { this.repository = repository; this.encoder = encoder; this.jwt = jwt; }
    public LoginResponse login(LoginRequest request) {
        Coordenador coordenador = repository.findByUsuarioIgnoreCaseAndAtivoTrue(request.usuario())
                .filter(c -> encoder.matches(request.senha(), c.getSenhaHash()))
                .orElseThrow(() -> new CredenciaisInvalidasException());
        return new LoginResponse(jwt.emitir(coordenador.getUsuario(), coordenador.getPapel(), coordenador.getVersaoToken()), "Bearer", jwt.expiraEm(), coordenador.getUsuario(), coordenador.getPapel().name());
    }
    public static class CredenciaisInvalidasException extends RuntimeException { }
}
