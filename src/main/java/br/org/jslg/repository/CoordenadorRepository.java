package br.org.jslg.repository;

import br.org.jslg.domain.Coordenador;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CoordenadorRepository extends JpaRepository<Coordenador, Long> {
    Optional<Coordenador> findByUsuarioIgnoreCase(String usuario);
    Optional<Coordenador> findByUsuarioIgnoreCaseAndAtivoTrue(String usuario);
    boolean existsByUsuarioIgnoreCase(String usuario);
    boolean existsByUsuarioIgnoreCaseAndIdNot(String usuario, Long id);
}
