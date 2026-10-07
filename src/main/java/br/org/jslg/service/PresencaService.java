package br.org.jslg.service;

import br.org.jslg.domain.Evento;
import br.org.jslg.domain.Membro;
import br.org.jslg.domain.Presenca;
import br.org.jslg.dto.PresencaResponse;
import br.org.jslg.exception.RecursoNaoEncontradoException;
import br.org.jslg.exception.RegraNegocioException;
import br.org.jslg.repository.PresencaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PresencaService {
    private final PresencaRepository presencas;
    private final MembroService membros;
    private final EventoService eventos;
    public PresencaService(PresencaRepository presencas, MembroService membros, EventoService eventos) { this.presencas = presencas; this.membros = membros; this.eventos = eventos; }

    public PresencaResponse registrar(Long eventoId, Long membroId) {
        Evento evento = eventos.obter(eventoId); Membro membro = membros.obter(membroId);
        if (evento.isCancelado()) throw new RegraNegocioException("Não é possível registrar presença em evento cancelado.");
        if (presencas.existsByMembroIdAndEventoId(membroId, eventoId)) throw new RegraNegocioException("A presença deste membro já foi registrada.");
        Presenca p = new Presenca(); p.setEvento(evento); p.setMembro(membro); p.setDataRegistro(LocalDateTime.now());
        return PresencaResponse.from(presencas.save(p));
    }
    public void remover(Long eventoId, Long membroId) {
        Presenca p = presencas.findByMembroIdAndEventoId(membroId, eventoId).orElseThrow(() -> new RecursoNaoEncontradoException("Presença não encontrada."));
        presencas.delete(p);
    }
    @Transactional(readOnly = true)
    public List<PresencaResponse> listarEvento(Long eventoId) { eventos.obter(eventoId); return presencas.findByEventoId(eventoId).stream().map(PresencaResponse::from).toList(); }
    @Transactional(readOnly = true)
    public List<PresencaResponse> historicoMembro(Long membroId) { membros.obter(membroId); return presencas.findByMembroIdOrderByDataRegistroDesc(membroId).stream().map(PresencaResponse::from).toList(); }
}
