package br.org.jslg.controller;

import br.org.jslg.dto.PresencaResponse;
import br.org.jslg.service.PresencaService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/membros/{membroId}/presencas")
public class PresencaController {
    private final PresencaService service;
    public PresencaController(PresencaService service) { this.service = service; }
    @GetMapping public List<PresencaResponse> historico(@PathVariable Long membroId) { return service.historicoMembro(membroId); }
}
