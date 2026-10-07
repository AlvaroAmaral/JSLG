package br.org.jslg.service;

import br.org.jslg.domain.Coordenador;
import br.org.jslg.domain.PapelCoordenador;
import br.org.jslg.dto.CoordenadorRequest;
import br.org.jslg.dto.CoordenadorAtualizacaoRequest;
import br.org.jslg.dto.CoordenadorResponse;
import br.org.jslg.exception.RegraNegocioException;
import br.org.jslg.repository.CoordenadorRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class CoordenadorService {
    private final CoordenadorRepository repository;
    private final PasswordEncoder encoder;

    public CoordenadorService(CoordenadorRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<CoordenadorResponse> listar() {
        return repository.findAll().stream()
                .sorted((a, b) -> a.getUsuario().compareToIgnoreCase(b.getUsuario()))
                .map(this::resposta)
                .toList();
    }

    @Transactional
    public CoordenadorResponse criar(CoordenadorRequest request) {
        String usuario = request.usuario().trim();
        if (repository.existsByUsuarioIgnoreCase(usuario)) {
            throw new RegraNegocioException("Já existe uma conta com esse nome de usuário.");
        }
        if (request.senha().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new RegraNegocioException("A senha deve ter no máximo 72 bytes em UTF-8.");
        }
        Coordenador coordenador = new Coordenador();
        coordenador.setUsuario(usuario);
        coordenador.setSenhaHash(encoder.encode(request.senha()));
        coordenador.setAtivo(true);
        coordenador.setPapel(PapelCoordenador.COORDENADOR);
        return resposta(repository.save(coordenador));
    }

    @Transactional
    public CoordenadorResponse atualizar(Long id, CoordenadorAtualizacaoRequest request) {
        Coordenador coordenador = obterCoordenadorComum(id);
        String usuario = request.usuario().trim();
        if (!coordenador.getUsuario().equalsIgnoreCase(usuario) && repository.existsByUsuarioIgnoreCaseAndIdNot(usuario, id)) {
            throw new RegraNegocioException("Já existe uma conta com esse nome de usuário.");
        }
        coordenador.setUsuario(usuario);
        if (request.senha() != null) {
            if (request.senha().isBlank()) throw new RegraNegocioException("Informe uma nova senha ou deixe o campo vazio para manter a atual.");
            if (request.senha().getBytes(StandardCharsets.UTF_8).length > 72) {
                throw new RegraNegocioException("A senha deve ter no máximo 72 bytes em UTF-8.");
            }
            coordenador.setSenhaHash(encoder.encode(request.senha()));
            coordenador.setVersaoToken(coordenador.getVersaoToken() + 1);
        }
        return resposta(repository.save(coordenador));
    }

    @Transactional
    public void excluir(Long id) {
        repository.delete(obterCoordenadorComum(id));
    }

    private Coordenador obterCoordenadorComum(Long id) {
        Coordenador coordenador = repository.findById(id)
                .orElseThrow(() -> new br.org.jslg.exception.RecursoNaoEncontradoException("Coordenador não encontrado."));
        if (coordenador.getPapel() != PapelCoordenador.COORDENADOR) {
            throw new RegraNegocioException("A conta master não pode ser editada ou excluída por esta área.");
        }
        return coordenador;
    }

    private CoordenadorResponse resposta(Coordenador coordenador) {
        return new CoordenadorResponse(coordenador.getId(), coordenador.getUsuario(), coordenador.getPapel().name(), coordenador.isAtivo());
    }
}
