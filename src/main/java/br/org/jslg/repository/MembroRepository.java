package br.org.jslg.repository;

import br.org.jslg.domain.Membro;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembroRepository extends JpaRepository<Membro, Long> { }
