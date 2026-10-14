package br.org.jslg.service;

import br.org.jslg.config.JwtService;
import br.org.jslg.domain.Coordenador;
import br.org.jslg.domain.PapelCoordenador;
import br.org.jslg.dto.LoginRequest;
import br.org.jslg.repository.CoordenadorRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutenticacaoServiceTest {

    @Mock CoordenadorRepository repository;
    @Mock PasswordEncoder encoder;
    JwtService jwt;
    AutenticacaoService service;

    @BeforeEach
    void configurar() {
        jwt = new JwtService("0123456789abcdef0123456789abcdef", Duration.ofHours(1), new ObjectMapper());
        service = new AutenticacaoService(repository, encoder, jwt);
    }

    @Test
    void loginRecusaSenhaIncorreta() {
        Coordenador coordenador = new Coordenador();
        coordenador.setSenhaHash("hash");
        when(repository.findByUsuarioIgnoreCaseAndAtivoTrue("usuario")).thenReturn(Optional.of(coordenador));
        when(encoder.matches("senha-errada", "hash")).thenReturn(false);

        assertThrows(AutenticacaoService.CredenciaisInvalidasException.class,
                () -> service.login(new LoginRequest("usuario", "senha-errada")));
    }

    @Test
    void loginRecusaCoordenadorInativo() {
        when(repository.findByUsuarioIgnoreCaseAndAtivoTrue("inativo")).thenReturn(Optional.empty());

        assertThrows(AutenticacaoService.CredenciaisInvalidasException.class,
                () -> service.login(new LoginRequest("inativo", "senha-correta")));
    }

    @Test
    void loginEmiteTokenParaCoordenadorAtivo() {
        Coordenador coordenador = new Coordenador();
        coordenador.setUsuario("ana");
        coordenador.setSenhaHash("hash");
        coordenador.setPapel(PapelCoordenador.COORDENADOR);
        when(repository.findByUsuarioIgnoreCaseAndAtivoTrue("ana")).thenReturn(Optional.of(coordenador));
        when(encoder.matches("senha-correta", "hash")).thenReturn(true);
        var resposta = service.login(new LoginRequest("ana", "senha-correta"));

        assertEquals("ana", jwt.validar(resposta.token()).usuario());
        assertEquals("COORDENADOR", resposta.papel());
    }
}
