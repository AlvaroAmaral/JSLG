package br.org.jslg.controller;

import br.org.jslg.dto.LoginRequest;
import br.org.jslg.dto.LoginResponse;
import br.org.jslg.service.AutenticacaoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/auth")
public class AutenticacaoController {
    private final AutenticacaoService service;
    public AutenticacaoController(AutenticacaoService service) { this.service = service; }
    @Operation(summary = "Autenticar coordenador", security = {})
    @PostMapping("/login") public LoginResponse login(@Valid @RequestBody LoginRequest request) { return service.login(request); }
}
