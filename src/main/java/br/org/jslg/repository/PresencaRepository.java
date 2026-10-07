package br.org.jslg.repository;

import br.org.jslg.domain.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface PresencaRepository extends JpaRepository<Presenca, Long> {
    boolean existsByMembroIdAndEventoId(Long membroId, Long eventoId);
    Optional<Presenca> findByMembroIdAndEventoId(Long membroId, Long eventoId);
    @EntityGraph(attributePaths = {"membro", "evento"})
    List<Presenca> findByEventoId(Long eventoId);

    @EntityGraph(attributePaths = {"membro", "evento"})
    List<Presenca> findByMembroIdOrderByDataRegistroDesc(Long membroId);
}
