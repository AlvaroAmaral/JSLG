package br.org.jslg.dto;
import br.org.jslg.domain.Membro;
public record MembroResponse(Long id, String nome, String instagram, String telefone) {
    public static MembroResponse from(Membro m) { return new MembroResponse(m.getId(), m.getNome(), m.getInstagram(), m.getTelefone()); }
}
