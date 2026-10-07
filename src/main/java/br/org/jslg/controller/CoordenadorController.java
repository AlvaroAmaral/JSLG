package br.org.jslg.controller;

import br.org.jslg.dto.CoordenadorRequest;
import br.org.jslg.dto.CoordenadorAtualizacaoRequest;
import br.org.jslg.dto.CoordenadorResponse;
import br.org.jslg.service.CoordenadorService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

@RestController
@RequestMapping("/api/coordenadores")
public class CoordenadorController {
    private final CoordenadorService service;

    public CoordenadorController(CoordenadorService service) {
        this.service = service;
    }

    @GetMapping
    public List<CoordenadorResponse> listar() {
        return service.listar();
    }

    @PostMapping
    public CoordenadorResponse criar(@Valid @RequestBody CoordenadorRequest request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public CoordenadorResponse atualizar(@PathVariable Long id, @Valid @RequestBody CoordenadorAtualizacaoRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
