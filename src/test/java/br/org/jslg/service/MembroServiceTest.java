package br.org.jslg.service;

import br.org.jslg.domain.Membro;
import br.org.jslg.dto.MembroRequest;
import br.org.jslg.exception.RegraNegocioException;
import br.org.jslg.repository.MembroRepository;
import br.org.jslg.repository.PresencaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MembroServiceTest {

    @Mock MembroRepository repository;
    @Mock PresencaRepository presencas;
    @InjectMocks MembroService service;

    @Test
    void criarRecusaDadosDuplicadosEnaoPersiste() {
        when(repository.existsByNomeIgnoreCaseAndInstagramAndTelefone("Ana", "ana", "(11) 96059-7491"))
                .thenReturn(true);

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.criar(new MembroRequest(" Ana ", "@ana", "(11) 96059-7491")));

        assertEquals("J\u00e1 existe um membro com esses mesmos dados.", erro.getMessage());
        verify(repository, never()).save(any(Membro.class));
    }

    @Test
    void excluirMembroComPresencaRecusaEPreservaMembro() {
        Membro membro = new Membro();
        when(repository.findById(7L)).thenReturn(Optional.of(membro));
        when(presencas.existsByMembroId(7L)).thenReturn(true);

        RegraNegocioException erro = assertThrows(RegraNegocioException.class, () -> service.excluir(7L));

        assertEquals("N\u00e3o é possível remover este membro porque existem presenças vinculadas. O histórico dos eventos foi preservado.", erro.getMessage());
        verify(repository, never()).delete(any(Membro.class));
    }

    @Test
    void excluirMembroSemPresencaRemoveRegistro() {
        Membro membro = new Membro();
        when(repository.findById(7L)).thenReturn(Optional.of(membro));
        when(presencas.existsByMembroId(7L)).thenReturn(false);

        service.excluir(7L);

        verify(repository).delete(membro);
    }

    @Test
    void atualizarPermiteManterOsPropriosDados() {
        Membro membro = new Membro();
        membro.setId(7L);
        when(repository.findById(7L)).thenReturn(Optional.of(membro));
        when(repository.existsByNomeIgnoreCaseAndInstagramAndTelefoneAndIdNot("Ana", "ana", "(11) 96059-7491", 7L))
                .thenReturn(false);
        when(repository.save(membro)).thenReturn(membro);

        var resposta = service.atualizar(7L, new MembroRequest("Ana", "@ana", "(11) 96059-7491"));

        assertEquals(7L, resposta.id());
        verify(repository).save(membro);
    }

    @Test
    void atualizarRecusaDadosQuePertencemAOutroMembro() {
        Membro membro = new Membro();
        when(repository.findById(7L)).thenReturn(Optional.of(membro));
        when(repository.existsByNomeIgnoreCaseAndInstagramAndTelefoneAndIdNot("Ana", "ana", "(11) 96059-7491", 7L))
                .thenReturn(true);

        assertThrows(RegraNegocioException.class,
                () -> service.atualizar(7L, new MembroRequest("Ana", "@ana", "(11) 96059-7491")));
        verify(repository, never()).save(any(Membro.class));
    }
}
