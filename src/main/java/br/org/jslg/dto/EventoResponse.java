package br.org.jslg.dto;
import br.org.jslg.domain.Evento;
import java.time.LocalDateTime;
public record EventoResponse(Long id, String titulo, LocalDateTime dataHora, String local, boolean cancelado, String descricao, boolean temArte) {
    public static EventoResponse from(Evento e) { return new EventoResponse(e.getId(), e.getTitulo(), e.getDataHora(), e.getLocal(), e.isCancelado(), e.getDescricao(), e.isTemArte()); }
}
