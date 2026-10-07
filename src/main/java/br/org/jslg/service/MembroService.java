package br.org.jslg.service;

import br.org.jslg.domain.Membro;
import br.org.jslg.dto.MembroRequest;
import br.org.jslg.dto.MembroResponse;
import br.org.jslg.exception.RecursoNaoEncontradoException;
import br.org.jslg.exception.RegraNegocioException;
import br.org.jslg.repository.MembroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class MembroService {
    private final MembroRepository repository;
    public MembroService(MembroRepository repository) { this.repository = repository; }

    @Transactional(readOnly = true)
    public List<MembroResponse> listar() { return repository.findAll().stream().map(MembroResponse::from).toList(); }

    @Transactional(readOnly = true)
    public MembroResponse buscar(Long id) { return MembroResponse.from(obter(id)); }

    public MembroResponse criar(MembroRequest request) {
        Membro membro = new Membro(); preencher(membro, request);
        return MembroResponse.from(repository.save(membro));
    }

    public MembroResponse atualizar(Long id, MembroRequest request) {
        Membro membro = obter(id);
        preencher(membro, request);
        return MembroResponse.from(repository.save(membro));
    }

    public void excluir(Long id) { repository.delete(obter(id)); }

    public Membro obter(Long id) { return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Membro não encontrado.")); }
    private void preencher(Membro m, MembroRequest r) {
        m.setNome(r.nome().trim());
        m.setInstagram(normalizarInstagram(r.instagram()));
        m.setTelefone(normalizarTelefone(r.telefone()));
    }

    private String normalizarInstagram(String instagram) {
        if (instagram == null || instagram.isBlank()) return null;
        String usuario = instagram.trim();
        if (usuario.startsWith("@")) usuario = usuario.substring(1);
        return usuario.isBlank() ? null : usuario;
    }

    private String normalizarTelefone(String telefone) {
        if (telefone == null || telefone.isBlank()) return null;
        String valor = telefone.trim();
        if (!valor.matches("\\+?[0-9()\\s.-]+")) {
            throw new RegraNegocioException("Informe o telefone usando somente números, espaços, parênteses ou hífen.");
        }
        if (valor.contains("+") && (!valor.startsWith("+") || !valor.startsWith("+55"))) {
            throw new RegraNegocioException("Use o codigo internacional brasileiro +55 ou informe o telefone sem codigo de pais.");
        }
        String digitos = valor.replaceAll("\\D", "");
        if (valor.startsWith("+55")) digitos = digitos.substring(2);
        if (digitos.length() != 10 && digitos.length() != 11) {
            throw new RegraNegocioException("Informe DDD e número completo: 10 dígitos para telefone fixo ou 11 para celular.");
        }
        String ddd = digitos.substring(0, 2);
        String numero = digitos.substring(2);
        int inicioSufixo = numero.length() == 9 ? 5 : 4;
        return "(" + ddd + ") " + numero.substring(0, inicioSufixo) + "-" + numero.substring(inicioSufixo);
    }
}
