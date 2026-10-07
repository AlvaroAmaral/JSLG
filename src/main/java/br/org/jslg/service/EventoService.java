package br.org.jslg.service;

import br.org.jslg.domain.Evento;
import br.org.jslg.domain.EventoArte;
import br.org.jslg.dto.EventoRequest;
import br.org.jslg.dto.EventoResponse;
import br.org.jslg.exception.RecursoNaoEncontradoException;
import br.org.jslg.repository.EventoRepository;
import br.org.jslg.repository.EventoArteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import br.org.jslg.exception.RegraNegocioException;

@Service
@Transactional
public class EventoService {
    private static final int TAMANHO_MAXIMO_ARTE = 1_048_576;
    private static final Pattern DATA_URI_ARTE = Pattern.compile("^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$");
    private final EventoRepository repository;
    private final EventoArteRepository artes;
    public EventoService(EventoRepository repository, EventoArteRepository artes) { this.repository = repository; this.artes = artes; }

    @Transactional(readOnly = true)
    public List<EventoResponse> listar() { return repository.findAll().stream().sorted(Comparator.comparing(Evento::getDataHora)).map(EventoResponse::from).toList(); }
    @Transactional(readOnly = true)
    public EventoResponse buscar(Long id) { return EventoResponse.from(obter(id)); }

    public EventoResponse criar(EventoRequest r) {
        Evento e = new Evento(); preencher(e, r); e = repository.save(e); salvarArte(e, r.arte()); return EventoResponse.from(e);
    }
    public EventoResponse atualizar(Long id, EventoRequest r) {
        Evento e = obter(id); preencher(e, r); e = repository.save(e); salvarArte(e, r.arte()); return EventoResponse.from(e);
    }
    public EventoResponse cancelar(Long id) { Evento e = obter(id); e.setCancelado(true); return EventoResponse.from(repository.save(e)); }
    public Evento obter(Long id) { return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Evento não encontrado.")); }
    private void preencher(Evento e, EventoRequest r) {
        if (r.dataHora() == null || !r.dataHora().isAfter(LocalDateTime.now())) throw new IllegalArgumentException("O evento deve ser agendado para uma data futura.");
        e.setTitulo(r.titulo().trim());
        e.setDataHora(r.dataHora());
        e.setLocal(r.local().trim());
        e.setDescricao(r.descricao() == null || r.descricao().isBlank() ? null : r.descricao().trim());
    }

    private void salvarArte(Evento evento, String arte) {
        if (arte == null || arte.isBlank()) return;
        Matcher matcher = DATA_URI_ARTE.matcher(arte);
        if (!matcher.matches()) throw new RegraNegocioException("Envie uma arte PNG, JPEG ou WebP válida.");
        byte[] dados;
        try { dados = Base64.getDecoder().decode(matcher.group(2)); }
        catch (IllegalArgumentException erro) { throw new RegraNegocioException("O arquivo da arte está inválido."); }
        if (dados.length == 0 || dados.length > TAMANHO_MAXIMO_ARTE || !assinaturaValida(dados, matcher.group(1))) {
            throw new RegraNegocioException("A arte deve ser uma imagem PNG, JPEG ou WebP válida de até 1 MB.");
        }
        EventoArte registro = artes.findById(evento.getId()).orElse(null);
        if (registro == null) registro = new EventoArte(evento, matcher.group(1), dados);
        else { registro.setMimeType(matcher.group(1)); registro.setDados(dados); }
        artes.save(registro);
        evento.setTemArte(true);
        repository.save(evento);
    }

    public EventoArte obterArte(Long id) {
        obter(id);
        return artes.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Arte do encontro não encontrada."));
    }

    private boolean assinaturaValida(byte[] dados, String mime) {
        if (mime.equals("image/png")) {
            byte[] assinatura = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
            if (dados.length < assinatura.length) return false;
            for (int i = 0; i < assinatura.length; i++) if (dados[i] != assinatura[i]) return false;
            return true;
        }
        if (mime.equals("image/jpeg")) return dados.length >= 3 && (dados[0] & 0xff) == 0xff && (dados[1] & 0xff) == 0xd8 && (dados[2] & 0xff) == 0xff;
        return dados.length >= 12 && dados[0] == 'R' && dados[1] == 'I' && dados[2] == 'F' && dados[3] == 'F'
                && dados[8] == 'W' && dados[9] == 'E' && dados[10] == 'B' && dados[11] == 'P';
    }
}
