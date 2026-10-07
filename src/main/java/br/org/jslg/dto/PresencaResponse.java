package br.org.jslg.dto;
import br.org.jslg.domain.Presenca;
import java.time.LocalDateTime;
public record PresencaResponse(Long id, Long membroId, String membroNome, Long eventoId, String eventoTitulo, LocalDateTime dataRegistro) {
    public static PresencaResponse from(Presenca p) {
        return new PresencaResponse(p.getId(), p.getMembro().getId(), p.getMembro().getNome(), p.getEvento().getId(), p.getEvento().getTitulo(), p.getDataRegistro());
    }
}
