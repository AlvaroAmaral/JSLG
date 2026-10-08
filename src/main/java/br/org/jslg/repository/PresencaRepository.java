package br.org.jslg.repository;

import br.org.jslg.domain.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PresencaRepository extends JpaRepository<Presenca, Long> {
    @Modifying
    @Query("delete from Presenca p where p.evento.id = :eventoId")
    int excluirTodasDoEvento(@Param("eventoId") Long eventoId);

    boolean existsByMembroIdAndEventoId(Long membroId, Long eventoId);
    Optional<Presenca> findByMembroIdAndEventoId(Long membroId, Long eventoId);
    @EntityGraph(attributePaths = {"membro", "evento"})
    List<Presenca> findByEventoId(Long eventoId);

    @EntityGraph(attributePaths = {"membro", "evento"})
    List<Presenca> findByMembroIdOrderByDataRegistroDesc(Long membroId);
}
