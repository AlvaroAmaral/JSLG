package br.org.jslg.config;

import br.org.jslg.domain.Coordenador;
import br.org.jslg.domain.PapelCoordenador;
import br.org.jslg.repository.CoordenadorRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;

@Component
public class CoordenadorInicial implements ApplicationRunner {
    private final CoordenadorRepository repository;
    private final PasswordEncoder encoder;
    private final String usuario;
    private final String senha;
    public CoordenadorInicial(CoordenadorRepository repository, PasswordEncoder encoder,
                              @Value("${app.security.admin-username}") String usuario,
                              @Value("${app.security.admin-password}") String senha) {
        this.repository = repository; this.encoder = encoder; this.usuario = usuario; this.senha = senha;
    }
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int bytesSenha = senha == null ? 0 : senha.getBytes(StandardCharsets.UTF_8).length;
        if (senha == null || senha.length() < 12 || bytesSenha > 72) {
            throw new IllegalStateException("Configure ADMIN_PASSWORD com 12 a 72 bytes UTF-8.");
        }
        Coordenador coordenador = repository.findByUsuarioIgnoreCase(usuario).orElseGet(() -> {
            Coordenador novo = new Coordenador();
            novo.setUsuario(usuario);
            novo.setSenhaHash(encoder.encode(senha));
            novo.setAtivo(true);
            return novo;
        });
        coordenador.setPapel(PapelCoordenador.MASTER);
        coordenador = repository.save(coordenador);

        Long idMasterConfigurado = coordenador.getId();
        var outrosMasters = repository.findAll().stream()
                .filter(conta -> !conta.getId().equals(idMasterConfigurado))
                .filter(conta -> conta.getPapel() == PapelCoordenador.MASTER)
                .toList();
        outrosMasters.forEach(conta -> conta.setPapel(PapelCoordenador.COORDENADOR));
        repository.saveAll(outrosMasters);
    }
}
