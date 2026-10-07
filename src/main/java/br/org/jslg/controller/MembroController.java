package br.org.jslg.controller;

import br.org.jslg.dto.MembroRequest;
import br.org.jslg.dto.MembroResponse;
import br.org.jslg.service.MembroService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/membros")
public class MembroController {
    private final MembroService service;
    public MembroController(MembroService service) { this.service = service; }
    @GetMapping public List<MembroResponse> listar() { return service.listar(); }
    @GetMapping("/{id}") public MembroResponse buscar(@PathVariable Long id) { return service.buscar(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public MembroResponse criar(@Valid @RequestBody MembroRequest request) { return service.criar(request); }
    @PutMapping("/{id}") public MembroResponse atualizar(@PathVariable Long id, @Valid @RequestBody MembroRequest request) { return service.atualizar(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void excluir(@PathVariable Long id) { service.excluir(id); }
}
