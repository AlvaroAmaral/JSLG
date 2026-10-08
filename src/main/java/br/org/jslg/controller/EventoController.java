package br.org.jslg.controller;

import br.org.jslg.dto.EventoRequest;
import br.org.jslg.dto.EventoResponse;
import br.org.jslg.dto.PresencaRequest;
import br.org.jslg.dto.PresencaResponse;
import br.org.jslg.service.EventoService;
import br.org.jslg.service.PresencaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/eventos")
public class EventoController {
    private final EventoService eventos;
    private final PresencaService presencas;
    public EventoController(EventoService eventos, PresencaService presencas) { this.eventos = eventos; this.presencas = presencas; }
    @GetMapping public List<EventoResponse> listar() { return eventos.listar(); }
    @GetMapping("/{id}") public EventoResponse buscar(@PathVariable Long id) { return eventos.buscar(id); }
    @GetMapping("/{id}/arte") public ResponseEntity<byte[]> arte(@PathVariable Long id) {
        var arte = eventos.obterArte(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(arte.getMimeType()))
                .cacheControl(CacheControl.noCache())
                .body(arte.getDados());
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public EventoResponse criar(@Valid @RequestBody EventoRequest request) { return eventos.criar(request); }
    @PutMapping("/{id}") public EventoResponse atualizar(@PathVariable Long id, @Valid @RequestBody EventoRequest request) { return eventos.atualizar(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void excluirRealizado(@PathVariable Long id) { eventos.excluirRealizado(id); }
    @PatchMapping("/{id}/cancelamento") public EventoResponse cancelar(@PathVariable Long id) { return eventos.cancelar(id); }
    @GetMapping("/{id}/presencas") public List<PresencaResponse> listarPresencas(@PathVariable Long id) { return presencas.listarEvento(id); }
    @PostMapping("/{id}/presencas") @ResponseStatus(HttpStatus.CREATED) public PresencaResponse registrarPresenca(@PathVariable Long id, @Valid @RequestBody PresencaRequest request) { return presencas.registrar(id, request.membroId()); }
    @DeleteMapping("/{eventoId}/presencas/{membroId}") @ResponseStatus(HttpStatus.NO_CONTENT) public void removerPresenca(@PathVariable Long eventoId, @PathVariable Long membroId) { presencas.remover(eventoId, membroId); }
}
