package br.org.jslg.repository;

import br.org.jslg.domain.Membro;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembroRepository extends JpaRepository<Membro, Long> {
    boolean existsByNomeIgnoreCaseAndInstagramAndTelefone(String nome, String instagram, String telefone);
    boolean existsByNomeIgnoreCaseAndInstagramAndTelefoneAndIdNot(String nome, String instagram, String telefone, Long id);
}
