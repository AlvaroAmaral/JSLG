package br.org.jslg.service;

import br.org.jslg.domain.Evento;
import br.org.jslg.domain.Membro;
import br.org.jslg.exception.RegraNegocioException;
import br.org.jslg.repository.PresencaRepository;
import br.org.jslg.repository.MembroRepository;
import br.org.jslg.repository.EventoRepository;
import br.org.jslg.repository.EventoArteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PresencaServiceTest {

    @Mock PresencaRepository presencas;
    @Mock MembroRepository membroRepository;
    @Mock EventoRepository eventoRepository;
    @Mock EventoArteRepository arteRepository;
    MembroService membros;
    EventoService eventos;
    PresencaService service;

    @BeforeEach
    void configurar() {
        membros = new MembroService(membroRepository, presencas);
        eventos = new EventoService(eventoRepository, arteRepository, presencas);
        service = new PresencaService(presencas, membros, eventos);
    }

    @Test
    void registroDuplicadoERecusado() {
        Evento evento = new Evento();
        Membro membro = new Membro();
        when(eventoRepository.findById(3L)).thenReturn(java.util.Optional.of(evento));
        when(membroRepository.findById(8L)).thenReturn(java.util.Optional.of(membro));
        when(presencas.existsByMembroIdAndEventoId(8L, 3L)).thenReturn(true);

        assertThrows(RegraNegocioException.class, () -> service.registrar(3L, 8L));
        verify(presencas, never()).save(any());
    }

    @Test
    void eventoCanceladoNaoAceitaPresenca() {
        Evento evento = new Evento();
        evento.setCancelado(true);
        when(eventoRepository.findById(3L)).thenReturn(java.util.Optional.of(evento));
        when(membroRepository.findById(8L)).thenReturn(java.util.Optional.of(new Membro()));

        assertThrows(RegraNegocioException.class, () -> service.registrar(3L, 8L));
        verify(presencas, never()).save(any());
    }
}
